"""
text_to_sql.py — POST /text-to-sql router (F1 — Text-to-SQL).

Receives a database schema DDL and a natural-language question from the Boson
proxy, calls qwen2.5-coder:7b via Ollama, and returns a validated SQL SELECT
query with a confidence score.

Sovereignty contract:
  - Only schema DDL (table/column names + types) and the question are sent to
    the LLM — never actual data cell values.
  - Ollama runs within the MoveToData infrastructure; no external network call
    is ever made at runtime.
"""
from __future__ import annotations

import logging
import re
from typing import Set

from fastapi import APIRouter, HTTPException

from app.models.schemas import TextToSqlRequest, TextToSqlResponse
from app.services import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Text-to-SQL"])

# French and English stop words excluded from confidence heuristic
_STOP_WORDS: Set[str] = {
    # French
    "quel", "quelle", "quels", "quelles", "est", "les", "des", "par",
    "dans", "sur", "avec", "pour", "que", "qui", "quoi", "dont", "où",
    "quel", "quand", "comment", "combien", "quel", "une", "un",
    "montrer", "afficher", "donner", "lister", "calculer",
    # English
    "what", "which", "where", "when", "how", "show", "list", "give",
    "find", "get", "the", "for", "and", "with", "from", "that", "are",
    "top", "all", "each", "every", "total", "sum", "count",
}


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
    1. Build a system prompt embedding the schema DDL and user question.
    2. Call qwen2.5-coder:7b via Ollama (self-hosted, sovereign).
    3. Extract the SQL query from the response (handles markdown code fences).
    4. Compute a keyword-overlap confidence score.
    5. Return the structured result.

    Returns HTTP 503 if Ollama is unreachable.
    """
    logger.info(
        "text-to-sql: source_type=%s question_len=%d schema_len=%d",
        request.source_type,
        len(request.question),
        len(request.schema_ddl),
    )

    raw_response, tokens_used = await llm_service.generate_sql(
        schema_ddl=request.schema_ddl,
        question=request.question,
        source_type=request.source_type,
    )

    # Ollama unreachable: generate_sql returns ("", tokens_used)
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

    confidence = _compute_confidence(request.question, sql)

    return TextToSqlResponse(
        sql=sql,
        confidence=confidence,
        model=llm_service.TEXT_TO_SQL_MODEL,
        tokens_used=tokens_used,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


def _compute_confidence(question: str, sql: str) -> float:
    """
    Heuristic confidence score based on how many meaningful words from the
    question appear in the generated SQL.

    Score ranges from 0.0 to 1.0:
      >= 0.8  → high confidence (green badge)
      >= 0.6  → medium confidence (orange badge)
       < 0.6  → low confidence (red badge, warning shown)

    This is a lightweight proxy for model confidence — the LLM does not
    return a log-probability in the /api/generate endpoint.
    """
    # Tokenise question: keep words longer than 3 chars, lower-cased
    question_words = {
        w.lower()
        for w in re.findall(r"[a-zA-ZÀ-öÙ-ÿ]{3,}", question)
        if w.lower() not in _STOP_WORDS
    }

    if not question_words:
        # Fallback: if no meaningful words, assume medium confidence
        return 0.75

    sql_lower = sql.lower()
    matched = sum(1 for w in question_words if w in sql_lower)
    raw_score = matched / len(question_words)

    # Apply a mild dampening so perfect overlap still caps below 1.0
    # (some question words are legitimately absent from SQL keywords).
    # Floor at 0.30 to avoid extreme low scores for short questions.
    score = min(0.30 + raw_score * 0.70, 1.0)
    return round(score, 3)
