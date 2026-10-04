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
import os
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Chat"])

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "qwen2.5:14b")
TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "300"))

# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class ChatContext(BaseModel):
    source_id: Optional[str] = None
    schema_info: Optional[str] = None
    open_chart_ids: List[int] = Field(default_factory=list)


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
Tu es un assistant data analyst pour la plateforme MoveToData. \
Tu aides les utilisateurs à explorer leurs données, générer des requêtes SQL \
et interpréter des résultats.

Règles :
- Réponds en français par défaut, en anglais si l'utilisateur écrit en anglais
- Pour les questions sur les données, génère du SQL SELECT uniquement
- Sois concis et précis
- Ne jamais deviner des valeurs qui n'existent pas dans le schéma\
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


def _build_system_prompt(context: Optional[ChatContext]) -> str:
    if context and context.schema_info:
        return _SYSTEM_PROMPT_WITH_SCHEMA.format(schema_info=context.schema_info)
    return _SYSTEM_PROMPT_BASE


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
                            {"type": "token", "content": content}, ensure_ascii=False
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

    system_prompt = _build_system_prompt(request.context)

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
