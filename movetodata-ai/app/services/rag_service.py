"""
rag_service.py — RAG (Retrieval-Augmented Generation) orienté Data Catalog (F14).

Fournit l'indexation vectorielle des Data Products OpenMetadata et la recherche
sémantique via ChromaDB (persistance disque) + Ollama embeddings (self-hosted).

Sovereignty contract:
  - Aucun appel réseau externe — Ollama self-hosted uniquement.
  - Aucun credential en dur — os.getenv(...) exclusivement.
  - Upsert idempotent : ré-indexer n'engendre pas de doublons.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (variables d'environnement)
# ---------------------------------------------------------------------------

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
OPENMETADATA_URL: str = os.getenv("OPENMETADATA_URL", "http://openmetadata:8585")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
RAG_PERSIST_DIR: str = os.getenv(
    "RAG_PERSIST_DIR", "/opt/movetodata/data/rag/catalog"
)
RAG_COLLECTION: str = "catalog_data_products"
RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))

# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------


class EmbeddingError(RuntimeError):
    """Levée lorsque l'appel à l'API Ollama /api/embeddings échoue."""


# ---------------------------------------------------------------------------
# ChromaDB initialisation (lazy singleton)
# ---------------------------------------------------------------------------

import chromadb  # noqa: E402  (import after stdlib/env block for clarity)
import chromadb.errors  # noqa: E402


def _init_collection() -> chromadb.Collection:
    """
    Crée ou récupère la collection ChromaDB.

    En cas de corruption (`InvalidCollectionException`), la collection est
    supprimée puis recréée.
    """
    client = chromadb.PersistentClient(path=RAG_PERSIST_DIR)
    try:
        return client.get_or_create_collection(
            name=RAG_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    except chromadb.errors.InvalidCollectionException:
        logger.warning(
            "ChromaDB collection '%s' corrompue — suppression et recréation.",
            RAG_COLLECTION,
        )
        client.delete_collection(name=RAG_COLLECTION)
        return client.get_or_create_collection(
            name=RAG_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )


_client: chromadb.ClientAPI = chromadb.PersistentClient(path=RAG_PERSIST_DIR)
_collection: chromadb.Collection = _init_collection()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def embed(text: str) -> list[float]:
    """
    Appelle Ollama /api/embeddings et retourne le vecteur d'embedding.

    Raises:
        EmbeddingError: si l'appel réseau échoue ou si Ollama est injoignable.
    """
    payload: dict[str, Any] = {"model": EMBEDDING_MODEL, "prompt": text}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/embeddings", json=payload
            )
            response.raise_for_status()
            data: dict[str, Any] = response.json()
            return data["embedding"]
    except httpx.ConnectError as exc:
        logger.error(
            "embed: impossible de joindre Ollama sur %s — %s", OLLAMA_URL, exc
        )
        raise EmbeddingError(
            f"Cannot connect to Ollama at {OLLAMA_URL}"
        ) from exc
    except httpx.TimeoutException as exc:
        logger.error("embed: timeout lors de l'appel Ollama embeddings — %s", exc)
        raise EmbeddingError("Ollama embeddings request timed out") from exc
    except Exception as exc:
        logger.error("embed: erreur inattendue — %s", exc)
        raise EmbeddingError(f"Embedding failed: {exc}") from exc


async def index_data_product(dp: dict[str, Any]) -> str:
    """
    Indexe (ou met à jour) un Data Product dans ChromaDB.

    L'opération est idempotente : upsert par `fqn` (ou `id` si fqn absent).

    Returns:
        L'identifiant upserted.
    """
    # Construire le texte représentatif
    tags_text = " ".join(
        t.get("tagFQN", "") for t in dp.get("tags", []) if isinstance(t, dict)
    )
    domain_name: str = ""
    if isinstance(dp.get("domain"), dict):
        domain_name = dp["domain"].get("name", "")

    text = (
        f"{dp.get('displayName') or dp.get('name', '')} "
        f"{dp.get('description', '')} "
        f"{tags_text} "
        f"{domain_name} "
        f"{dp.get('dataProductType', '')}"
    ).strip()

    vector = await embed(text)

    doc_id: str = dp.get("fqn") or dp.get("id", "")
    if not doc_id:
        raise ValueError("Data Product sans 'fqn' ni 'id' — impossible d'indexer.")

    metadata: dict[str, str] = {
        "fqn": dp.get("fqn", ""),
        "name": dp.get("name", ""),
        "domain": domain_name,
        "qualityLevel": str(dp.get("qualityLevel", "")),
        "accessPolicy": str(dp.get("accessPolicy", "")),
        "description": (dp.get("description", "") or "")[:500],
    }

    _collection.upsert(
        ids=[doc_id],
        embeddings=[vector],
        metadatas=[metadata],
        documents=[text],
    )

    logger.info(
        '{"event": "rag_index", "id": "%s", "name": "%s", "domain": "%s"}',
        doc_id,
        metadata["name"],
        metadata["domain"],
    )
    return doc_id


async def index_all_data_products() -> dict[str, int]:
    """
    Récupère tous les Data Products depuis OpenMetadata et les indexe dans ChromaDB.

    Idempotent — utilise upsert. Pagine jusqu'à 10 pages (limite=100/page).

    Raises:
        ValueError: si OPENMETADATA_AUTH_TOKEN est absent.

    Returns:
        {"indexed": N, "errors": M}
    """
    token: str | None = os.getenv("OPENMETADATA_AUTH_TOKEN")
    if not token:
        raise ValueError(
            "OPENMETADATA_AUTH_TOKEN est absent — impossible d'indexer le catalog."
        )

    headers = {"Authorization": f"Bearer {token}"}
    indexed = 0
    errors = 0
    after: str | None = None
    max_pages = 10

    async with httpx.AsyncClient(timeout=60.0) as client:
        for _ in range(max_pages):
            params: dict[str, Any] = {
                "limit": 100,
                "fields": "tags,domain,extension",
            }
            if after:
                params["after"] = after

            try:
                response = await client.get(
                    f"{OPENMETADATA_URL}/api/v1/dataProducts",
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()
                data: dict[str, Any] = response.json()
            except Exception as exc:
                logger.error(
                    "index_all_data_products: erreur lors de la récupération — %s", exc
                )
                errors += 1
                break

            items: list[dict[str, Any]] = data.get("data", [])
            for dp in items:
                try:
                    await index_data_product(dp)
                    indexed += 1
                except Exception as exc:
                    logger.error(
                        '{"event": "rag_index_error", "dp": "%s", "error": "%s"}',
                        dp.get("fqn") or dp.get("id", "?"),
                        exc,
                    )
                    errors += 1

            after = data.get("paging", {}).get("after")
            if not after:
                break

    logger.info(
        '{"event": "rag_index_complete", "indexed": %d, "errors": %d}',
        indexed,
        errors,
    )
    return {"indexed": indexed, "errors": errors}


async def search(query: str, top_k: int = RAG_TOP_K) -> list[dict[str, Any]]:
    """
    Recherche les Data Products les plus proches sémantiquement de la requête.

    Returns:
        Liste de dicts triés par score décroissant.
        Retourne [] si la collection est vide.
    """
    if _collection.count() == 0:
        return []

    vector = await embed(query)

    results = _collection.query(
        query_embeddings=[vector],
        n_results=min(top_k, _collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    output: list[dict[str, Any]] = []
    metadatas: list[dict[str, Any]] = results.get("metadatas", [[]])[0]
    distances: list[float] = results.get("distances", [[]])[0]

    for meta, dist in zip(metadatas, distances):
        output.append(
            {
                "fqn": meta.get("fqn", ""),
                "name": meta.get("name", ""),
                "description": meta.get("description", ""),
                "domain": meta.get("domain", ""),
                "qualityLevel": meta.get("qualityLevel", ""),
                "accessPolicy": meta.get("accessPolicy", ""),
                "score": round(1.0 - dist, 4),
            }
        )

    logger.info(
        '{"event": "rag_search", "query_len": %d, "top_k": %d, "results": %d}',
        len(query),
        top_k,
        len(output),
    )
    return output


def collection_count() -> int:
    """Retourne le nombre de documents indexés dans la collection."""
    return _collection.count()
