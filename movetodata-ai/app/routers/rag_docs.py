"""
rag_docs.py — Router RAG Documentation plateforme (F15).

Expose trois endpoints :
  POST /docs/rag/index   — indexe tous les fichiers Markdown de la documentation
  GET  /docs/rag/search  — recherche sémantique dans la documentation
  GET  /docs/rag/status  — état de la collection ChromaDB
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services import rag_docs_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/docs/rag", tags=["RAG Documentation"])


@router.post(
    "/index",
    summary="Indexer la documentation plateforme dans ChromaDB",
)
async def index_docs() -> dict[str, Any]:
    """
    Déclenche l'indexation (upsert) de tous les fichiers Markdown du
    répertoire configuré par DOCS_PATH.

    Idempotent — peut être appelé plusieurs fois sans créer de doublons.
    À appeler après chaque mise à jour de la documentation.
    """
    try:
        result = await rag_docs_service.index_docs()
    except Exception as exc:
        logger.error("index_docs: erreur inattendue — %s", exc)
        raise HTTPException(status_code=500, detail="Indexation échouée") from exc

    return {
        "status": "ok",
        "indexed":  result["indexed"],
        "errors":   result["errors"],
        "skipped":  result["skipped"],
        "collection_count": rag_docs_service.docs_collection_count(),
    }


@router.get(
    "/search",
    summary="Recherche sémantique dans la documentation plateforme",
)
async def search_docs(
    q:     str = Query(..., description="Question en langage naturel"),
    top_k: int = Query(default=4, ge=1, le=20, description="Nombre de résultats"),
) -> dict[str, Any]:
    """
    Retourne les sections de documentation les plus pertinentes pour la question.
    """
    try:
        results = await rag_docs_service.search_docs(q, top_k=top_k)
    except Exception as exc:
        logger.error("search_docs: erreur inattendue — %s", exc)
        raise HTTPException(status_code=500, detail="Recherche échouée") from exc

    return {"results": results, "count": len(results)}


@router.get(
    "/status",
    summary="État de la collection RAG Documentation",
)
async def docs_rag_status() -> dict[str, Any]:
    return {
        "collection":       rag_docs_service.DOCS_COLLECTION,
        "document_count":   rag_docs_service.docs_collection_count(),
        "embedding_model":  rag_docs_service.EMBEDDING_MODEL,
        "docs_path":        rag_docs_service.DOCS_PATH,
    }
