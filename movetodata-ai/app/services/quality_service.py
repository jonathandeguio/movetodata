"""
quality_service.py — Smart Connector heuristics for F4.

All computations are 100% local:
  - Quality scoring: pandas + IsolationForest (scikit-learn, BSD-3-Clause)
  - Type detection: heuristics based on column name patterns and value analysis
  - Chart suggestions: rule-based heuristics + optional LLM title generation

Sovereignty contract:
  - No raw cell values are ever sent to the LLM.
  - Only column names and chart type descriptions are used in LLM prompts.
  - The IsolationForest and all statistics are computed in-process.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Column type detection
# ---------------------------------------------------------------------------

# Keywords indicating a geographic column (checked against lowercase col name)
GEO_KEYWORDS = {
    "lat", "lng", "lon", "latitude", "longitude",
    "country", "city", "region", "department", "zip",
    "code_postal", "postal", "commune", "province", "state",
    "pays", "ville", "departement",
}

# Keywords indicating a time/date column
TIME_KEYWORDS = {
    "date", "time", "year", "month", "day", "hour",
    "timestamp", "datetime", "periode", "period", "annee",
    "mois", "semaine", "week", "quarter", "trimestre",
}

# SQL type substrings that indicate numeric columns
NUMERIC_SQL_TYPES = {
    "int", "float", "double", "decimal", "numeric",
    "real", "number", "bigint", "smallint", "tinyint",
    "money", "currency",
}

# SQL type substrings that indicate date/time columns
DATE_SQL_TYPES = {
    "date", "time", "timestamp", "datetime", "year",
}


def detect_column_types(
    df: pd.DataFrame,
    columns_info: List[Dict[str, str]],
) -> Dict[str, str]:
    """
    Assign a semantic type to each column.

    Types returned: "time_series" | "numeric" | "categorical" |
                    "geographic" | "boolean" | "text"

    Priority order (first match wins):
      1. geographic  — col name contains a geo keyword
      2. time_series — SQL type is date/time OR col name has a time keyword
                       AND values are parsable as dates
      3. boolean     — SQL type is bool, or exactly 2 unique values
      4. numeric     — SQL type is numeric, or values coerce to float
      5. categorical — < 50 unique values AND ratio unique/total < 0.3
      6. text        — everything else
    """
    result: Dict[str, str] = {}
    col_names = [c["name"] for c in columns_info]
    sql_type_map = {c["name"]: c.get("sql_type", "").lower() for c in columns_info}

    for col_info in columns_info:
        col = col_info["name"]
        sql_type = sql_type_map.get(col, "")
        col_lower = col.lower()

        if col not in df.columns:
            result[col] = "text"
            continue

        series = df[col]
        n_total = len(series)
        n_unique = series.nunique(dropna=True)
        n_null = series.isna().sum()

        # 1. Geographic
        tokens = re.split(r"[_\s\-]", col_lower)
        if any(tok in GEO_KEYWORDS for tok in tokens) or col_lower in GEO_KEYWORDS:
            result[col] = "geographic"
            continue

        # 2. Time series
        is_date_sql = any(dt in sql_type for dt in DATE_SQL_TYPES)
        is_time_name = any(tok in TIME_KEYWORDS for tok in tokens) or col_lower in TIME_KEYWORDS
        if is_date_sql or is_time_name:
            # Verify that at least 50% of non-null values parse as dates
            sample = series.dropna().head(100)
            if len(sample) > 0:
                parsed = pd.to_datetime(sample, errors="coerce")
                if parsed.notna().mean() >= 0.5:
                    result[col] = "time_series"
                    continue

        # 3. Boolean
        if "bool" in sql_type or (n_unique == 2 and n_total > 0):
            result[col] = "boolean"
            continue

        # 4. Numeric (SQL type check first, then coercion attempt)
        if any(nt in sql_type for nt in NUMERIC_SQL_TYPES):
            result[col] = "numeric"
            continue

        numeric_series = pd.to_numeric(series.dropna().head(100), errors="coerce")
        if len(numeric_series) > 0 and numeric_series.notna().mean() >= 0.8:
            result[col] = "numeric"
            continue

        # 5. Categorical
        if n_total > 0 and n_unique < 50 and (n_unique / n_total) < 0.3:
            result[col] = "categorical"
            continue

        # 6. Text / fallback
        result[col] = "text"

    return result


# ---------------------------------------------------------------------------
# Quality scoring
# ---------------------------------------------------------------------------

def compute_quality_score(
    df: pd.DataFrame,
    columns_info: List[Dict[str, str]],
) -> Dict[str, Any]:
    """
    Compute a multi-dimensional data quality score.

    Returns:
        {
            "global":        int (0-100),
            "completeness":  int (0-100),
            "uniqueness":    int (0-100),
            "consistency":   int (0-100),
            "outlier_ratio": float (0.0-1.0),
        }
    """
    n = len(df)
    if n == 0:
        return {
            "global": 0, "completeness": 0,
            "uniqueness": 100, "consistency": 0, "outlier_ratio": 0.0,
        }

    # --- Completeness: average % of non-null values per column ---
    completeness = int(round(
        df.notna().mean(axis=0).mean() * 100
    ))

    # --- Uniqueness: 100 - (duplicate_rows / total * 100) ---
    n_dups = int(df.duplicated().sum())
    uniqueness = int(round(max(0.0, 1.0 - (n_dups / n)) * 100))

    # --- Consistency: % of columns where values match the declared SQL type ---
    consistency = _compute_consistency(df, columns_info)

    # --- Outlier ratio: IsolationForest on numeric columns ---
    outlier_ratio = _compute_outlier_ratio(df)

    # --- Global: weighted average ---
    global_score = int(round(
        completeness * 0.35
        + uniqueness  * 0.25
        + consistency * 0.25
        + (1.0 - outlier_ratio) * 100 * 0.15
    ))
    global_score = max(0, min(100, global_score))

    return {
        "global":        global_score,
        "completeness":  completeness,
        "uniqueness":    uniqueness,
        "consistency":   consistency,
        "outlier_ratio": round(outlier_ratio, 4),
    }


def _compute_consistency(
    df: pd.DataFrame,
    columns_info: List[Dict[str, str]],
) -> int:
    """
    Percentage of columns where the actual values are consistent with the
    declared SQL type.  A column passes if ≥ 80% of non-null values are
    coercible to the expected Python type.
    """
    if not columns_info:
        return 100

    consistent = 0
    for col_info in columns_info:
        col = col_info["name"]
        sql_type = col_info.get("sql_type", "").lower()

        if col not in df.columns:
            continue

        series = df[col].dropna()
        if len(series) == 0:
            consistent += 1  # vacuously consistent
            continue

        sample = series.head(200)

        if any(nt in sql_type for nt in NUMERIC_SQL_TYPES):
            coerced = pd.to_numeric(sample, errors="coerce")
            if coerced.notna().mean() >= 0.8:
                consistent += 1
        elif any(dt in sql_type for dt in DATE_SQL_TYPES):
            coerced = pd.to_datetime(sample, errors="coerce")
            if coerced.notna().mean() >= 0.8:
                consistent += 1
        elif "bool" in sql_type:
            # Accept anything that looks like a boolean
            bool_values = {"true", "false", "1", "0", "yes", "no", "t", "f"}
            check = sample.astype(str).str.lower().isin(bool_values)
            if check.mean() >= 0.8:
                consistent += 1
        else:
            # varchar / text: always consistent
            consistent += 1

    return int(round(consistent / len(columns_info) * 100)) if columns_info else 100


def _compute_outlier_ratio(df: pd.DataFrame) -> float:
    """
    Run IsolationForest on all numeric columns and return the fraction of
    rows flagged as outliers.  Returns 0.0 if there are no numeric columns
    or fewer than 10 rows.
    """
    try:
        from sklearn.ensemble import IsolationForest  # type: ignore

        numeric_df = df.select_dtypes(include=[np.number])

        if numeric_df.empty:
            # Try to coerce object columns to numeric
            coerced_cols = {}
            for col in df.columns:
                coerced = pd.to_numeric(df[col], errors="coerce")
                if coerced.notna().mean() >= 0.7:
                    coerced_cols[col] = coerced
            if not coerced_cols:
                return 0.0
            numeric_df = pd.DataFrame(coerced_cols)

        n = len(numeric_df)
        if n < 10:
            return 0.0

        # Fill NaN with column median
        numeric_filled = numeric_df.fillna(numeric_df.median())

        clf = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=50,
        )
        preds = clf.fit_predict(numeric_filled)
        outlier_count = int((preds == -1).sum())
        return round(outlier_count / n, 4)

    except Exception as exc:
        logger.warning("outlier_ratio computation failed: %s", exc)
        return 0.0


# ---------------------------------------------------------------------------
# Chart suggestion
# ---------------------------------------------------------------------------

def suggest_charts(
    df: pd.DataFrame,
    detected_types: Dict[str, str],
    column_names: List[str],
) -> List[Dict[str, Any]]:
    """
    Generate up to 6 heuristic chart suggestions based on detected column types.

    Each suggestion:
        {
            "chartType":  "line"|"bar"|"scatter"|"pie"|"histogram"|"map",
            "columnX":    str,
            "columnY":    str | None,
            "title":      str,   (heuristic; replaced by LLM in the router)
            "reason":     str,
        }
    """
    suggestions: List[Dict[str, Any]] = []

    time_cols       = [c for c in column_names if detected_types.get(c) == "time_series"]
    numeric_cols    = [c for c in column_names if detected_types.get(c) == "numeric"]
    categorical_cols= [c for c in column_names if detected_types.get(c) == "categorical"]
    geo_cols        = [c for c in column_names if detected_types.get(c) == "geographic"]

    # Rule 1: time_series + numeric → line chart
    if time_cols and numeric_cols:
        cx, cy = time_cols[0], numeric_cols[0]
        suggestions.append({
            "chartType": "line",
            "columnX":   cx,
            "columnY":   cy,
            "title":     f"{cy} au fil du temps",
            "reason":    f"Colonne temporelle '{cx}' détectée — un graphique en ligne met en évidence les tendances.",
        })

    # Rule 2: categorical + numeric → bar chart
    if categorical_cols and numeric_cols:
        cx = categorical_cols[0]
        cy = numeric_cols[0] if numeric_cols[0] != cx else (numeric_cols[1] if len(numeric_cols) > 1 else None)
        if cy:
            suggestions.append({
                "chartType": "bar",
                "columnX":   cx,
                "columnY":   cy,
                "title":     f"{cy} par {cx}",
                "reason":    f"Comparaison de '{cy}' par catégorie '{cx}'.",
            })

    # Rule 3: 2 numeric cols → scatter
    if len(numeric_cols) >= 2:
        cx, cy = numeric_cols[0], numeric_cols[1]
        suggestions.append({
            "chartType": "scatter",
            "columnX":   cx,
            "columnY":   cy,
            "title":     f"Corrélation {cx} / {cy}",
            "reason":    f"Deux colonnes numériques — un nuage de points révèle les corrélations.",
        })

    # Rule 4: geographic + numeric → map
    if geo_cols and numeric_cols:
        cx = geo_cols[0]
        cy = numeric_cols[0]
        suggestions.append({
            "chartType": "map",
            "columnX":   cx,
            "columnY":   cy,
            "title":     f"{cy} par zone géographique",
            "reason":    f"Colonne géographique '{cx}' détectée — une carte est recommandée.",
        })

    # Rule 5: categorical alone → pie (max 8 categories)
    if categorical_cols:
        cx = categorical_cols[0]
        n_unique = df[cx].nunique() if cx in df.columns else 0
        if 2 <= n_unique <= 8:
            suggestions.append({
                "chartType": "pie",
                "columnX":   cx,
                "columnY":   None,
                "title":     f"Répartition de {cx}",
                "reason":    f"{n_unique} catégories dans '{cx}' — un camembert montre la distribution.",
            })

    # Rule 6: numeric alone → histogram
    if numeric_cols:
        cy = numeric_cols[0]
        suggestions.append({
            "chartType": "histogram",
            "columnX":   cy,
            "columnY":   None,
            "title":     f"Distribution de {cy}",
            "reason":    f"Colonne numérique '{cy}' — un histogramme montre la distribution des valeurs.",
        })

    # Deduplicate and limit to 6
    seen: set = set()
    unique_suggestions = []
    for s in suggestions:
        key = (s["chartType"], s["columnX"], s.get("columnY"))
        if key not in seen:
            seen.add(key)
            unique_suggestions.append(s)
        if len(unique_suggestions) >= 6:
            break

    return unique_suggestions


async def enrich_titles_with_llm(
    suggestions: List[Dict[str, Any]],
    detected_types: Dict[str, str],
) -> List[Dict[str, Any]]:
    """
    Use the LLM to generate more natural French titles for each suggestion.

    Only column names and chart types are included in the prompt — never
    any cell values.  Falls back to heuristic titles if the LLM is unavailable.
    """
    from app.services import llm_service

    if not suggestions:
        return suggestions

    # Build a compact prompt describing all suggestions
    descriptions = []
    for i, s in enumerate(suggestions):
        col_y_part = f" vs '{s['columnY']}'" if s.get("columnY") else ""
        descriptions.append(
            f"{i+1}. Graphique '{s['chartType']}' avec colonne X='{s['columnX']}'{col_y_part}."
        )

    prompt = (
        "Tu es un analyste de données. "
        "Génère des titres courts (5-8 mots) en français pour chacun de ces graphiques. "
        "Réponds UNIQUEMENT avec un tableau JSON de strings, un titre par ligne, dans le même ordre.\n\n"
        + "\n".join(descriptions)
        + "\n\nTitres JSON :"
    )

    raw = await llm_service._call_ollama(prompt)
    titles = llm_service._parse_json_list(raw)

    if titles and len(titles) == len(suggestions):
        enriched = []
        for s, title in zip(suggestions, titles):
            enriched.append({**s, "title": str(title)})
        return enriched

    # Fallback: keep heuristic titles
    logger.warning("LLM title enrichment failed — keeping heuristic titles")
    return suggestions
