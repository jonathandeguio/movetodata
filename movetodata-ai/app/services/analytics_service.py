"""
analytics_service.py — Augmented Analytics computations for F2.

All computations are 100% local:
  - Anomaly detection: IsolationForest (scikit-learn, BSD-3-Clause)
  - Forecasting:       Prophet (Meta, MIT)
  - Clustering:        K-Means (scikit-learn, BSD-3-Clause)

Only the 'summary' type calls an LLM, and only with aggregated statistics —
never raw cell values.

Sovereignty contract: no network call is made for anomaly / forecast / cluster.
For summary, only statistics (min/max/mean/std/nulls) are forwarded to the
self-hosted Ollama instance. Raw data never leaves this process.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.services import llm_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Anomaly detection (IsolationForest)
# ---------------------------------------------------------------------------

def detect_anomalies(
    df: pd.DataFrame,
    column_x: str,
    column_y: str,
    contamination: float = 0.05,
) -> List[Dict[str, Any]]:
    """
    Detect anomalies using IsolationForest on column_y (with column_x as
    an optional second feature when numeric).

    Returns a list sorted by anomaly score (most anomalous first):
        [{"row_index": int, "x_value": any, "y_value": float, "score": float}]

    score is normalised to [0, 1] where 1 = most anomalous.
    """
    y = pd.to_numeric(df[column_y], errors="coerce")
    valid_mask = y.notna()
    y_clean = y[valid_mask]

    if y_clean.empty:
        logger.warning(
            "detect_anomalies: no valid numeric values in column '%s'", column_y
        )
        return []

    # Build feature matrix — add column_x as a second feature if it is numeric
    features: np.ndarray = y_clean.values.reshape(-1, 1)
    if column_x != column_y:
        x_numeric = pd.to_numeric(df.loc[valid_mask, column_x], errors="coerce")
        if x_numeric.notna().mean() > 0.5:
            features = np.column_stack(
                [x_numeric.fillna(x_numeric.median()).values, y_clean.values]
            )

    clf = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    clf.fit(features)
    preds = clf.predict(features)           # -1 = anomaly, +1 = normal
    raw_scores = clf.decision_function(features)  # higher = more normal

    # Normalise to [0, 1]: distance to the decision boundary (anomaly closeness)
    abs_scores = np.abs(raw_scores)
    max_s = abs_scores.max() if abs_scores.max() > 0 else 1.0
    norm_scores = abs_scores / max_s

    results = []
    original_indices = df.index[valid_mask].tolist()
    for i, (orig_idx, pred) in enumerate(zip(original_indices, preds)):
        if pred == -1:
            x_val = df.loc[orig_idx, column_x]
            # Convert numpy scalars to native Python for JSON serialisation
            if hasattr(x_val, "item"):
                x_val = x_val.item()
            y_val = float(y_clean.iloc[i])
            results.append({
                "row_index": int(orig_idx),
                "x_value": (
                    str(x_val) if not isinstance(x_val, (int, float)) else x_val
                ),
                "y_value": y_val,
                "score": round(float(norm_scores[i]), 4),
            })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Forecasting (Prophet)
# ---------------------------------------------------------------------------

def forecast(
    df: pd.DataFrame,
    column_x: str,
    column_y: str,
    horizon: int = 30,
) -> Dict[str, Any]:
    """
    Time-series forecast using Prophet.

    column_x is parsed as datetime (ISO or common formats).
    column_y must be numeric.

    Returns:
        {
            "forecast": [
                {"date": "YYYY-MM-DD", "predicted": float,
                 "lower_80": float, "upper_80": float}
            ],
            "model_info": "Prophet x.y.z",
        }
    or on error:
        {"forecast": [], "model_info": "...", "error": "..."}
    """
    try:
        from prophet import Prophet  # type: ignore
        import prophet as _prophet_module

        model_version = getattr(_prophet_module, "__version__", "1.1.x")
    except ImportError:
        logger.error("forecast: Prophet is not installed — add prophet to requirements.txt")
        return {
            "forecast": [],
            "model_info": "Prophet (not installed)",
            "error": "Prophet not installed",
        }

    y_numeric = pd.to_numeric(df[column_y], errors="coerce")
    ds_col = pd.to_datetime(df[column_x], errors="coerce")

    valid = ds_col.notna() & y_numeric.notna()
    if valid.sum() < 2:
        logger.warning(
            "forecast: fewer than 2 valid rows after datetime parsing of '%s'",
            column_x,
        )
        return {
            "forecast": [],
            "model_info": f"Prophet {model_version}",
            "error": "Insufficient data: need at least 2 valid (date, value) pairs",
        }

    prophet_df = (
        pd.DataFrame({"ds": ds_col[valid], "y": y_numeric[valid]})
        .sort_values("ds")
        .drop_duplicates("ds")
    )

    # Silence noisy Stan / cmdstanpy loggers
    import logging as _std_logging

    for noisy in ("prophet", "cmdstanpy", "pystan"):
        _std_logging.getLogger(noisy).setLevel(_std_logging.WARNING)

    m = Prophet(
        interval_width=0.80,
        yearly_seasonality="auto",
        weekly_seasonality="auto",
        daily_seasonality=False,
    )
    m.fit(prophet_df)

    future = m.make_future_dataframe(periods=horizon)
    pred = m.predict(future)

    # Emit only the future horizon (not historical fitted values)
    forecast_only = pred.tail(horizon)
    forecast_list = [
        {
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted": round(float(row["yhat"]), 4),
            "lower_80": round(float(row["yhat_lower"]), 4),
            "upper_80": round(float(row["yhat_upper"]), 4),
        }
        for _, row in forecast_only.iterrows()
    ]

    return {
        "forecast": forecast_list,
        "model_info": f"Prophet {model_version}",
    }


# ---------------------------------------------------------------------------
# Clustering (K-Means with elbow method)
# ---------------------------------------------------------------------------

def cluster(
    df: pd.DataFrame,
    column_x: str,
    column_y: str,
    k: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    K-Means clustering on (column_x, column_y).

    If k is None the optimal number of clusters is found automatically via the
    elbow method (k=2..10, inertia second derivative).

    Returns:
        [{"row_index": int, "x_value": any, "y_value": float, "cluster": int}]
    """
    x_numeric = pd.to_numeric(df[column_x], errors="coerce")
    y_numeric = pd.to_numeric(df[column_y], errors="coerce")

    valid = x_numeric.notna() & y_numeric.notna()
    if valid.sum() < 2:
        logger.warning("cluster: insufficient valid numeric rows for clustering")
        return []

    X = np.column_stack(
        [x_numeric[valid].values, y_numeric[valid].values]
    )
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    n_samples = int(valid.sum())
    if k is None:
        k = _elbow_k(X_scaled)

    k = max(2, min(k, 10, n_samples))
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled)

    results = []
    original_indices = df.index[valid].tolist()
    for i, orig_idx in enumerate(original_indices):
        x_val = df.loc[orig_idx, column_x]
        if hasattr(x_val, "item"):
            x_val = x_val.item()
        results.append({
            "row_index": int(orig_idx),
            "x_value": (
                str(x_val) if not isinstance(x_val, (int, float)) else x_val
            ),
            "y_value": round(float(y_numeric.loc[orig_idx]), 4),
            "cluster": int(labels[i]),
        })

    return results


def _elbow_k(X_scaled: np.ndarray, max_k: int = 10) -> int:
    """Return the optimal k via the second-derivative elbow method."""
    n = len(X_scaled)
    max_k = min(max_k, n - 1)
    if max_k < 2:
        return 2

    inertias: List[float] = []
    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=5)
        km.fit(X_scaled)
        inertias.append(km.inertia_)

    if len(inertias) < 3:
        return 2

    deltas = np.diff(inertias)
    second_deriv = np.diff(deltas)
    # k=2 corresponds to index 0 of inertias; elbow index is offset by +2
    elbow_idx = int(np.argmax(second_deriv)) + 2
    return min(elbow_idx, max_k)


# ---------------------------------------------------------------------------
# Textual summary (LLM via Ollama — stats only, never raw data)
# ---------------------------------------------------------------------------

async def summarize(df: pd.DataFrame, columns: List[str]) -> str:
    """
    Generate a French prose summary using the self-hosted LLM.

    Only aggregated column statistics are forwarded — no raw cell values.
    Falls back to a rule-based summary if Ollama is unreachable.
    """
    stats = _compute_column_stats(df)
    return await llm_service.generate_summary(stats, columns)


# ---------------------------------------------------------------------------
# Internal stats aggregator
# ---------------------------------------------------------------------------

def _compute_column_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """Return a compact stats dict suitable for LLM prompt construction."""
    stats: Dict[str, Any] = {
        "rows": len(df),
        "columns": len(df.columns),
        "missing_by_column": {},
        "sample_stats": {},
    }
    for col in df.columns:
        null_count = int(df[col].isna().sum())
        unique_count = int(df[col].nunique())
        stats["missing_by_column"][col] = null_count

        numeric = pd.to_numeric(df[col], errors="coerce").dropna()
        if not numeric.empty:
            stats["sample_stats"][col] = {
                "min": float(numeric.min()),
                "max": float(numeric.max()),
                "mean": round(float(numeric.mean()), 4),
                "std": round(float(numeric.std()), 4),
                "null_count": null_count,
                "unique_count": unique_count,
            }
        else:
            stats["sample_stats"][col] = {
                "null_count": null_count,
                "unique_count": unique_count,
            }
    return stats
