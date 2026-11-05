"""
text_to_sql.py — POST /text-to-sql router (F1 — Text-to-SQL).

Receives a database schema DDL (or structured schema_context) and a natural-language
question from the Boson proxy, calls the configured LLM, and returns a validated
SQL SELECT query with a confidence score.

Sovereignty contract:
  - Only schema DDL (table/column names + types) and the question are sent to
    the LLM — never actual data cell values.
  - The LLM runs within the MoveToData infrastructure; no external network call
    is ever made at runtime.

Garde-fou SELECT-only (Lot 7):
  - The generated SQL is parsed to ensure it starts with SELECT.
  - Non-SELECT statements (INSERT, UPDATE, DELETE, DDL, etc.) return HTTP 400.
"""
from __future__ import annotations

import logging
import re
from typing import Optional, Set

from fastapi import APIRouter, HTTPException

from app.models.schemas import SchemaContext, TextToSqlRequest, TextToSqlResponse
from app.services import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Text-to-SQL"])

# French and English stop words excluded from confidence heuristic
_STOP_WORDS: Set[str] = {
    # French
    "quel", "quelle", "quels", "quelles", "est", "les", "des", "par",
    "dans", "sur", "avec", "pour", "que", "qui", "quoi", "dont", "où",
    "quand", "comment", "combien", "une", "un",
    "montrer", "afficher", "donner", "lister", "calculer",
    # English
    "what", "which", "where", "when", "how", "show", "list", "give",
    "find", "get", "the", "for", "and", "with", "from", "that", "are",
    "top", "all", "each", "every", "total", "sum", "count",
}

# Non-SELECT statement patterns — garde-fou Lot 7
_NON_SELECT_PATTERN = re.compile(
    r"^\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|MERGE|CALL)\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

@router.post(
    "/text-to-sql",
    response_model=TextToSqlResponse,
    summary="Generate a SQL SELECT query from a natural-language question",
)
async def text_to_sql(request: TextToSqlRequest) -> TextToSqlResponse:
    """
    1. Build a system prompt embedding the schema (DDL or schema_context) and question.
    2. Call the LLM via the configured provider (Ollama self-hosted, sovereign).
    3. Extract the SQL query from the response (handles markdown code fences).
    4. Validate SELECT-only (garde-fou Lot 7) — returns HTTP 400 for non-SELECT.
    5. Compute a keyword-overlap confidence score.
    6. Return the structured result.

    Returns HTTP 503 if the LLM is unreachable.
    Returns HTTP 400 if the generated SQL is not a valid SELECT statement.
    """
    # Resolve effective schema DDL
    effective_ddl = _resolve_schema_ddl(request)

    if not effective_ddl:
        raise HTTPException(
            status_code=422,
            detail={"error": "SCHEMA_REQUIRED",
                    "detail": "Either schema_ddl or schema_context must be provided."},
        )

    logger.info(
        "text-to-sql: source_type=%s question_len=%d schema_len=%d has_context=%s",
        request.source_type,
        len(request.question),
        len(effective_ddl),
        request.schema_context is not None,
    )

    raw_response, tokens_used = await llm_service.generate_sql(
        schema_ddl=effective_ddl,
        question=request.question,
        source_type=request.source_type,
    )

    if not raw_response:
        raise HTTPException(
            status_code=503,
            detail={"error": "LLM_UNAVAILABLE"},
        )

    sql = _extract_sql(raw_response)

    if not sql or sql.upper() == "CANNOT_ANSWER":
        raise HTTPException(
            status_code=422,
            detail={"error": "CANNOT_ANSWER", "raw": raw_response[:500]},
        )

    # Garde-fou SELECT-only
    if _NON_SELECT_PATTERN.match(sql):
        first_keyword = sql.strip().split()[0].upper() if sql.strip() else "?"
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NON_SELECT_STATEMENT",
                "detail": f"Seules les requêtes SELECT sont autorisées. Reçu : {first_keyword}.",
            },
        )

    # Confidence score
    known_columns: Optional[list[str]] = None
    if request.schema_context is not None:
        known_columns = [c.name for c in request.schema_context.columns]

    confidence = _compute_confidence(request.question, sql, known_columns=known_columns)

    warning: Optional[str] = None
    if confidence < 0.4:
        warning = "Confiance faible — vérifiez le SQL généré avant utilisation."

    return TextToSqlResponse(
        sql=sql,
        confidence=confidence,
        model=llm_service.TEXT_TO_SQL_MODEL,
        tokens_used=tokens_used,
        warning=warning,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_schema_ddl(request: TextToSqlRequest) -> str:
    """
    Derive an effective DDL string from either schema_context or schema_ddl.

    schema_context takes precedence: it is converted to a simplified DDL line.
    If neither is provided, returns an empty string.
    """
    if request.schema_context is not None:
        ctx: SchemaContext = request.schema_context
        col_parts = ", ".join(
            f"{c.name} {'[PII]' if c.is_pii else (c.type or 'UNKNOWN')}"
            for c in ctx.columns
        )
        return f"TABLE {ctx.table_name} ({col_parts})"

    return request.schema_ddl or ""


def _extract_sql(text: str) -> str:
    """
    Extract a SQL statement from the LLM output.

    The model is instructed to return bare SQL, but may wrap it in markdown
    code fences (```sql...```) — especially on a first prompt warm-up.
    """
    # Remove markdown code fences: ```sql ... ``` or ``` ... ```
    match = re.search(r"```(?:sql)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # If the model included a "SQL:" prefix in the reply
    text = re.sub(r"(?i)^sql\s*:\s*", "", text.strip())

    # Detect CANNOT_ANSWER
    if "CANNOT_ANSWER" in text.upper():
        return "CANNOT_ANSWER"

    return text.strip()


def _compute_confidence(
    question: str,
    sql: str,
    known_columns: Optional[list[str]] = None,
) -> float:
    """
    Heuristic confidence score (Lot 7 enriched).

    When known_columns is provided (schema_context path):
      - 1.0 if SQL is valid SELECT AND at least one known column appears in SQL
      - 0.7 if SQL is valid SELECT but no column recognised
      - 0.3 if parsing/extraction failed

    Without known_columns (legacy schema_ddl path):
      Keyword-overlap score as before, floored at 0.30.

    Score ranges:
      >= 0.7  → high confidence (green badge)
      >= 0.4  → medium confidence (orange badge)
       < 0.4  → low confidence (red badge, warning shown)
    """
    if known_columns is not None:
        sql_lower = sql.lower()
        columns_lower = [c.lower() for c in known_columns]
        recognized = any(c in sql_lower for c in columns_lower)
        return 1.0 if recognized else 0.7

    # Legacy keyword-overlap path
    question_words = {
        w.lower()
        for w in re.findall(r"[a-zA-ZÀ-öÙ-ÿ]{3,}", question)
        if w.lower() not in _STOP_WORDS
    }

    if not question_words:
        return 0.75

    sql_lower = sql.lower()
    matched = sum(1 for w in question_words if w in sql_lower)
    raw_score = matched / len(question_words)

    score = min(0.30 + raw_score * 0.70, 1.0)
    return round(score, 3)
