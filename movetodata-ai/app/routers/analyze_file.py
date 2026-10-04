"""
analyze_file.py — POST /analyze-file router (F5).

Receives a file_path from the Boson proxy, parses the file with pandas,
computes statistics, and calls the LLM for summary + recommendations.

The file bytes are read directly from the shared storage volume — they are
never retransmitted over HTTP (sovereignty contract).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AnalyzeFileRequest,
    AnalyzeFileResponse,
    ChartSuggestion,
)
from app.services import file_parser, llm_service, stats_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["File Analysis"])


@router.post(
    "/analyze-file",
    response_model=AnalyzeFileResponse,
    summary="Parse a file and generate AI insights",
)
async def analyze_file(request: AnalyzeFileRequest) -> AnalyzeFileResponse:
    """
    1. Parse the file from *file_path* with pandas.
    2. Compute aggregated statistics (no cell values exposed).
    3. Call qwen2.5:14b via Ollama for summary + recommendations.
    4. Generate chart suggestions from detected types.
    """
    logger.info("analyze-file: path=%s sheet=%s", request.file_path, request.sheet)

    # --- Step 1: Parse ---
    try:
        df = file_parser.parse_file(request.file_path, request.sheet or None)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("File parsing failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"File parsing error: {exc}")

    column_names: List[str] = list(df.columns)

    # --- Step 2: Compute statistics ---
    try:
        file_stats = stats_service.compute_stats(df)
    except Exception as exc:
        logger.exception("Stats computation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Statistics error: {exc}")

    stats_dict: Dict[str, Any] = file_stats.model_dump()

    # --- Step 3: LLM calls (graceful degradation if Ollama is down) ---
    summary = await llm_service.generate_summary(stats_dict, column_names)
    recommendations_raw = await llm_service.generate_recommendations(stats_dict, column_names)

    # Normalise recommendations to the Recommendation schema
    from app.models.schemas import Recommendation
    recommendations = [
        Recommendation(
            action=r.get("action", ""),
            priority=r.get("priority", "medium"),
            reason=r.get("reason", ""),
        )
        for r in recommendations_raw
        if isinstance(r, dict)
    ]

    # --- Step 4: Chart suggestions from detected types ---
    chart_suggestions = _suggest_charts(file_stats.detected_types, column_names)

    return AnalyzeFileResponse(
        filename=request.filename,
        stats=file_stats,
        summary=summary,
        recommendations=recommendations,
        chart_suggestions=chart_suggestions,
    )


# ---------------------------------------------------------------------------
# Chart suggestion heuristic
# ---------------------------------------------------------------------------

def _suggest_charts(
    detected_types: Dict[str, str],
    column_names: List[str],
) -> List[ChartSuggestion]:
    """
    Generate up to 5 chart suggestions from detected column types.
    Rules (priority order):
      - time_series × numeric   → line chart
      - categorical × numeric   → bar chart
      - numeric × numeric       → scatter
      - categorical alone       → pie chart (top-N)
    """
    suggestions: List[ChartSuggestion] = []
    time_cols = [c for c, t in detected_types.items() if t == "time_series"]
    numeric_cols = [c for c, t in detected_types.items() if t == "numeric"]
    categorical_cols = [c for c, t in detected_types.items() if t == "categorical"]

    # Line charts: time × numeric
    for tc in time_cols[:1]:
        for nc in numeric_cols[:2]:
            suggestions.append(
                ChartSuggestion(
                    chart_type="line",
                    column_x=tc,
                    column_y=nc,
                    title=f"Évolution de {nc} dans le temps",
                )
            )

    # Bar charts: categorical × numeric
    for cc in categorical_cols[:1]:
        for nc in numeric_cols[:2]:
            suggestions.append(
                ChartSuggestion(
                    chart_type="bar",
                    column_x=cc,
                    column_y=nc,
                    title=f"{nc} par {cc}",
                )
            )

    # Scatter: numeric × numeric
    if len(numeric_cols) >= 2:
        suggestions.append(
            ChartSuggestion(
                chart_type="scatter",
                column_x=numeric_cols[0],
                column_y=numeric_cols[1],
                title=f"Corrélation {numeric_cols[0]} / {numeric_cols[1]}",
            )
        )

    # Pie: categorical alone
    if categorical_cols and not numeric_cols:
        suggestions.append(
            ChartSuggestion(
                chart_type="pie",
                column_x=categorical_cols[0],
                title=f"Répartition par {categorical_cols[0]}",
            )
        )

    return suggestions[:5]
