"""
tests/test_text_to_sql.py — Tests unitaires Text-to-SQL (Lot 7).

Couvre :
  - SELECT valide → passe (HTTP 200)
  - INSERT → rejeté (HTTP 400 NON_SELECT_STATEMENT)
  - UPDATE → rejeté (HTTP 400)
  - DELETE → rejeté (HTTP 400)
  - schema_context fourni → colonnes injectées dans le prompt LLM
  - confidence score : SQL avec colonnes reconnues → 1.0, SQL seul → 0.7
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Minimal FastAPI app pour les tests (isole le router sans tout le main.py)
# ---------------------------------------------------------------------------

from fastapi import FastAPI

from app.routers.text_to_sql import router as tts_router

app = FastAPI()
app.include_router(tts_router)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_llm(sql: str):
    """Return an AsyncMock that simulates llm_service.generate_sql returning `sql`."""
    async def _fake_generate_sql(**kwargs):  # noqa: ANN202
        return f"```sql\n{sql}\n```", 42
    return _fake_generate_sql


# ---------------------------------------------------------------------------
# Tests SELECT valide
# ---------------------------------------------------------------------------

@patch("app.routers.text_to_sql.llm_service.generate_sql", new_callable=AsyncMock)
def test_valid_select(mock_gen):
    """Un SELECT valide doit retourner HTTP 200 avec le SQL extrait."""
    mock_gen.return_value = ("```sql\nSELECT id, name FROM clients\n```", 10)

    resp = client.post(
        "/text-to-sql",
        json={
            "schema_ddl": "TABLE clients (id INT, name VARCHAR)",
            "question": "Liste tous les clients",
            "source_type": "POSTGRES",
        },
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "SELECT" in body["sql"].upper()
    assert 0.0 <= body["confidence"] <= 1.0
    assert body["tokens_used"] == 10


# ---------------------------------------------------------------------------
# Tests garde-fou SELECT-only
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("bad_sql,first_kw", [
    ("INSERT INTO clients VALUES (1, 'test')", "INSERT"),
    ("UPDATE clients SET name = 'x' WHERE id = 1", "UPDATE"),
    ("DELETE FROM clients WHERE id = 1", "DELETE"),
    ("DROP TABLE clients", "DROP"),
    ("CREATE TABLE foo (id INT)", "CREATE"),
])
@patch("app.routers.text_to_sql.llm_service.generate_sql", new_callable=AsyncMock)
def test_non_select_rejected(mock_gen, bad_sql: str, first_kw: str):
    """Toute instruction non-SELECT doit être rejetée avec HTTP 400."""
    mock_gen.return_value = (bad_sql, 10)

    resp = client.post(
        "/text-to-sql",
        json={
            "schema_ddl": "TABLE clients (id INT, name VARCHAR)",
            "question": "Supprime les clients",
            "source_type": "POSTGRES",
        },
    )

    assert resp.status_code == 400, f"Expected 400 for {first_kw}, got {resp.status_code}"
    body = resp.json()
    assert body["detail"]["error"] == "NON_SELECT_STATEMENT"


# ---------------------------------------------------------------------------
# Tests schema_context
# ---------------------------------------------------------------------------

@patch("app.routers.text_to_sql.llm_service.generate_sql", new_callable=AsyncMock)
def test_schema_context_injected_into_ddl(mock_gen):
    """
    Quand schema_context est fourni, il doit être converti en DDL et transmis
    au LLM (schema_ddl contient le nom de la table et les colonnes).
    """
    captured_kwargs: dict = {}

    async def _capture(**kwargs):  # noqa: ANN202
        captured_kwargs.update(kwargs)
        return "SELECT montant FROM commandes", 15

    mock_gen.side_effect = _capture

    resp = client.post(
        "/text-to-sql",
        json={
            "schema_context": {
                "table_name": "commandes",
                "columns": [
                    {"name": "id", "type": "INT", "is_pii": False},
                    {"name": "montant", "type": "DECIMAL", "is_pii": False},
                    {"name": "email_client", "type": "VARCHAR", "is_pii": True},
                ],
            },
            "question": "Quel est le montant total ?",
            "source_type": "POSTGRES",
        },
    )

    assert resp.status_code == 200, resp.text
    # Le DDL transmis au LLM doit mentionner la table et les colonnes
    ddl_sent = captured_kwargs.get("schema_ddl", "")
    assert "commandes" in ddl_sent
    assert "montant" in ddl_sent


# ---------------------------------------------------------------------------
# Tests confidence score avec schema_context
# ---------------------------------------------------------------------------

@patch("app.routers.text_to_sql.llm_service.generate_sql", new_callable=AsyncMock)
def test_confidence_high_when_columns_recognized(mock_gen):
    """
    Confidence = 1.0 quand le SQL généré contient au moins une colonne connue.
    """
    mock_gen.return_value = ("SELECT montant FROM commandes", 10)

    resp = client.post(
        "/text-to-sql",
        json={
            "schema_context": {
                "table_name": "commandes",
                "columns": [
                    {"name": "id", "type": "INT", "is_pii": False},
                    {"name": "montant", "type": "DECIMAL", "is_pii": False},
                ],
            },
            "question": "Quel est le montant total ?",
        },
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["confidence"] == 1.0


@patch("app.routers.text_to_sql.llm_service.generate_sql", new_callable=AsyncMock)
def test_confidence_medium_when_no_column_recognized(mock_gen):
    """
    Confidence = 0.7 quand le SQL est valide mais ne contient aucune colonne connue.
    """
    # Le SQL retourné ne contient aucune colonne du schéma
    mock_gen.return_value = ("SELECT * FROM unknown_table", 10)

    resp = client.post(
        "/text-to-sql",
        json={
            "schema_context": {
                "table_name": "commandes",
                "columns": [
                    {"name": "id", "type": "INT", "is_pii": False},
                    {"name": "montant", "type": "DECIMAL", "is_pii": False},
                ],
            },
            "question": "Quelque chose",
        },
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["confidence"] == 0.7


# ---------------------------------------------------------------------------
# Test schema requis
# ---------------------------------------------------------------------------

def test_no_schema_returns_422():
    """Sans schema_ddl ni schema_context, on attend HTTP 422."""
    resp = client.post(
        "/text-to-sql",
        json={"question": "Quelle est la moyenne ?"},
    )
    assert resp.status_code == 422
