"""
Pydantic schemas for the movetodata-ai service (F5 — File Import & AI Analysis).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class AnalyzeFileRequest(BaseModel):
    """Payload sent by the Boson proxy when a file analysis is requested."""

    file_path: str = Field(..., description="Absolute path to the file on shared storage.")
    filename: str = Field(..., description="Original filename (used to infer format).")
    sheet: Optional[str] = Field(
        default=None,
        description="Sheet name for Excel files; ignored for other formats.",
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ColumnStats(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    p25: Optional[float] = None
    p75: Optional[float] = None


class Correlation(BaseModel):
    col1: str
    col2: str
    r: float


class FileStats(BaseModel):
    rows: int
    columns: int
    missing_by_column: Dict[str, float] = Field(
        description="Ratio of missing values (0–1) per column."
    )
    duplicates: int
    detected_types: Dict[str, str] = Field(
        description="Detected column type: time_series | numeric | categorical | boolean."
    )
    top_correlations: List[Correlation] = Field(
        default_factory=list,
        description="Top-5 Pearson correlations among numeric columns.",
    )
    sample_stats: Dict[str, ColumnStats] = Field(
        default_factory=dict,
        description="Descriptive statistics per numeric column.",
    )


class Recommendation(BaseModel):
    action: str
    priority: str = Field(description="high | medium | low")
    reason: str


class ChartSuggestion(BaseModel):
    chart_type: str = Field(description="e.g. line, bar, pie, scatter")
    column_x: str
    column_y: Optional[str] = None
    title: str


class AnalyzeFileResponse(BaseModel):
    file_id: Optional[str] = None
    filename: str
    stats: FileStats
    summary: str
    recommendations: List[Recommendation]
    chart_suggestions: List[ChartSuggestion]
    model: str = "qwen2.5:14b (Ollama)"


# ---------------------------------------------------------------------------
# F1 — Text-to-SQL schemas
# ---------------------------------------------------------------------------

class TextToSqlRequest(BaseModel):
    """Payload sent by the Boson proxy when a Text-to-SQL query is requested."""

    schema_ddl: str = Field(
        ...,
        description=(
            "Simplified DDL of the database schema "
            "(TABLE name (col TYPE, …) format, one table per line)."
        ),
    )
    question: str = Field(
        ...,
        description="The user's question in natural language (French or English).",
    )
    source_type: str = Field(
        default="ANSI",
        description="DBMS dialect hint, e.g. POSTGRES, MYSQL, SNOWFLAKE, ANSI.",
    )


class TextToSqlResponse(BaseModel):
    """Response returned by the /text-to-sql endpoint."""

    sql: str = Field(description="The generated SQL SELECT query.")
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Heuristic confidence score (0.0 – 1.0).",
    )
    model: str = Field(description="LLM model used for generation.")
    tokens_used: int = Field(
        default=0,
        description="Approximate number of prompt tokens consumed.",
    )


# ---------------------------------------------------------------------------
# F2 — Augmented Analytics schemas
# ---------------------------------------------------------------------------

class InsightsOptions(BaseModel):
    """Optional parameters for the analytics computation."""

    forecast_horizon: Optional[int] = Field(
        default=30,
        ge=1,
        le=365,
        description="Number of periods to forecast (days). Default: 30.",
    )
    cluster_k: Optional[int] = Field(
        default=None,
        ge=2,
        le=10,
        description="Number of clusters for K-Means. If null, auto-detected via elbow method.",
    )
    anomaly_contamination: Optional[float] = Field(
        default=0.05,
        ge=0.01,
        le=0.50,
        description="Fraction of expected anomalies (0.01–0.50). Default: 0.05.",
    )


class InsightsRequest(BaseModel):
    """
    Payload sent by the Boson proxy for an augmented analytics request.

    The data must be pre-fetched server-side by Boson (max 10 000 rows) before
    forwarding to this service — raw data never travels through the browser.
    """

    data: List[List[Any]] = Field(
        ...,
        description=(
            "Tabular data as a list of rows. Each row is a list of values "
            "aligned with the 'columns' field. Maximum 10 000 rows."
        ),
    )
    columns: List[str] = Field(
        ...,
        description="Column names corresponding to each position in the data rows.",
    )
    column_x: str = Field(
        ...,
        description="Name of the X-axis column (date or numeric).",
    )
    column_y: str = Field(
        ...,
        description="Name of the Y-axis / metric column (must be numeric).",
    )
    type: str = Field(
        ...,
        description="Analytics type: 'anomaly' | 'forecast' | 'cluster' | 'summary'.",
    )
    options: Optional[InsightsOptions] = Field(
        default=None,
        description="Optional computation parameters.",
    )


class InsightsResponse(BaseModel):
    """Response returned by the /insights endpoint."""

    type: str = Field(description="The analytics type that was computed.")
    results: List[Any] = Field(
        description=(
            "Computation results. Structure depends on 'type':\n"
            "  anomaly  → list of {row_index, x_value, y_value, score}\n"
            "  forecast → list of {date, predicted, lower_80, upper_80}\n"
            "  cluster  → list of {row_index, x_value, y_value, cluster}\n"
            "  summary  → list with one {text: str} element"
        ),
    )
    model: str = Field(description="Model / library used for the computation.")
    row_count: int = Field(description="Number of data rows actually processed.")
    warning: Optional[str] = Field(
        default=None,
        description="Non-fatal warning, e.g. data truncation notice.",
    )
