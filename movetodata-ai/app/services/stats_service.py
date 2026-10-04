"""
stats_service.py — Computes aggregated statistics on a pandas DataFrame.

Key design constraints:
  - Maximum 10 000 rows are passed to the LLM (chunked sampling for large files).
  - The raw cell values are NEVER exposed outside this module — only aggregates.
  - No external network calls are made here.
"""
from __future__ import annotations

from typing import Dict, List

import numpy as np
import pandas as pd

from app.models.schemas import ColumnStats, Correlation, FileStats

# Max rows used for LLM-facing statistics (sovereignty contract).
LLM_SAMPLE_SIZE = 10_000


def compute_stats(df: pd.DataFrame) -> FileStats:
    """
    Return a FileStats object with aggregated metrics for the given DataFrame.

    For large DataFrames (> LLM_SAMPLE_SIZE rows) a random sample is used
    for correlation and descriptive statistics; row / duplicate counts use
    the full DataFrame.
    """
    total_rows, total_cols = df.shape

    # --- Missing values (full DF) ---
    missing_by_column: Dict[str, float] = {
        col: float(round(df[col].isna().mean(), 4))
        for col in df.columns
    }

    # --- Duplicates (full DF) ---
    duplicates = int(df.duplicated().sum())

    # --- Detected types ---
    detected_types: Dict[str, str] = {
        col: _detect_type(df[col]) for col in df.columns
    }

    # --- Sample for statistics (cap at LLM_SAMPLE_SIZE) ---
    sample = df.sample(n=min(LLM_SAMPLE_SIZE, total_rows), random_state=42) \
        if total_rows > LLM_SAMPLE_SIZE else df

    # --- Descriptive statistics for numeric columns ---
    numeric_cols = sample.select_dtypes(include=[np.number]).columns.tolist()
    sample_stats: Dict[str, ColumnStats] = {}
    for col in numeric_cols:
        s = sample[col].dropna()
        if s.empty:
            continue
        desc = s.describe(percentiles=[0.25, 0.75])
        sample_stats[col] = ColumnStats(
            min=_safe_float(desc.get("min")),
            max=_safe_float(desc.get("max")),
            mean=_safe_float(desc.get("mean")),
            std=_safe_float(desc.get("std")),
            p25=_safe_float(desc.get("25%")),
            p75=_safe_float(desc.get("75%")),
        )

    # --- Top-5 correlations among numeric columns ---
    top_correlations: List[Correlation] = []
    if len(numeric_cols) >= 2:
        corr_matrix = sample[numeric_cols].corr(method="pearson")
        pairs: List[tuple] = []
        cols = list(corr_matrix.columns)
        for i, c1 in enumerate(cols):
            for c2 in cols[i + 1:]:
                r = corr_matrix.loc[c1, c2]
                if not np.isnan(r):
                    pairs.append((c1, c2, float(round(r, 4))))
        # Sort by |r| descending, take top 5
        pairs.sort(key=lambda t: abs(t[2]), reverse=True)
        top_correlations = [
            Correlation(col1=c1, col2=c2, r=r) for c1, c2, r in pairs[:5]
        ]

    return FileStats(
        rows=total_rows,
        columns=total_cols,
        missing_by_column=missing_by_column,
        duplicates=duplicates,
        detected_types=detected_types,
        top_correlations=top_correlations,
        sample_stats=sample_stats,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _detect_type(series: pd.Series) -> str:
    """
    Heuristic column type detection.
    Returns one of: time_series | numeric | categorical | boolean
    """
    # Boolean
    unique_vals = series.dropna().unique()
    if series.dtype == bool or set(unique_vals).issubset({True, False, 0, 1, "true", "false", "True", "False"}):
        return "boolean"

    # Numeric
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    # Datetime / time series
    if pd.api.types.is_datetime64_any_dtype(series):
        return "time_series"
    # Try parsing as datetime
    if series.dtype == object:
        try:
            parsed = pd.to_datetime(series.dropna().head(50), infer_datetime_format=True, errors="coerce")
            if parsed.notna().mean() > 0.8:
                return "time_series"
        except Exception:
            pass

    return "categorical"


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return None if np.isnan(f) or np.isinf(f) else round(f, 4)
    except (TypeError, ValueError):
        return None
