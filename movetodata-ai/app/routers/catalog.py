"""
catalog.py — F13 Data Catalog router.

Endpoints:
  POST /catalog/webhook/dataset-created     (F13.1) — receive dataset-created events,
       orchestrate LLM metadata generation and Boson publication + PII auto-detection.
  POST /catalog/generate-data-product       (F13.2) — generate a DataProduct descriptor
       from schema information via the local LLM.
  POST /catalog/publish-data-product        (F13.3) — push a DataProduct descriptor to
       Boson native catalog, with idempotence handling (409 → PUT).
  POST /catalog/enrich/{name}               (F13.4) — enrich an existing DataProduct:
       improved description + PII detection per column, patched back to Boson.
  POST /catalog/suggest-quality-rules/{name} (F13.5) — LLM suggests quality rules,
       posted to Boson /quality-rules.

Sovereignty: raw dataset cell values are never accepted or forwarded.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import catalog_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/catalog", tags=["Catalog"])


# ---------------------------------------------------------------------------
# Shared request schema
# ---------------------------------------------------------------------------

class DatasetCreatedEvent(BaseModel):
    """Schema shared by F13.1 and F13.2 — describes a newly registered dataset."""

    datasetId: str
    name: str
    description: Optional[str] = None
    sourceType: str  # "FILE" | "DATABASE" | "API"
    columns: List[Dict[str, str]] = []  # [{"name": "col1", "type": "varchar"}, ...]
    domain: Optional[str] = None
    owner: Optional[str] = None


# ---------------------------------------------------------------------------
# F13.1 — Webhook: dataset created
# ---------------------------------------------------------------------------

@router.post("/webhook/dataset-created", tags=["Catalog"])
async def webhook_dataset_created(
    event: DatasetCreatedEvent,
) -> Dict[str, Any]:
    """
    Receive a dataset-created event, generate AI metadata, and publish to OpenMetadata.

    Returns {"status": "indexed", "dataProductFqn": ...} on success, or
    {"status": "already_indexed", "dataProductFqn": ...} when the asset already
    exists in OpenMetadata (idempotent).
    """
    logger.info(
        json.dumps({
            "event": "webhook_dataset_created",
            "datasetId": event.datasetId,
            "name": event.name,
            "sourceType": event.sourceType,
            "columns_count": len(event.columns),
        })
    )

    # F13.2 — generate metadata
    try:
        metadata = await catalog_service.generate_data_product_metadata(
            dataset_name=event.name,
            source_type=event.sourceType,
            columns=event.columns,
            description=event.description,
            domain=event.domain,
            owner=event.owner,
        )
    except Exception as exc:
        logger.error("webhook_dataset_created: metadata generation failed — %s", exc)
        raise HTTPException(status_code=500, detail="Metadata generation failed") from exc

    fqn: str = metadata.get("fqn", metadata.get("name", "unknown"))

    # F13.3 — publish
    try:
        om_response = await catalog_service.publish_data_product(metadata)
    except Exception as exc:
        logger.error(
            "webhook_dataset_created: OpenMetadata publication failed for fqn=%s — %s",
            fqn, exc,
        )
        raise HTTPException(
            status_code=502,
            detail=f"OpenMetadata publication failed: {exc}",
        ) from exc

    already_indexed: bool = bool(om_response.get("_conflict", False))

    # F13.4 — PII auto-detection (Phase 4): fire-and-forget after publication
    if event.columns:
        import asyncio
        product_name: str = metadata.get("name", fqn)
        asyncio.ensure_future(
            _enrich_background(product_name)
        )

    return {
        "status": "already_indexed" if already_indexed else "indexed",
        "dataProductFqn": fqn,
    }


async def _enrich_background(name: str) -> None:
    """Background PII enrichment after dataset creation — errors are swallowed."""
    try:
        await catalog_service.enrich_data_product(name)
        logger.info(json.dumps({"event": "pii_auto_enrich_done", "name": name}))
    except Exception as exc:
        logger.warning(json.dumps({"event": "pii_auto_enrich_failed", "name": name, "error": str(exc)}))


# ---------------------------------------------------------------------------
# F13.2 — Generate Data Product metadata (standalone endpoint)
# ---------------------------------------------------------------------------

@router.post("/generate-data-product", tags=["Catalog"])
async def generate_data_product(
    event: DatasetCreatedEvent,
) -> Dict[str, Any]:
    """
    Generate a DataProduct descriptor via the local LLM from dataset schema.

    Only column names and types are sent to the LLM — never cell values.
    Returns the full DataProduct JSON.
    """
    logger.info(
        json.dumps({
            "event": "generate_data_product_request",
            "datasetId": event.datasetId,
            "name": event.name,
            "sourceType": event.sourceType,
        })
    )

    try:
        metadata = await catalog_service.generate_data_product_metadata(
            dataset_name=event.name,
            source_type=event.sourceType,
            columns=event.columns,
            description=event.description,
            domain=event.domain,
            owner=event.owner,
        )
    except Exception as exc:
        logger.error("generate_data_product: failed — %s", exc)
        raise HTTPException(status_code=500, detail="Data product generation failed") from exc

    return metadata


# ---------------------------------------------------------------------------
# F13.3 — Publish Data Product to OpenMetadata (standalone endpoint)
# ---------------------------------------------------------------------------

class DataProductPayload(BaseModel):
    """Accepts any DataProduct descriptor as a free-form dict."""

    name: str
    displayName: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    dataProductType: Optional[str] = None
    accessPolicy: Optional[str] = None
    useCases: List[str] = []
    qualityLevel: Optional[str] = None
    fqn: Optional[str] = None


# ---------------------------------------------------------------------------
# F13.4 — Enrich an existing DataProduct via LLM (Phase 3)
# ---------------------------------------------------------------------------

@router.post("/enrich/{name}", tags=["Catalog"])
async def enrich_data_product(
    name: str,
) -> Dict[str, Any]:
    """
    Enrich an existing DataProduct:
      1. Fetch the DataProduct + columns from Boson.
      2. Run LLM to generate an improved description and detect PII per column.
      3. PATCH description and PII back to Boson.

    Returns {"name", "description", "tags", "piiUpdates"}.
    Only column names/types are sent to the LLM — never cell values.
    """
    logger.info(json.dumps({"event": "enrich_data_product_request", "name": name}))

    try:
        result = await catalog_service.enrich_data_product(name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("enrich_data_product: failed for name=%s — %s", name, exc)
        raise HTTPException(status_code=500, detail="Enrichment failed") from exc

    return result


# ---------------------------------------------------------------------------
# F13.5 — Suggest quality rules for a DataProduct (Phase 4)
# ---------------------------------------------------------------------------

@router.post("/suggest-quality-rules/{name}", tags=["Catalog"])
async def suggest_quality_rules(
    name: str,
) -> Dict[str, Any]:
    """
    Fetch the DataProduct's columns from Boson, ask the LLM to suggest
    data quality rules (NOT_NULL, RANGE, REGEX, UNIQUENESS, CUSTOM), and
    POST each rule to Boson.

    Returns {"name", "rulesCreated": [...]} on success.
    """
    logger.info(json.dumps({"event": "suggest_quality_rules_request", "name": name}))

    try:
        rules = await catalog_service.suggest_quality_rules(name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("suggest_quality_rules: failed for name=%s — %s", name, exc)
        raise HTTPException(status_code=500, detail="Quality rules suggestion failed") from exc

    return {"name": name, "rulesCreated": rules}


@router.post("/publish-data-product", tags=["Catalog"])
async def publish_data_product(
    payload: DataProductPayload,
) -> Dict[str, Any]:
    """
    Push a DataProduct descriptor to OpenMetadata.

    Handles idempotence: if the resource already exists (HTTP 409), falls back
    to a PUT. Returns the OpenMetadata response body.
    """
    metadata: Dict[str, Any] = payload.model_dump(exclude_none=True)
    if "fqn" not in metadata:
        import re
        metadata["fqn"] = re.sub(r"[^a-z0-9]+", "_", payload.name.lower()).strip("_")

    logger.info(
        json.dumps({
            "event": "publish_data_product_request",
            "fqn": metadata["fqn"],
        })
    )

    try:
        om_response = await catalog_service.publish_data_product(metadata)
    except Exception as exc:
        logger.error("publish_data_product: failed — %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"OpenMetadata publication failed: {exc}",
        ) from exc

    return om_response
