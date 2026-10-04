"""
insights.py — POST /insights router (F2 — Augmented Analytics).

Receives tabular data and analytics parameters from the Boson proxy and
dispatches to the appropriate local computation service.

Sovereignty contract:
  - anomaly / forecast / cluster: 100% local scikit-learn / Prophet — no LLM.
  - summary: only aggregated statistics forwarded to self-hosted Ollama instance
    (qwen2.5:14b); raw cell values are never sent.

Models:
  | Type     | Library              | Licence      |
  |----------|----------------------|--------------|
  | anomaly  | IsolationForest      | BSD-3-Clause |
  | forecast | Prophet 1.1.x        | MIT          |
  | cluster  | KMeans               | BSD-3-Clause |
  | summary  | qwen2.5:14b (Ollama) | Apache 2.0   |
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.models.schemas import InsightsRequest, InsightsResponse
from app.services import analytics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Augmented Analytics"])

_MAX_ROWS: int = 10_000
_ALLOWED_TYPES = {"anomaly", "forecast", "cluster", "summary"}


@router.post(
    "/insights",
    response_model=InsightsResponse,
    summary="Run augmented analytics on tabular data",
)
async def insights(request: InsightsRequest) -> InsightsResponse:
    """
    Dispatches the request to the appropriate analytics computation:

    - **anomaly**  — IsolationForest, contamination configurable (default 5 %).
    - **forecast** — Prophet, configurable horizon (7 / 30 / 90 days default 30).
    - **cluster**  — K-Means with automatic elbow selection or explicit k.
    - **summary**  — LLM-generated French prose from column statistics only.

    Returns HTTP 422 for invalid type, missing columns, or computation errors.
    Returns HTTP 503 if the LLM is unreachable (summary type only).
    """
    # --- Validate type ---
    if request.type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_TYPE",
                "allowed": sorted(_ALLOWED_TYPES),
                "received": request.type,
            },
        )

    # --- Truncate data if needed ---
    warning: Optional[str] = None
    data = request.data
    if len(data) > _MAX_ROWS:
        warning = (
            f"Data truncated from {len(data):,} to {_MAX_ROWS:,} rows "
            "to stay within the analytics limit."
        )
        data = data[:_MAX_ROWS]

    # --- Build DataFrame ---
    try:
        df = pd.DataFrame(data, columns=request.columns)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_DATA", "detail": str(exc)},
        )

    column_x = request.column_x
    column_y = request.column_y

    if column_x not in df.columns:
        raise HTTPException(
            status_code=422,
            detail={"error": "COLUMN_NOT_FOUND", "column": column_x},
        )
    if column_y not in df.columns:
        raise HTTPException(
            status_code=422,
            detail={"error": "COLUMN_NOT_FOUND", "column": column_y},
        )

    opts: Dict[str, Any] = request.options or {}

    # -------------------------------------------------------------------------
    # Dispatch
    # -------------------------------------------------------------------------

    if request.type == "anomaly":
        contamination = float(opts.get("anomaly_contamination", 0.05))
        contamination = max(0.01, min(contamination, 0.50))

        results = analytics_service.detect_anomalies(
            df, column_x, column_y, contamination
        )
        return InsightsResponse(
            type="anomaly",
            results=results,
            model="IsolationForest (scikit-learn)",
            row_count=len(df),
            warning=warning,
        )

    elif request.type == "forecast":
        horizon = int(opts.get("forecast_horizon", 30))
        horizon = max(1, min(horizon, 365))

        result = analytics_service.forecast(df, column_x, column_y, horizon)
        if "error" in result:
            raise HTTPException(
                status_code=422,
                detail={"error": "FORECAST_ERROR", "detail": result["error"]},
            )
        return InsightsResponse(
            type="forecast",
            results=result.get("forecast", []),
            model=result.get("model_info", "Prophet"),
            row_count=len(df),
            warning=warning,
        )

    elif request.type == "cluster":
        k_raw = opts.get("cluster_k")
        k: Optional[int] = int(k_raw) if k_raw is not None else None

        results = analytics_service.cluster(df, column_x, column_y, k)
        return InsightsResponse(
            type="cluster",
            results=results,
            model="K-Means (scikit-learn)",
            row_count=len(df),
            warning=warning,
        )

    else:  # summary
        summary_text = await analytics_service.summarize(df, request.columns)
        if not summary_text:
            raise HTTPException(
                status_code=503,
                detail={"error": "LLM_UNAVAILABLE"},
            )
        return InsightsResponse(
            type="summary",
            results=[{"text": summary_text}],
            model="qwen2.5:14b (Ollama)",
            row_count=len(df),
            warning=warning,
        )
