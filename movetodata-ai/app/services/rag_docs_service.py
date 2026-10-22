"""
rag_docs_service.py — RAG sur la documentation plateforme MoveToData (F15).

Indexe les fichiers Markdown de la documentation dans une collection ChromaDB
dédiée et expose une recherche sémantique utilisable par l'assistant IA.

Stratégie de chunking :
  - Chaque fichier Markdown est découpé par sections (## et ###).
  - Chaque chunk = titre de section + contenu (max CHUNK_MAX_CHARS).
  - Les chunks trop courts (< CHUNK_MIN_CHARS) sont ignorés.
  - L'ID ChromaDB = hash SHA-256 du chemin relatif + titre de section.

Sovereignty contract :
  - Aucun appel réseau externe — Ollama self-hosted exclusivement.
  - Aucun credential en dur — os.getenv(...) uniquement.
"""
from __future__ import annotations

import hashlib
import logging
import os
import re
from pathlib import Path
from typing import Any

import chromadb
import chromadb.errors
import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

DOCS_PATH: str = os.getenv("DOCS_PATH", "/movetodata-docs/docs")
DOCS_RAG_PERSIST_DIR: str = os.getenv(
    "DOCS_RAG_PERSIST_DIR", "/opt/movetodata/data/rag/docs"
)
DOCS_COLLECTION: str = "platform_docs"

CHUNK_MIN_CHARS: int = 80
CHUNK_MAX_CHARS: int = 1_200   # ~300 tokens — optimal for nomic-embed-text

# ---------------------------------------------------------------------------
# ChromaDB — collection dédiée docs
# ---------------------------------------------------------------------------


def _init_docs_collection() -> chromadb.Collection:
    client = chromadb.PersistentClient(path=DOCS_RAG_PERSIST_DIR)
    try:
        return client.get_or_create_collection(
            name=DOCS_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    except chromadb.errors.InvalidCollectionException:
        logger.warning("ChromaDB docs collection corrompue — recréation.")
        client.delete_collection(name=DOCS_COLLECTION)
        return client.get_or_create_collection(
            name=DOCS_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )


_docs_collection: chromadb.Collection = _init_docs_collection()


# ---------------------------------------------------------------------------
# Embedding (réutilise le même Ollama que rag_service)
# ---------------------------------------------------------------------------


async def _embed(text: str) -> list[float]:
    payload = {"model": EMBEDDING_MODEL, "prompt": text}
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{OLLAMA_URL}/api/embeddings", json=payload)
        response.raise_for_status()
        return response.json()["embedding"]


# ---------------------------------------------------------------------------
# Chunking Markdown
# ---------------------------------------------------------------------------


def _chunk_markdown(content: str, file_label: str) -> list[dict[str, str]]:
    """
    Découpe un fichier Markdown en chunks par sections (## / ###).

    Retourne une liste de dicts :
      { "title": str, "text": str, "file": str }
    """
    # Normalise les fins de ligne
    content = content.replace("\r\n", "\n")

    # Retirer le frontmatter YAML (--- ... ---)
    content = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)

    chunks: list[dict[str, str]] = []

    # Splitter sur les titres ## et ###
    parts = re.split(r"(?m)^(#{2,3} .+)$", content)

    current_title = file_label
    buffer = parts[0].strip() if parts else ""

    i = 1
    while i < len(parts):
        heading = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ""
        i += 2

        # Flush le buffer précédent
        if len(buffer) >= CHUNK_MIN_CHARS:
            chunks.append({
                "title": current_title,
                "text": f"{current_title}\n\n{buffer}"[:CHUNK_MAX_CHARS],
                "file": file_label,
            })

        current_title = heading.lstrip("#").strip()
        buffer = body

    # Dernier chunk
    if len(buffer) >= CHUNK_MIN_CHARS:
        chunks.append({
            "title": current_title,
            "text": f"{current_title}\n\n{buffer}"[:CHUNK_MAX_CHARS],
            "file": file_label,
        })

    return chunks


def _chunk_id(rel_path: str, section_title: str) -> str:
    """Génère un ID stable et unique pour un chunk."""
    key = f"{rel_path}::{section_title}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def index_docs(docs_path: str | None = None) -> dict[str, int]:
    """
    Indexe (upsert) tous les fichiers Markdown du répertoire docs_path.

    Idempotent — ré-indexer ne crée pas de doublons.

    Returns:
        {"indexed": N, "errors": M, "skipped": K}
    """
    root = Path(docs_path or DOCS_PATH)
    if not root.exists():
        logger.error("index_docs: répertoire docs introuvable : %s", root)
        return {"indexed": 0, "errors": 1, "skipped": 0}

    md_files = list(root.rglob("*.md"))
    logger.info("index_docs: %d fichiers Markdown trouvés dans %s", len(md_files), root)

    indexed = errors = skipped = 0

    for md_file in md_files:
        rel = str(md_file.relative_to(root))
        try:
            content = md_file.read_text(encoding="utf-8")
        except Exception as exc:
            logger.error("index_docs: lecture échouée %s — %s", rel, exc)
            errors += 1
            continue

        label = rel.replace("\\", "/").replace(".md", "")
        chunks = _chunk_markdown(content, label)

        if not chunks:
            skipped += 1
            continue

        for chunk in chunks:
            doc_id = _chunk_id(rel, chunk["title"])
            try:
                vector = await _embed(chunk["text"])
                _docs_collection.upsert(
                    ids=[doc_id],
                    embeddings=[vector],
                    metadatas=[{
                        "file": chunk["file"],
                        "section": chunk["title"][:200],
                        "rel_path": rel,
                    }],
                    documents=[chunk["text"]],
                )
                indexed += 1
            except Exception as exc:
                logger.error(
                    "index_docs: embed/upsert échoué [%s § %s] — %s",
                    rel, chunk["title"], exc,
                )
                errors += 1

    logger.info(
        '{"event":"rag_docs_index_complete","indexed":%d,"errors":%d,"skipped":%d}',
        indexed, errors, skipped,
    )
    return {"indexed": indexed, "errors": errors, "skipped": skipped}


async def search_docs(query: str, top_k: int = 4) -> list[dict[str, Any]]:
    """
    Recherche les chunks de documentation les plus pertinents.

    Returns:
        Liste de dicts {"section", "file", "text", "score"}, triée par score décroissant.
        [] si la collection est vide.
    """
    if _docs_collection.count() == 0:
        return []

    try:
        vector = await _embed(query)
    except Exception as exc:
        logger.warning("search_docs: embedding échoué — %s", exc)
        return []

    results = _docs_collection.query(
        query_embeddings=[vector],
        n_results=min(top_k, _docs_collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    output: list[dict[str, Any]] = []
    for meta, doc, dist in zip(
        results.get("metadatas", [[]])[0],
        results.get("documents", [[]])[0],
        results.get("distances", [[]])[0],
    ):
        output.append({
            "section": meta.get("section", ""),
            "file":    meta.get("file", ""),
            "text":    doc[:600],
            "score":   round(1.0 - dist, 4),
        })

    logger.info(
        '{"event":"rag_docs_search","query_len":%d,"results":%d}',
        len(query), len(output),
    )
    return output


def docs_collection_count() -> int:
    return _docs_collection.count()
