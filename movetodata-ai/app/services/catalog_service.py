"""
catalog_service.py — F13.2 + F13.3 Data Catalog AI services.

F13.2: generate_data_product_metadata — prompts the local LLM (qwen2.5:14b via
       Ollama) to produce a structured Data Product descriptor from dataset
       schema only (column names + types). Raw cell values are NEVER sent.

F13.3: publish_data_product — pushes the descriptor to the Boson native catalog
       via its REST API. Credentials are read exclusively from environment
       variables.

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

BOSON_CATALOG_URL: str = os.getenv("BOSON_CATALOG_URL", "http://boson:8080")
BOSON_API_TOKEN: str = os.getenv("BOSON_API_TOKEN", "")

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
        "décrivant un Data Product conforme à la nomenclature MoveToData.\n\n"
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
# F13.3 — Publish to Boson native catalog
# ---------------------------------------------------------------------------

class _BosonServerError(Exception):
    """Raised on HTTP 5xx responses from Boson so tenacity can retry."""


def _boson_headers() -> Dict[str, str]:
    """Build Boson auth headers from environment variables.

    If BOSON_API_TOKEN is set, an Authorization header is included.
    Otherwise the request is sent without auth (Boson will enforce auth
    when its security layer is activated).
    """
    headers: Dict[str, str] = {"Content-Type": "application/json"}
    if BOSON_API_TOKEN:
        headers["Authorization"] = f"Bearer {BOSON_API_TOKEN}"
    return headers


def _build_boson_payload(metadata: DataProductMetadata) -> Dict[str, Any]:
    """Map the LLM-generated metadata to the Boson DataProduct request body.

    The Boson endpoint expects: name, displayName, description,
    dataProductType, accessPolicy, qualityLevel, domainId, useCases.
    """
    use_cases = metadata.get("useCases", [])
    # useCases may be a list from the LLM — Boson stores it as a JSON string
    if isinstance(use_cases, list):
        use_cases = json.dumps(use_cases, ensure_ascii=False)

    payload: Dict[str, Any] = {
        "name": metadata.get("name", ""),
        "displayName": metadata.get("displayName", ""),
        "description": metadata.get("description", ""),
        "dataProductType": metadata.get("dataProductType", "SOURCE_ALIGNED"),
        "accessPolicy": metadata.get("accessPolicy", "INTERNAL"),
        "qualityLevel": metadata.get("qualityLevel", "BRONZE"),
        "useCases": use_cases,
    }
    if metadata.get("domainId"):
        payload["domainId"] = metadata["domainId"]
    return payload


@retry(
    retry=retry_if_exception_type(_BosonServerError),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=2, max=16),
    before=before_log(logger, logging.DEBUG),
    after=after_log(logger, logging.DEBUG),
    reraise=True,
)
async def _post_to_boson(
    metadata: DataProductMetadata,
    attempt: int,
) -> Dict[str, Any]:
    """
    POST the DataProduct payload to the Boson native catalog endpoint.

    On 409 (already exists), falls back to a PUT on the same resource.
    Raises _BosonServerError on 5xx to allow tenacity retries.
    Returns the parsed JSON response body on success.
    """
    name: str = metadata.get("name", "unknown")
    post_url = f"{BOSON_CATALOG_URL}/api/catalog/data-products"
    put_url = f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}"

    payload = _build_boson_payload(metadata)

    logger.info(
        json.dumps({
            "event": "publish_attempt",
            "name": name,
            "attempt": attempt,
            "status": "started",
        })
    )

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(post_url, json=payload, headers=_boson_headers())

            if response.status_code == 409:
                # Already exists — idempotent PUT
                logger.info(
                    json.dumps({
                        "event": "publish_attempt",
                        "name": name,
                        "attempt": attempt,
                        "status": "conflict_put",
                    })
                )
                put_response = await client.put(put_url, json=payload, headers=_boson_headers())
                put_response.raise_for_status()
                return {"_conflict": True, **put_response.json()}

            if response.status_code >= 500:
                logger.warning(
                    json.dumps({
                        "event": "publish_attempt",
                        "name": name,
                        "attempt": attempt,
                        "status": f"server_error_{response.status_code}",
                    })
                )
                raise _BosonServerError(
                    f"Boson returned {response.status_code}"
                )

            response.raise_for_status()
            logger.info(
                json.dumps({
                    "event": "publish_attempt",
                    "name": name,
                    "attempt": attempt,
                    "status": "success",
                })
            )
            return response.json()

    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        logger.warning(
            json.dumps({
                "event": "publish_attempt",
                "name": name,
                "attempt": attempt,
                "status": "network_error",
                "error": str(exc),
            })
        )
        raise _BosonServerError(str(exc)) from exc


# ---------------------------------------------------------------------------
# F13.4 — Enrich an existing DataProduct via LLM (Phase 3)
# ---------------------------------------------------------------------------

def _build_enrich_prompt(
    name: str,
    current_description: Optional[str],
    columns: List[Dict[str, Any]],
) -> str:
    """Prompt to enrich a DataProduct: better description + PII detection per column."""
    col_summary = ", ".join(
        f"{c.get('columnName', c.get('name', '?'))} ({c.get('type', c.get('piiType', 'inconnu'))})"
        for c in columns
    )
    desc_ctx = f"Description actuelle : {current_description}" if current_description else "Aucune description existante."
    return (
        "Tu es un expert en gouvernance des données et en conformité RGPD.\n"
        "À partir du schéma d'un Data Product, génère une description enrichie et détecte les colonnes PII/RGPD.\n\n"
        "IMPÉRATIF : réponds UNIQUEMENT avec un bloc JSON valide entre ```json et ```. "
        "N'inclus aucune valeur de cellule, aucune donnée personnelle réelle.\n\n"
        "Champs attendus dans le JSON :\n"
        '  "description" : 3 à 4 phrases décrivant le contexte métier du Data Product\n'
        '  "columns"     : liste d\'objets {columnName, piiType} — '
        'piiType vaut null, "PII.Sensitive", "GDPR.Sensitive" ou "GDPR.ID"\n'
        '  "tags"        : liste de strings (domaine, catégorie, techno)\n\n'
        f"Data Product : {name}\n"
        f"{desc_ctx}\n"
        f"Colonnes : {col_summary}\n\n"
        "JSON :"
    )


async def enrich_data_product(name: str) -> Dict[str, Any]:
    """
    Fetch a DataProduct from Boson, run LLM to enrich its description and
    detect PII per column, then PATCH the results back to Boson.

    Returns a summary dict with the updated fields.
    Only column names are sent to the LLM — never cell values.
    """
    headers = _boson_headers()

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # 1. Fetch DataProduct
        dp_resp = await client.get(
            f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}",
            headers=headers,
        )
        if dp_resp.status_code == 404:
            raise ValueError(f"DataProduct '{name}' not found in catalog")
        dp_resp.raise_for_status()
        dp: Dict[str, Any] = dp_resp.json()

        # 2. Fetch columns
        col_resp = await client.get(
            f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}/columns",
            headers=headers,
        )
        columns: List[Dict[str, Any]] = col_resp.json() if col_resp.status_code == 200 else []

    # 3. Build and call LLM
    prompt = _build_enrich_prompt(
        name=name,
        current_description=dp.get("description"),
        columns=columns,
    )

    logger.info(
        json.dumps({
            "event": "enrich_data_product",
            "name": name,
            "columns_count": len(columns),
            "model": CHAT_MODEL,
        })
    )

    try:
        enriched = await _call_llm_with_retry(prompt)
    except Exception as exc:
        logger.warning(
            json.dumps({
                "event": "enrich_data_product_failed",
                "name": name,
                "error": str(exc),
            })
        )
        raise

    # 4. PATCH description back to Boson
    new_description = enriched.get("description", "")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        if new_description:
            await client.put(
                f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}",
                json={**dp, "description": new_description},
                headers=headers,
            )

        # 5. PATCH PII per column
        pii_updates: List[Dict[str, Any]] = []
        for col_enriched in enriched.get("columns", []):
            col_name = col_enriched.get("columnName", "")
            pii_type = col_enriched.get("piiType")
            if col_name and pii_type is not None:
                await client.patch(
                    f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}/columns/{col_name}",
                    json={"piiType": pii_type},
                    headers=headers,
                )
                pii_updates.append({"columnName": col_name, "piiType": pii_type})

    return {
        "name": name,
        "description": new_description,
        "tags": enriched.get("tags", []),
        "piiUpdates": pii_updates,
    }


# ---------------------------------------------------------------------------
# F13.5 — Suggest quality rules via LLM (Phase 4)
# ---------------------------------------------------------------------------

def _build_quality_rules_prompt(name: str, columns: List[Dict[str, Any]]) -> str:
    """Prompt asking the LLM to suggest quality rules for the given columns."""
    col_lines = "\n".join(
        f"  - {c.get('columnName', c.get('name', '?'))} "
        f"(pii={c.get('piiType') or 'none'})"
        for c in columns
    )
    return (
        "Tu es un expert en qualité des données. "
        "Génère des règles de qualité pour un Data Product.\n\n"
        "IMPÉRATIF : réponds UNIQUEMENT avec un bloc JSON valide entre ```json et ```. "
        "Ne fournis aucune valeur de cellule, aucune donnée réelle.\n\n"
        "Chaque règle doit avoir ces champs :\n"
        '  "columnName"  : nom de la colonne (null si règle de table)\n'
        '  "ruleType"    : NOT_NULL | RANGE | REGEX | UNIQUENESS | CUSTOM\n'
        '  "expression"  : description lisible de la règle (max 200 caractères)\n\n'
        "Génère 3 à 8 règles pertinentes pour le dataset suivant.\n"
        f"Data Product : {name}\n"
        f"Colonnes :\n{col_lines}\n\n"
        "JSON (liste de règles) :"
    )


# ---------------------------------------------------------------------------
# F13.6 — Content-based recommendations (Phase 5)
# ---------------------------------------------------------------------------

async def recommend_data_products(name: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Fetch the DataProduct's description, embed it, and use ChromaDB to find
    the most similar other DataProducts (excluding the DataProduct itself).
    """
    headers = _boson_headers()

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        dp_resp = await client.get(
            f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}",
            headers=headers,
        )
        if dp_resp.status_code == 404:
            raise ValueError(f"DataProduct '{name}' not found in catalog")
        dp_resp.raise_for_status()
        dp: Dict[str, Any] = dp_resp.json()

    description: str = dp.get("description") or dp.get("displayName") or name
    dp_id: str = dp.get("id", "")

    from app.services import rag_service  # local import avoids circularity
    results = await rag_service.search(description, top_k=top_k + 1)

    # Exclude the DataProduct itself
    recommendations = [r for r in results if r.get("id") != dp_id][:top_k]

    logger.info(
        json.dumps({
            "event": "recommend_data_products",
            "name": name,
            "candidates": len(recommendations),
        })
    )
    return recommendations


# ---------------------------------------------------------------------------
# F13.7 — Auto-lineage: SQL parsing via LLM (Phase 5)
# ---------------------------------------------------------------------------

def _build_lineage_parse_prompt(sql_text: str, target: str) -> str:
    """Prompt asking the LLM to extract source dataset names from SQL."""
    return (
        "Tu es un expert en lineage de données. "
        "À partir du code SQL suivant, identifie toutes les tables / datasets sources.\n\n"
        "IMPÉRATIF : réponds UNIQUEMENT avec un bloc JSON valide entre ```json et ```. "
        "Ne fournis aucune donnée de cellule.\n\n"
        "Format attendu :\n"
        '{ "sources": ["table1", "table2", ...], "target": "<nom_dataset_cible>" }\n\n'
        f"Dataset cible déclaré : {target}\n\n"
        f"SQL à analyser :\n{sql_text[:3000]}\n\n"
        "JSON :"
    )


async def parse_lineage_from_sql(sql_text: str, target_dataset: str) -> Dict[str, Any]:
    """
    Use the LLM to extract source dataset names from a SQL query.
    Returns {"sources": [...], "target": "..."}.
    Only the SQL structure (table/alias names) is extracted — never cell values.
    """
    prompt = _build_lineage_parse_prompt(sql_text, target_dataset)

    logger.info(
        json.dumps({
            "event": "parse_lineage_from_sql",
            "target": target_dataset,
            "sql_len": len(sql_text),
        })
    )

    try:
        parsed = await _call_llm_with_retry(prompt)
    except Exception as exc:
        logger.warning(json.dumps({"event": "parse_lineage_failed", "error": str(exc)}))
        raise

    sources = parsed.get("sources", [])
    if not isinstance(sources, list):
        sources = []
    return {
        "sources": [s for s in sources if isinstance(s, str) and s],
        "target": parsed.get("target", target_dataset),
    }


async def suggest_quality_rules(name: str) -> List[Dict[str, Any]]:
    """
    Fetch a DataProduct + columns from Boson, use the LLM to suggest quality
    rules, POST each rule to Boson, and return the created rules list.
    """
    headers = _boson_headers()

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        dp_resp = await client.get(
            f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}",
            headers=headers,
        )
        if dp_resp.status_code == 404:
            raise ValueError(f"DataProduct '{name}' not found in catalog")
        dp_resp.raise_for_status()
        dp: Dict[str, Any] = dp_resp.json()

        col_resp = await client.get(
            f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}/columns",
            headers=headers,
        )
        columns: List[Dict[str, Any]] = col_resp.json() if col_resp.status_code == 200 else []

    prompt = _build_quality_rules_prompt(name, columns)

    logger.info(
        json.dumps({
            "event": "suggest_quality_rules",
            "name": name,
            "columns_count": len(columns),
        })
    )

    try:
        parsed = await _call_llm_with_retry(prompt)
    except Exception as exc:
        logger.warning(json.dumps({"event": "suggest_quality_rules_failed", "name": name, "error": str(exc)}))
        raise

    # The LLM may return {"rules": [...]} or directly a list
    rules_raw: List[Dict[str, Any]] = []
    if isinstance(parsed, list):
        rules_raw = parsed
    elif isinstance(parsed, dict):
        for key in ("rules", "qualityRules", "quality_rules"):
            if key in parsed and isinstance(parsed[key], list):
                rules_raw = parsed[key]
                break

    # POST each rule to Boson
    created: List[Dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for rule in rules_raw:
            payload = {
                "ruleType":   rule.get("ruleType", "CUSTOM"),
                "expression": rule.get("expression", ""),
                "columnName": rule.get("columnName"),
            }
            if not payload["expression"]:
                continue
            resp = await client.post(
                f"{BOSON_CATALOG_URL}/api/catalog/data-products/{name}/quality-rules",
                json=payload,
                headers=headers,
            )
            if resp.status_code in (200, 201):
                created.append(resp.json())
            else:
                logger.warning(
                    json.dumps({
                        "event": "quality_rule_post_failed",
                        "name": name,
                        "status": resp.status_code,
                        "rule": payload,
                    })
                )

    return created


async def publish_data_product(metadata: DataProductMetadata) -> Dict[str, Any]:
    """
    Publish a DataProduct descriptor to the Boson native catalog with up to 4
    retries on 5xx.

    Returns the Boson response body, augmented with "_conflict: true" when the
    resource already existed (409 → PUT path).
    """
    name: str = metadata.get("name", "unknown")
    logger.info(
        json.dumps({
            "event": "publish_data_product",
            "name": name,
            "boson_catalog_url": BOSON_CATALOG_URL,
        })
    )
    # tenacity does not inject a call counter into async functions easily, so
    # we track attempt manually via a mutable container.
    attempt_counter: List[int] = [0]

    async def _with_counter() -> Dict[str, Any]:
        attempt_counter[0] += 1
        return await _post_to_boson(metadata, attempt_counter[0])

    return await _with_counter()
