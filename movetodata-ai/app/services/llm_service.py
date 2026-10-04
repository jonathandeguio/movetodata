"""
llm_service.py — Sovereign LLM integration via Ollama (self-hosted).

Model used: qwen2.5:14b
Provider: Ollama running on the same infrastructure (http://localhost:11434 by default).

Sovereignty contract:
  - Only aggregated statistics and column NAMES are sent to the LLM.
  - Raw cell values are NEVER included in any prompt.
  - The Ollama endpoint must be reachable within the MoveToData infrastructure;
    no external network call is ever made.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List

import httpx

logger = logging.getLogger(__name__)

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "qwen2.5:14b")
TEXT_TO_SQL_MODEL: str = os.getenv("TEXT_TO_SQL_MODEL", "qwen2.5-coder:7b")
TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "120"))

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def generate_sql(
    schema_ddl: str,
    question: str,
    source_type: str = "ANSI",
) -> tuple[str, int]:
    """
    Generate a single SQL SELECT query from a schema DDL and a natural-language
    question.

    Returns a tuple (sql_text, tokens_used).
    - sql_text is "" if the LLM cannot answer or if Ollama is unreachable.
    - tokens_used is an estimate derived from the prompt character count.

    Sovereignty contract: only schema DDL (table/column names + types) and the
    user's question are sent — never cell values.
    """
    prompt = _build_text_to_sql_prompt(schema_ddl, question, source_type)
    # Rough token estimate: ~4 chars per token
    tokens_used = max(1, len(prompt) // 4)
    raw = await _call_ollama(prompt, model=TEXT_TO_SQL_MODEL)
    return raw.strip() if raw else "", tokens_used


async def generate_summary(stats: Dict[str, Any], column_names: List[str]) -> str:
    """
    Generate a 3–5 sentence French summary of the dataset from its statistics.

    Only statistics and column names are sent — never cell values.
    Returns a plain-text string. Falls back to a default message if the LLM
    is unreachable or returns an error.
    """
    prompt = _build_summary_prompt(stats, column_names)
    raw = await _call_ollama(prompt)
    return raw.strip() if raw else _fallback_summary(stats)


async def generate_recommendations(
    stats: Dict[str, Any], column_names: List[str]
) -> List[Dict[str, str]]:
    """
    Generate 3–5 prioritised recommendations from the dataset statistics.

    Returns a list of dicts: [{"action": str, "priority": "high|medium|low", "reason": str}].
    Falls back to rule-based recommendations if the LLM fails or returns
    invalid JSON.
    """
    prompt = _build_recommendations_prompt(stats, column_names)
    raw = await _call_ollama(prompt)
    parsed = _parse_json_list(raw)
    if parsed is not None:
        return parsed
    logger.warning("LLM returned non-JSON recommendations — using rule-based fallback.")
    return _fallback_recommendations(stats)


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

def _build_text_to_sql_prompt(
    schema_ddl: str,
    question: str,
    source_type: str,
) -> str:
    return (
        "You are an expert SQL assistant. Given the following database schema, "
        "generate a single valid SQL SELECT query that answers the user's question.\n\n"
        "Rules:\n"
        "- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, CREATE, ALTER)\n"
        f"- Prefer ANSI SQL compatible with {source_type}\n"
        "- Use ONLY table and column names that exist in the schema below\n"
        "- Return ONLY the SQL query, no explanation, no markdown code blocks\n"
        "- If the question cannot be answered with this schema, respond with exactly: CANNOT_ANSWER\n\n"
        f"Schema:\n{schema_ddl}\n\n"
        f"Question: {question}\n\n"
        "SQL:"
    )


def _build_summary_prompt(stats: Dict[str, Any], column_names: List[str]) -> str:
    stats_json = json.dumps(
        {k: v for k, v in stats.items() if k != "sample_stats"},
        ensure_ascii=False,
        indent=2,
    )
    return (
        "Tu es un analyste de données expert. "
        "Génère un résumé en français de 3 à 5 phrases à partir "
        "des statistiques suivantes d'un jeu de données. "
        "Ne mentionne jamais de valeurs individuelles de cellules. "
        "Concentre-toi sur la structure, la qualité et le potentiel analytique.\n\n"
        f"Colonnes : {', '.join(column_names)}\n\n"
        f"Statistiques :\n{stats_json}\n\n"
        "Résumé :"
    )


def _build_recommendations_prompt(
    stats: Dict[str, Any], column_names: List[str]
) -> str:
    stats_json = json.dumps(
        {k: v for k, v in stats.items() if k != "sample_stats"},
        ensure_ascii=False,
        indent=2,
    )
    return (
        "Tu es un analyste de données expert. "
        "Génère une liste JSON de 3 à 5 recommandations en français "
        "à partir des statistiques suivantes d'un jeu de données. "
        "Chaque recommandation doit être un objet JSON avec les champs : "
        '"action" (string), "priority" ("high", "medium" ou "low"), "reason" (string). '
        "Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour.\n\n"
        f"Colonnes : {', '.join(column_names)}\n\n"
        f"Statistiques :\n{stats_json}\n\n"
        "Recommandations JSON :"
    )


# ---------------------------------------------------------------------------
# Ollama HTTP client
# ---------------------------------------------------------------------------

async def _call_ollama(prompt: str, model: str | None = None) -> str:
    """
    POST to Ollama /api/generate and return the generated text.
    Returns an empty string on any error (graceful degradation).
    """
    payload = {
        "model": model if model is not None else CHAT_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 1024,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
    except httpx.ConnectError:
        logger.error(
            "Cannot connect to Ollama at %s. "
            "Ensure the service is running and OLLAMA_URL is correct.",
            OLLAMA_URL,
        )
        return ""
    except httpx.TimeoutException:
        logger.error("Ollama request timed out after %s seconds.", TIMEOUT)
        return ""
    except Exception as exc:
        logger.error("Ollama call failed: %s", exc)
        return ""


# ---------------------------------------------------------------------------
# JSON parser with fallback
# ---------------------------------------------------------------------------

def _parse_json_list(raw: str) -> List[Dict] | None:
    """
    Try to extract a JSON array from the LLM output.
    Returns None if no valid list is found.
    """
    if not raw:
        return None
    # Try direct parse
    try:
        result = json.loads(raw.strip())
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass
    # Try to find a JSON array inside the text
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(0))
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass
    return None


# ---------------------------------------------------------------------------
# Rule-based fallbacks (no LLM required)
# ---------------------------------------------------------------------------

def _fallback_summary(stats: Dict[str, Any]) -> str:
    rows = stats.get("rows", 0)
    cols = stats.get("columns", 0)
    dups = stats.get("duplicates", 0)
    return (
        f"Ce jeu de données contient {rows:,} lignes et {cols} colonnes. "
        f"Il présente {dups} lignes dupliquées. "
        "Une analyse plus approfondie est recommandée pour identifier les opportunités de nettoyage et de visualisation."
    )


def _fallback_recommendations(stats: Dict[str, Any]) -> List[Dict[str, str]]:
    recs = []
    missing = stats.get("missing_by_column", {})
    for col, ratio in missing.items():
        if ratio > 0.05:
            pct = round(ratio * 100, 1)
            priority = "high" if ratio > 0.20 else "medium"
            recs.append({
                "action": f"Traiter les {pct} % de valeurs manquantes dans la colonne '{col}'",
                "priority": priority,
                "reason": f"Un taux de {pct} % de nulls peut biaiser les analyses agrégées.",
            })
    if stats.get("duplicates", 0) > 0:
        recs.append({
            "action": f"Supprimer les {stats['duplicates']} lignes dupliquées",
            "priority": "medium",
            "reason": "Les doublons peuvent fausser les métriques cumulatives.",
        })
    detected = stats.get("detected_types", {})
    time_cols = [c for c, t in detected.items() if t == "time_series"]
    if time_cols:
        recs.append({
            "action": f"Créer une visualisation de tendance sur la colonne '{time_cols[0]}'",
            "priority": "low",
            "reason": "Colonne temporelle détectée — un graphique en ligne mettra en évidence les tendances.",
        })
    return recs[:5]
