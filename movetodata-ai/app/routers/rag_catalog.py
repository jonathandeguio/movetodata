"""
rag_catalog.py — Router RAG Catalog (F14).

Expose trois endpoints :
  POST /catalog/rag/index   — déclenche l'indexation de tous les Data Products
  GET  /catalog/rag/search  — recherche sémantique dans le catalog
  GET  /catalog/rag/status  — état de la collection ChromaDB
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services import rag_service
from app.services.rag_service import EMBEDDING_MODEL, RAG_COLLECTION

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/catalog/rag", tags=["RAG Catalog"])


@router.post(
    "/index",
    summary="Indexer tous les Data Products OpenMetadata dans ChromaDB",
)
async def index_catalog() -> dict[str, Any]:
    """
    Déclenche l'indexation (upsert) de tous les Data Products disponibles
    dans OpenMetadata vers la collection ChromaDB.

    Idempotent — peut être appelé plusieurs fois sans créer de doublons.
    """
    try:
        result = await rag_service.index_all_data_products()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("index_catalog: erreur inattendue — %s", exc)
        raise HTTPException(status_code=500, detail="Indexation échouée") from exc

    count = rag_service.collection_count()
    return {
        "status": "ok",
        "indexed": result["indexed"],
        "errors": result["errors"],
        "collection_count": count,
    }


@router.get(
    "/search",
    summary="Recherche sémantique dans le Data Catalog",
)
async def search_catalog(
    q: str = Query(..., description="Requête en langage naturel"),
    top_k: int = Query(default=5, ge=1, le=50, description="Nombre de résultats"),
) -> dict[str, Any]:
    """
    Recherche les Data Products les plus pertinents par similarité cosinus.

    Retourne une liste vide si aucun document n'est encore indexé.
    """
    try:
        results = await rag_service.search(q, top_k=top_k)
    except rag_service.EmbeddingError as exc:
        raise HTTPException(
            status_code=503, detail=f"Service d'embedding indisponible : {exc}"
        ) from exc
    except Exception as exc:
        logger.error("search_catalog: erreur inattendue — %s", exc)
        raise HTTPException(status_code=500, detail="Recherche échouée") from exc

    return {"results": results, "count": len(results)}


@router.get(
    "/status",
    summary="État de la collection RAG ChromaDB",
)
async def rag_status() -> dict[str, Any]:
    """Retourne le nom de la collection, le nombre de documents indexés et le modèle d'embedding."""
    return {
        "collection": RAG_COLLECTION,
        "document_count": rag_service.collection_count(),
        "embedding_model": EMBEDDING_MODEL,
    }
