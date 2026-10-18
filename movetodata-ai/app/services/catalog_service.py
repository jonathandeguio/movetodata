"""
catalog_service.py — F13.2 + F13.3 Data Catalog AI services.

F13.2: generate_data_product_metadata — prompts the local LLM (qwen2.5:14b via
       Ollama) to produce a structured Data Product descriptor from dataset
       schema only (column names + types). Raw cell values are NEVER sent.

F13.3: publish_data_product — pushes the descriptor to OpenMetadata via its
       REST API. Credentials are read exclusively from environment variables.

Sovereignty: all LLM inference is local (Ollama). No data leaves the
MoveToData infrastructure.
"""
from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_log,
    after_log,
)

from app.services.llm_service import OLLAMA_URL, CHAT_MODEL, TIMEOUT

logger = logging.getLogger(__name__)

OPENMETADATA_URL: str = os.getenv("OPENMETADATA_URL", "http://localhost:8585")
OPENMETADATA_AUTH_TOKEN: str = os.getenv("OPENMETADATA_AUTH_TOKEN", "")

# ---------------------------------------------------------------------------
# Internal types
# ---------------------------------------------------------------------------

DataProductMetadata = Dict[str, Any]


# ---------------------------------------------------------------------------
# F13.2 — LLM-based Data Product metadata generation
# ---------------------------------------------------------------------------

def _build_data_product_prompt(
    name: str,
    source_type: str,
    columns: List[Dict[str, str]],
    description: Optional[str],
    domain: Optional[str],
    owner: Optional[str],
) -> str:
    """Build a French prompt that instructs the LLM to emit a JSON DataProduct descriptor."""
    columns_summary = ", ".join(
        f"{c.get('name', '?')} ({c.get('type', 'inconnu')})" for c in columns
    )
    context_lines: List[str] = []
    if description:
        context_lines.append(f"Description initiale : {description}")
    if domain:
        context_lines.append(f"Domaine métier : {domain}")
    if owner:
        context_lines.append(f"Propriétaire : {owner}")
    context_block = "\n".join(context_lines) if context_lines else "Aucune information contextuelle fournie."

    return (
        "Tu es un expert en gouvernance des données et en data mesh.\n"
        "À partir des informations de schéma d'un dataset, génère un objet JSON "
        "décrivant un Data Product conforme à la nomenclature OpenMetadata.\n\n"
        "IMPÉRATIF : réponds UNIQUEMENT avec un bloc JSON valide entre ```json et ```. "
        "N'inclus aucune valeur de cellule, aucune donnée personnelle.\n\n"
        "Champs attendus dans le JSON (respecte exactement ces clés) :\n"
        '  "name"            : identifiant snake_case dérivé du nom du dataset\n'
        '  "displayName"     : nom lisible en français\n'
        '  "description"     : 2 à 3 phrases décrivant le contexte métier du dataset\n'
        '  "tags"            : liste de strings (ex: ["Finance", "PII", "Gold"])\n'
        '  "dataProductType" : "SOURCE_ALIGNED" | "AGGREGATE" | "CONSUMER_ALIGNED"\n'
        '  "accessPolicy"    : "PUBLIC" | "INTERNAL" | "RESTRICTED"\n'
        '  "useCases"        : liste de 2 à 3 phrases décrivant des cas d\'usage\n'
        '  "qualityLevel"    : "BRONZE" | "SILVER" | "GOLD"\n\n'
        f"Nom du dataset : {name}\n"
        f"Type de source : {source_type}\n"
        f"Colonnes (noms et types uniquement) : {columns_summary}\n"
        f"{context_block}\n\n"
        "JSON :"
    )


def _parse_data_product_json(raw: str) -> Optional[DataProductMetadata]:
    """Extract and parse the JSON block from the LLM response."""
    if not raw:
        return None
    # Try ```json ... ``` fence first
    match = re.search(r"```json\s*(.*?)\s*```", raw, re.DOTALL)
    if match:
        candidate = match.group(1)
    else:
        # Fallback: find the first { ... } block
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        candidate = match.group(0) if match else raw.strip()
    try:
        result = json.loads(candidate)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass
    return None


def _default_data_product(name: str, dataset_name: str) -> DataProductMetadata:
    """Return a safe default descriptor when the LLM fails or returns invalid JSON."""
    return {
        "name": name,
        "displayName": dataset_name,
        "description": "Métadonnées générées par défaut — revue manuelle recommandée.",
        "tags": [],
        "dataProductType": "SOURCE_ALIGNED",
        "accessPolicy": "INTERNAL",
        "useCases": [],
        "qualityLevel": "BRONZE",
    }


class _LLMError(Exception):
    """Raised when the LLM call returns an empty or unparseable response."""


@retry(
    retry=retry_if_exception_type(_LLMError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    before=before_log(logger, logging.DEBUG),
    after=after_log(logger, logging.DEBUG),
    reraise=False,
)
async def _call_llm_with_retry(prompt: str) -> DataProductMetadata:
    """Call the local Ollama LLM and parse its JSON response. Retried up to 3 times."""
    from app.services.llm_service import _call_ollama  # local import avoids circularity

    raw = await _call_ollama(prompt)
    parsed = _parse_data_product_json(raw)
    if parsed is None:
        raise _LLMError(f"LLM returned unparseable response (len={len(raw)})")
    return parsed


async def generate_data_product_metadata(
    dataset_name: str,
    source_type: str,
    columns: List[Dict[str, str]],
    description: Optional[str] = None,
    domain: Optional[str] = None,
    owner: Optional[str] = None,
) -> DataProductMetadata:
    """
    Generate a structured Data Product descriptor via the local LLM.

    Only column names and types are forwarded to the LLM — never cell values.
    Falls back to a default BRONZE/INTERNAL descriptor if the LLM fails after
    3 attempts.
    """
    snake_name = re.sub(r"[^a-z0-9]+", "_", dataset_name.lower()).strip("_")
    prompt = _build_data_product_prompt(
        name=snake_name,
        source_type=source_type,
        columns=columns,
        description=description,
        domain=domain,
        owner=owner,
    )

    logger.info(
        json.dumps({
            "event": "llm_generate_data_product",
            "dataset": dataset_name,
            "columns_count": len(columns),
            "model": CHAT_MODEL,
        })
    )

    try:
        metadata = await _call_llm_with_retry(prompt)
    except Exception as exc:
        logger.warning(
            json.dumps({
                "event": "llm_generate_data_product_failed",
                "dataset": dataset_name,
                "error": str(exc),
                "fallback": True,
            })
        )
        metadata = _default_data_product(snake_name, dataset_name)

    # Ensure the "name" field is always snake_case of the original name
    metadata.setdefault("name", snake_name)
    metadata["fqn"] = metadata["name"]
    return metadata


# ---------------------------------------------------------------------------
# F13.3 — Publish to OpenMetadata
# ---------------------------------------------------------------------------

class _OpenMetadataServerError(Exception):
    """Raised on HTTP 5xx responses from OpenMetadata so tenacity can retry."""


def _om_headers() -> Dict[str, str]:
    """Build OpenMetadata auth headers from environment variables."""
    return {
        "Authorization": f"Bearer {OPENMETADATA_AUTH_TOKEN}",
        "Content-Type": "application/json",
    }


@retry(
    retry=retry_if_exception_type(_OpenMetadataServerError),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=2, max=16),
    before=before_log(logger, logging.DEBUG),
    after=after_log(logger, logging.DEBUG),
    reraise=True,
)
async def _post_to_openmetadata(
    metadata: DataProductMetadata,
    attempt: int,
) -> Dict[str, Any]:
    """
    POST (or PUT on 409) the DataProduct payload to OpenMetadata.

    Raises _OpenMetadataServerError on 5xx to allow tenacity retries.
    Returns the parsed JSON response body on success.
    """
    fqn: str = metadata.get("fqn", metadata.get("name", "unknown"))
    post_url = f"{OPENMETADATA_URL}/api/v1/dataProducts"
    put_url = f"{OPENMETADATA_URL}/api/v1/dataProducts/{fqn}"

    logger.info(
        json.dumps({
            "event": "publish_attempt",
            "fqn": fqn,
            "attempt": attempt,
            "status": "started",
        })
    )

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(post_url, json=metadata, headers=_om_headers())

            if response.status_code == 409:
                # Already exists — idempotent PUT
                logger.info(
                    json.dumps({
                        "event": "publish_attempt",
                        "fqn": fqn,
                        "attempt": attempt,
                        "status": "conflict_put",
                    })
                )
                put_response = await client.put(put_url, json=metadata, headers=_om_headers())
                put_response.raise_for_status()
                return {"_conflict": True, **put_response.json()}

            if response.status_code >= 500:
                logger.warning(
                    json.dumps({
                        "event": "publish_attempt",
                        "fqn": fqn,
                        "attempt": attempt,
                        "status": f"server_error_{response.status_code}",
                    })
                )
                raise _OpenMetadataServerError(
                    f"OpenMetadata returned {response.status_code}"
                )

            response.raise_for_status()
            logger.info(
                json.dumps({
                    "event": "publish_attempt",
                    "fqn": fqn,
                    "attempt": attempt,
                    "status": "success",
                })
            )
            return response.json()

    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        logger.warning(
            json.dumps({
                "event": "publish_attempt",
                "fqn": fqn,
                "attempt": attempt,
                "status": "network_error",
                "error": str(exc),
            })
        )
        raise _OpenMetadataServerError(str(exc)) from exc


async def publish_data_product(metadata: DataProductMetadata) -> Dict[str, Any]:
    """
    Publish a DataProduct descriptor to OpenMetadata with up to 4 retries on 5xx.

    Returns the OpenMetadata response body, augmented with "_conflict: true"
    when the resource already existed (409 → PUT path).
    """
    fqn: str = metadata.get("fqn", metadata.get("name", "unknown"))
    logger.info(
        json.dumps({
            "event": "publish_data_product",
            "fqn": fqn,
            "openmetadata_url": OPENMETADATA_URL,
        })
    )
    # tenacity does not inject a call counter into async functions easily, so
    # we track attempt manually via a mutable container.
    attempt_counter: List[int] = [0]

    async def _with_counter() -> Dict[str, Any]:
        attempt_counter[0] += 1
        return await _post_to_openmetadata(metadata, attempt_counter[0])

    return await _with_counter()
