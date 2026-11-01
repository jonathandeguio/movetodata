"""
studio.py — Endpoints FastAPI pour le Studio de Webapps IA.

  POST /studio/ai       — chat IA (patch sur définition existante)
  POST /studio/generate — génération complète d'une application

Ces endpoints sont appelés uniquement par le service Boson (proxy interne).
Ils n'exposent aucune donnée utilisateur au LLM — seulement le schéma et l'arbre de composants.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.studio_ai_service import generate_app_definition, run_ai_chat

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/studio", tags=["Studio AI"])


# ---------------------------------------------------------------------------
# Schémas de requête / réponse
# ---------------------------------------------------------------------------


class MessageHistory(BaseModel):
    role: str
    text: str


class AiChatRequest(BaseModel):
    prompt: str
    appDefinition: dict[str, Any] | None = None
    schemaInfo: dict[str, Any] | None = None
    selectedNodeId: str | None = None
    messages: list[MessageHistory] | None = None


class AiChatResponse(BaseModel):
    explanation: str
    patch: list[dict[str, Any]]


class GenerateRequest(BaseModel):
    name: str
    description: str
    datasourceId: str
    tableName: str
    columns: list[dict[str, str]] | None = None


class GenerateResponse(BaseModel):
    explanation: str
    definition: dict[str, Any]


# ---------------------------------------------------------------------------
# POST /studio/ai
# ---------------------------------------------------------------------------


@router.post(
    "/ai",
    response_model=AiChatResponse,
    summary="Chat IA sur une application Studio existante — retourne un patch.",
)
async def studio_ai_chat(req: AiChatRequest) -> AiChatResponse:
    """
    Reçoit une question utilisateur et le contexte de l'application (arbre + requêtes + schéma).
    Appelle Ollama avec l'outil apply_patch.
    Valide le patch (structure + SQL §6).
    Retourne {explanation, patch}.
    """
    history = [{"role": m.role, "text": m.text} for m in (req.messages or [])]

    try:
        result = await run_ai_chat(
            prompt=req.prompt,
            app_definition=req.appDefinition,
            schema_info=req.schemaInfo,
            selected_node_id=req.selectedNodeId,
            history=history,
        )
    except RuntimeError as exc:
        if "LLM_UNAVAILABLE" in str(exc):
            raise HTTPException(
                status_code=503,
                detail={"error": "LLM_UNAVAILABLE", "message": "Le service LLM est indisponible."},
            )
        raise HTTPException(status_code=500, detail={"error": str(exc)})
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "VALIDATION_FAILED", "message": str(exc)},
        )

    return AiChatResponse(
        explanation=result.get("explanation", ""),
        patch=result.get("patch", []),
    )


# ---------------------------------------------------------------------------
# POST /studio/generate
# ---------------------------------------------------------------------------


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Génère une AppDefinition complète à partir d'une description.",
)
async def studio_generate(req: GenerateRequest) -> GenerateResponse:
    """
    Génère une AppDefinition avec 3-5 composants liés à la table indiquée.
    Retourne {explanation, definition}.
    """
    try:
        result = await generate_app_definition(
            name=req.name,
            description=req.description,
            datasource_id=req.datasourceId,
            table_name=req.tableName,
            columns=req.columns,
        )
    except RuntimeError as exc:
        if "LLM_UNAVAILABLE" in str(exc):
            raise HTTPException(
                status_code=503,
                detail={"error": "LLM_UNAVAILABLE", "message": "Le service LLM est indisponible."},
            )
        raise HTTPException(status_code=500, detail={"error": str(exc)})
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "GENERATION_FAILED", "message": str(exc)},
        )

    definition = result.get("definition", {})
    if not isinstance(definition, dict):
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_DEFINITION", "message": "La définition générée n'est pas un objet JSON valide."},
        )

    return GenerateResponse(
        explanation=result.get("explanation", ""),
        definition=definition,
    )
