"""
chat.py — POST /chat SSE streaming router (F3 — Assistant IA conversationnel).

Receives a message, conversation history and source context from the Boson
proxy and streams the LLM response token by token using Server-Sent Events.

Model: qwen2.5:14b via Ollama (self-hosted, sovereign).

Sovereignty contract:
  - Only schema DDL (column names + types) is included in the prompt —
    never actual data values.
  - Ollama runs within the MoveToData infrastructure; no external network
    call is ever made at runtime.
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.llm_service import OLLAMA_URL, CHAT_MODEL, TIMEOUT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Chat"])

# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class ChatContext(BaseModel):
    source_id: Optional[str] = None
    schema_info: Optional[str] = None
    open_chart_ids: List[int] = Field(default_factory=list)
    # Catalog context — set when the user has a DataProduct page open
    catalog_product_name: Optional[str] = None
    catalog_description: Optional[str] = None
    catalog_domain: Optional[str] = None
    catalog_quality_level: Optional[str] = None
    catalog_columns: Optional[str] = None  # JSON string of column list


class HistoryMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    context: Optional[ChatContext] = None
    history: List[HistoryMessage] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# System prompt builder
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT_BASE = """\
Tu es l'assistant IA intégré à la plateforme MoveToData. \
MoveToData est une plateforme souveraine de gestion de données qui permet d'ingérer, \
transformer, gouverner et visualiser des données via des pipelines et des datasets.

Quand un utilisateur pose une question sur ses données sans avoir ouvert de dataset, \
guide-le vers les fonctionnalités de la plateforme : \
ouvrir un dataset dans le Catalogue, utiliser les graphiques et tableaux de bord, \
ou lancer un pipeline. Ne demande pas de noms de tables ou de colonnes en dehors \
du contexte MoveToData.

Règles :
- Réponds en français par défaut, en anglais si l'utilisateur écrit en anglais
- Sois concis et orienté action (dis ce qu'il faut faire dans la plateforme)
- Si aucun dataset n'est ouvert, propose d'en ouvrir un dans le Catalogue
- Ne jamais inventer des noms de tables ou colonnes qui ne sont pas fournis\
"""

_SYSTEM_PROMPT_WITH_SCHEMA = """\
Tu es un assistant data analyst pour la plateforme MoveToData. \
Tu aides les utilisateurs à explorer leurs données, générer des requêtes SQL \
et interpréter des résultats.

Source de données active :
{schema_info}

Règles :
- Réponds en français par défaut, en anglais si l'utilisateur écrit en anglais
- Pour les questions sur les données, génère du SQL SELECT uniquement
- Utilise UNIQUEMENT les tables et colonnes présentes dans le schéma ci-dessus
- Sois concis et précis
- Ne jamais deviner des valeurs qui n'existent pas dans le schéma\
"""

_SYSTEM_PROMPT_WITH_CATALOG = """\
Tu es l'assistant IA intégré à la plateforme MoveToData, spécialisé en gouvernance des données. \
L'utilisateur consulte actuellement le Data Catalog et a ouvert la fiche d'un Data Product.

Data Product actif :
  Nom        : {catalog_product_name}
  Domaine    : {catalog_domain}
  Qualité    : {catalog_quality_level}
  Description: {catalog_description}
{catalog_columns_block}
Tu peux :
- Expliquer le contenu et le contexte métier de ce Data Product
- Répondre aux questions sur ses colonnes, sa qualité, son niveau de certification
- Suggérer des cas d'usage, des transformations ou des améliorations de gouvernance
- Détecter des risques RGPD ou PII dans les colonnes exposées

Règles :
- Réponds en français par défaut, en anglais si l'utilisateur écrit en anglais
- Sois précis sur la gouvernance (PII, RGPD, qualité, lineage)
- Ne jamais inventer des données qui ne sont pas dans le contexte fourni\
"""


def _build_system_prompt(
    context: Optional[ChatContext], rag_context: str = ""
) -> str:
    if context and context.catalog_product_name:
        columns_block = ""
        if context.catalog_columns:
            try:
                import json as _json
                cols = _json.loads(context.catalog_columns)
                if isinstance(cols, list) and cols:
                    col_lines = "\n".join(
                        f"    - {c.get('columnName', c.get('name', '?'))}"
                        + (f" [{c.get('piiType')}]" if c.get("piiType") else "")
                        for c in cols[:30]
                    )
                    columns_block = f"  Colonnes   :\n{col_lines}\n"
            except Exception:
                pass
        base = _SYSTEM_PROMPT_WITH_CATALOG.format(
            catalog_product_name=context.catalog_product_name,
            catalog_domain=context.catalog_domain or "—",
            catalog_quality_level=context.catalog_quality_level or "—",
            catalog_description=context.catalog_description or "—",
            catalog_columns_block=columns_block,
        )
    elif context and context.schema_info:
        base = _SYSTEM_PROMPT_WITH_SCHEMA.format(schema_info=context.schema_info)
    else:
        base = _SYSTEM_PROMPT_BASE
    return base + rag_context


# ---------------------------------------------------------------------------
# SSE generator
# ---------------------------------------------------------------------------

async def _stream_ollama_chat(
    messages: List[Dict[str, str]],
) -> AsyncGenerator[str, None]:
    """
    Call Ollama /api/chat with stream=True and yield SSE-formatted lines.

    Yields:
      - ``data: {"type": "token", "content": "..."}`` for each partial token
      - ``data: {"type": "done", "model": "...", "tokens_used": N}``
      - ``data: {"type": "error", "error": "LLM_UNAVAILABLE"}`` on failure

    Empty lines (SSE event separators) are yielded after each data line.
    """
    payload = {
        "model": CHAT_MODEL,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": 0.4,
            "num_predict": 2048,
        },
    }

    total_tokens = 0

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT)) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()

                async for raw_line in response.aiter_lines():
                    if not raw_line:
                        continue
                    try:
                        chunk = json.loads(raw_line)
                    except json.JSONDecodeError:
                        continue

                    # Ollama /api/chat stream format:
                    # {"model":..., "message":{"role":"assistant","content":"..."}, "done":false}
                    content: str = chunk.get("message", {}).get("content", "")
                    if content:
                        total_tokens += 1  # approximate — Ollama omits per-token counts
                        event_data = json.dumps(
                            {"type": "token", "content": content}
                        )
                        yield f"data: {event_data}\n\n"

                    if chunk.get("done"):
                        # Ollama may provide eval_count for token count
                        eval_count = chunk.get("eval_count", total_tokens)
                        done_data = json.dumps(
                            {
                                "type": "done",
                                "model": CHAT_MODEL,
                                "tokens_used": eval_count,
                            }
                        )
                        yield f"data: {done_data}\n\n"
                        return

    except httpx.ConnectError:
        logger.error(
            "Cannot connect to Ollama at %s — ensure the service is running.", OLLAMA_URL
        )
        error_data = json.dumps({"type": "error", "error": "LLM_UNAVAILABLE"})
        yield f"data: {error_data}\n\n"
    except httpx.TimeoutException:
        logger.error("Ollama request timed out after %s seconds.", TIMEOUT)
        error_data = json.dumps({"type": "error", "error": "LLM_TIMEOUT"})
        yield f"data: {error_data}\n\n"
    except Exception as exc:
        logger.error("Unexpected error during Ollama streaming: %s", exc)
        error_data = json.dumps({"type": "error", "error": "LLM_ERROR"})
        yield f"data: {error_data}\n\n"


# ---------------------------------------------------------------------------
# Router endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/chat",
    summary="Chat with the AI assistant (SSE streaming)",
    response_class=StreamingResponse,
)
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    Build the Ollama message list (system prompt + history + current message)
    and stream the response as SSE.

    The Boson proxy is responsible for:
    - Authenticating the user (JWT validation)
    - Persisting the user message before calling this endpoint
    - Persisting the assistant message after the stream ends

    This endpoint only performs the LLM inference.
    """
    logger.info(
        "chat: session=%s history_len=%d source=%s",
        request.session_id,
        len(request.history),
        request.context.source_id if request.context else None,
    )

    message_lower = request.message.lower()
    rag_context: str = ""

    # RAG Catalog — Data Products pertinents
    _CATALOG_KEYWORDS = {
        "dataset", "données", "data", "catalog", "catalogue", "product",
        "schéma", "schema", "table", "source", "bronze", "silver", "gold",
        "lignage", "lineage", "domaine", "domain",
    }
    if any(kw in message_lower for kw in _CATALOG_KEYWORDS):
        try:
            from app.services import rag_service
            results = await rag_service.search(request.message, top_k=3)
            if results:
                lines = []
                for r in results:
                    lines.append(
                        f"- **{r['name']}** (domaine: {r.get('domain', '?')}, "
                        f"qualité: {r.get('qualityLevel', '?')}, accès: {r.get('accessPolicy', '?')})\n"
                        f"  {r.get('description', '')[:200]}"
                    )
                rag_context += (
                    "\n\nData Products pertinents dans le catalog :\n"
                    + "\n".join(lines)
                )
        except Exception as exc:
            logger.warning("RAG catalog unavailable: %s", exc)

    # RAG Docs — Documentation plateforme (questions "comment faire")
    _DOCS_KEYWORDS = {
        "comment", "how", "créer", "creer", "configurer", "utiliser", "ajouter",
        "connecter", "importer", "exporter", "dashboard", "tableau de bord",
        "graphique", "chart", "visualis", "projet", "branch", "branche",
        "transform", "build", "pipeline", "sécurité", "securite", "rôle", "role",
        "permiss", "utilisateur", "user", "guide", "aide", "help", "tutorial",
        "fonctionne", "qu'est-ce", "kesako", "expliqu", "c'est quoi",
        "analys", "ingestion", "ingérer", "ingerer", "qualité", "qualite",
        "schedule", "planifi", "orchest", "lineage", "lignage", "gouvern",
        "erreur", "error", "échou", "echec", "relancer", "debug",
        "que fait", "à quoi", "quoi sert", "quelles fonctionnalit",
    }
    if any(kw in message_lower for kw in _DOCS_KEYWORDS):
        try:
            from app.services import rag_docs_service
            doc_results = await rag_docs_service.search_docs(request.message, top_k=3)
            if doc_results:
                lines = []
                for r in doc_results:
                    lines.append(
                        f"### {r['section']} ({r['file']})\n{r['text'][:400]}"
                    )
                rag_context += (
                    "\n\nDocumentation plateforme pertinente :\n"
                    + "\n\n".join(lines)
                )
        except Exception as exc:
            logger.warning("RAG docs unavailable: %s", exc)

    system_prompt = _build_system_prompt(request.context, rag_context)

    # Build message list for Ollama /api/chat
    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

    # Append history (already ordered oldest-first by Boson)
    for h in request.history:
        messages.append({"role": h.role, "content": h.content})

    # Append current user message (may already be in history — Boson sends it
    # both in history and as the top-level "message" field; we deduplicate by
    # checking the last history entry)
    if not request.history or request.history[-1].content != request.message:
        messages.append({"role": "user", "content": request.message})

    return StreamingResponse(
        _stream_ollama_chat(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering if present
        },
    )
