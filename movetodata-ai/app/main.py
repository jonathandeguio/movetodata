"""
main.py — MoveToData AI Service (F5 — File Import & AI Analysis).

FastAPI application exposing:
  GET  /health          — liveness probe
  POST /analyze-file    — file analysis (stats + LLM summary + recommendations)

Stack:
  - FastAPI + uvicorn
  - pandas (file parsing)
  - Ollama HTTP client (qwen2.5:14b, self-hosted)
  - pydantic v2 schemas

Sovereignty: no external network calls at runtime. All LLM inference is
delegated to the Ollama instance running within the MoveToData infrastructure.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analyze_file, chat, insights, smart_connector, text_to_sql

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

app = FastAPI(
    title="MoveToData AI Service",
    description=(
        "Sovereign AI backend for MoveToData — file analysis, "
        "augmented analytics, and LLM-powered insights."
    ),
    version="0.1.0",
)

# Allow requests from the Boson proxy (same Docker network — CORS is an
# extra safety measure for browser-direct calls in development).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(analyze_file.router)
app.include_router(text_to_sql.router)
app.include_router(insights.router)
app.include_router(chat.router)
app.include_router(smart_connector.router)


# ---------------------------------------------------------------------------
# Health endpoint (used by Docker / k8s liveness probes and Boson's graceful
# degradation check).
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "ok", "service": "movetodata-ai"}
