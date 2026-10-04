"""
smart_connector.py — F4 Smart Connector router.

POST /smart-connector/analyze
  Receives a sample of rows from a connected source (fetched by Boson/Java),
  computes data quality scores, detects column semantic types, and suggests
  relevant chart types.

  An optional LLM call (qwen2.5:14b via Ollama) enriches the chart suggestion
  titles with more natural French descriptions.  If Ollama is unavailable the
  endpoint returns heuristic titles without error.

Sovereignty: no raw cell values are forwarded to the LLM.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import quality_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/smart-connector", tags=["Smart Connector"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ColumnInfo(BaseModel):
    name: str
    sql_type: str = "varchar"


class SmartConnectorRequest(BaseModel):
    source_id: int = Field(..., description="Internal source ID (for logging).")
    sample_data: List[List[Any]] = Field(
        ...,
        description="Up to 1 000 rows of data (list of rows, each row is a list of values).",
    )
    columns: List[ColumnInfo] = Field(
        ...,
        description="Column descriptors with name and SQL type.",
    )
    sample_size: int = Field(default=0, description="Actual number of rows in sample_data.")


class QualityScore(BaseModel):
    global_: Optional[int] = Field(None, alias="global")
    completeness: Optional[int] = None
    uniqueness: Optional[int] = None
    consistency: Optional[int] = None
    outlier_ratio: Optional[float] = None

    class Config:
        populate_by_name = True


class ChartSuggestion(BaseModel):
    chartType: str
    columnX: str
    columnY: Optional[str] = None
    title: str
    reason: str


class SmartConnectorResponse(BaseModel):
    quality_score: Dict[str, Any]
    detected_types: Dict[str, str]
    chart_suggestions: List[Dict[str, Any]]
    analyzed_at: str
    model: str
    sample_size: int


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=SmartConnectorResponse)
async def analyze_source(request: SmartConnectorRequest) -> SmartConnectorResponse:
    """
    Analyse a sample of rows from a connected source.

    Steps:
      1. Build a pandas DataFrame from the sample rows.
      2. Detect semantic column types (time_series, numeric, categorical, …).
      3. Compute multi-dimensional quality score.
      4. Generate heuristic chart suggestions.
      5. Optionally enrich chart titles via LLM.
    """
    columns_info = [{"name": c.name, "sql_type": c.sql_type} for c in request.columns]
    col_names = [c.name for c in request.columns]

    # --- 1. Build DataFrame ---
    try:
        if request.sample_data and col_names:
            df = pd.DataFrame(request.sample_data, columns=col_names)
        else:
            df = pd.DataFrame()
    except Exception as exc:
        logger.warning("smart-connector: could not build DataFrame for source %s — %s",
                       request.source_id, exc)
        df = pd.DataFrame()

    logger.info(
        "smart-connector: analyzing source=%s rows=%d cols=%d",
        request.source_id, len(df), len(col_names),
    )

    # --- 2. Detect types ---
    detected_types: Dict[str, str] = {}
    if not df.empty and columns_info:
        try:
            detected_types = quality_service.detect_column_types(df, columns_info)
        except Exception as exc:
            logger.warning("smart-connector: type detection failed — %s", exc)

    # --- 3. Quality score ---
    quality_score: Dict[str, Any] = {
        "global": None, "completeness": None,
        "uniqueness": None, "consistency": None, "outlier_ratio": None,
    }
    if not df.empty and columns_info:
        try:
            quality_score = quality_service.compute_quality_score(df, columns_info)
        except Exception as exc:
            logger.warning("smart-connector: quality scoring failed — %s", exc)

    # --- 4. Chart suggestions ---
    chart_suggestions: List[Dict[str, Any]] = []
    if detected_types and col_names:
        try:
            chart_suggestions = quality_service.suggest_charts(
                df, detected_types, col_names
            )
        except Exception as exc:
            logger.warning("smart-connector: chart suggestion failed — %s", exc)

    # --- 5. LLM title enrichment (optional, graceful degradation) ---
    model = "heuristic+scikit-learn"
    if chart_suggestions:
        try:
            chart_suggestions = await quality_service.enrich_titles_with_llm(
                chart_suggestions, detected_types
            )
            model = "heuristic+scikit-learn+qwen2.5:14b"
        except Exception as exc:
            logger.info("smart-connector: LLM title enrichment skipped — %s", exc)

    return SmartConnectorResponse(
        quality_score=quality_score,
        detected_types=detected_types,
        chart_suggestions=chart_suggestions,
        analyzed_at=datetime.now(tz=timezone.utc).isoformat(),
        model=model,
        sample_size=len(df),
    )
