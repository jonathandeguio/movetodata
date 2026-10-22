"""
describe_dataset.py — POST /describe-dataset router (F6 — AI Import Panel).

Receives column names and the file name from the Boson proxy, then calls the
LLM to generate a suggested dataset name, a French description, and tags.

Sovereignty contract: only column NAMES and the file name are sent to the LLM —
raw cell values are never included in the prompt.
"""
from __future__ import annotations

import json
import logging
import re

from fastapi import APIRouter

from app.models.schemas import DescribeDatasetRequest, DescribeDatasetResponse
from app.services import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Dataset Description"])


@router.post(
    "/describe-dataset",
    response_model=DescribeDatasetResponse,
    summary="Generate a name, description and tags for an imported dataset",
)
async def describe_dataset(request: DescribeDatasetRequest) -> DescribeDatasetResponse:
    """
    1. Build a prompt from the file name and column headers only.
    2. Call qwen2.5:14b via Ollama for name + description + tags (JSON).
    3. Parse the JSON response; fall back to rule-based defaults on failure.
    """
    logger.info("describe-dataset: file=%s cols=%d", request.file_name, len(request.columns))

    prompt = _build_prompt(request.file_name, request.columns)
    raw = await llm_service._call_ollama(prompt)

    result = _parse_response(raw)
    if result is not None:
        return result

    logger.warning("describe-dataset: LLM returned unparseable output — using fallback")
    return _fallback(request.file_name, request.columns)


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_prompt(file_name: str, columns: list[str]) -> str:
    cols_str = ", ".join(columns)
    return (
        "Tu es un expert en gestion de données. "
        "À partir du nom de fichier et des noms de colonnes d'un jeu de données, "
        "génère en français un nom court, une description de 2 à 3 phrases et des tags pertinents.\n\n"
        "Règles :\n"
        "- Le nom doit être court (3 à 6 mots), lisible et descriptif.\n"
        "- La description doit expliquer ce que contient le jeu de données et son usage potentiel.\n"
        "- Les tags doivent être des mots-clés en minuscules (ex: financier, géo, RH, ventes, logistique).\n"
        "- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :\n"
        '  {"name": "...", "description": "...", "tags": ["...", "..."]}\n\n'
        f"Nom du fichier : {file_name}\n"
        f"Colonnes : {cols_str}\n\n"
        "JSON :"
    )


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------

def _parse_response(raw: str) -> DescribeDatasetResponse | None:
    if not raw:
        return None
    # Try direct JSON parse
    try:
        data = json.loads(raw.strip())
        return _dict_to_response(data)
    except (json.JSONDecodeError, KeyError, TypeError):
        pass
    # Try to extract JSON object from surrounding text
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            return _dict_to_response(data)
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    return None


def _dict_to_response(data: dict) -> DescribeDatasetResponse:
    name = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()
    raw_tags = data.get("tags", [])
    tags = [str(t).strip().lower() for t in raw_tags if t] if isinstance(raw_tags, list) else []
    if not name or not description:
        raise ValueError("Missing required fields")
    return DescribeDatasetResponse(name=name, description=description, tags=tags)


# ---------------------------------------------------------------------------
# Rule-based fallback (no LLM required)
# ---------------------------------------------------------------------------

def _fallback(file_name: str, columns: list[str]) -> DescribeDatasetResponse:
    # Derive a readable name from the file name (strip extension, replace separators)
    base = re.sub(r"\.[^.]+$", "", file_name)
    name = re.sub(r"[_\-]+", " ", base).strip().title()
    if not name:
        name = "Jeu de données importé"

    col_preview = ", ".join(columns[:5])
    suffix = f" et {len(columns) - 5} autres colonnes" if len(columns) > 5 else ""
    description = (
        f"Jeu de données importé depuis le fichier « {file_name} ». "
        f"Il contient {len(columns)} colonnes : {col_preview}{suffix}. "
        "Une analyse approfondie est recommandée pour identifier les opportunités de visualisation."
    )

    # Heuristic tags from column names
    tags: list[str] = []
    cols_lower = " ".join(columns).lower()
    if any(k in cols_lower for k in ("date", "mois", "année", "trimestre", "semaine")):
        tags.append("temporel")
    if any(k in cols_lower for k in ("ca", "chiffre", "revenu", "vente", "montant", "prix")):
        tags.append("financier")
    if any(k in cols_lower for k in ("région", "ville", "pays", "département", "lat", "lon")):
        tags.append("géo")
    if any(k in cols_lower for k in ("client", "user", "utilisateur", "contact")):
        tags.append("crm")
    if any(k in cols_lower for k in ("produit", "article", "sku", "référence")):
        tags.append("produit")
    if not tags:
        tags.append("données")

    return DescribeDatasetResponse(name=name, description=description, tags=tags)
