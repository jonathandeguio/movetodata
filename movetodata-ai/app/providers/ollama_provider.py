"""
ollama_provider.py — Implémentation LlmProvider pour Ollama (auto-hébergé).

Toute la logique d'appel HTTP vers Ollama est centralisée ici.
Le endpoint /api/chat est utilisé pour le format messages standard.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx

from .llm_provider import LlmProvider

logger = logging.getLogger(__name__)

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "qwen2.5:14b")
TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "120"))


class OllamaProvider(LlmProvider):
    """
    Provider LLM Ollama auto-hébergé.

    Utilise /api/chat (format messages) pour la cohérence avec l'interface.
    La souveraineté est garantie : seul le réseau interne MoveToData est
    contacté via OLLAMA_URL.
    """

    def __init__(
        self,
        url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self._url = url or OLLAMA_URL
        self._model = model or CHAT_MODEL
        self._timeout = timeout or TIMEOUT

    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Appelle Ollama /api/chat et retourne la réponse.

        Returns un dict avec au moins la clé ``content`` (str).
        En cas d'erreur réseau ou de timeout, retourne ``{"content": ""}``.
        """
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 1024,
            },
        }
        if tools:
            payload["tools"] = tools

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(f"{self._url}/api/chat", json=payload)
                response.raise_for_status()
                data = response.json()
                # Ollama /api/chat renvoie { message: { role, content }, ... }
                message = data.get("message", {})
                content = message.get("content", "")
                return {"content": content, "raw": data}
        except httpx.ConnectError:
            logger.error(
                "OllamaProvider: impossible de joindre Ollama à %s. "
                "Vérifiez OLLAMA_URL et que le service est démarré.",
                self._url,
            )
            return {"content": ""}
        except httpx.TimeoutException:
            logger.error(
                "OllamaProvider: timeout après %.0f s (OLLAMA_TIMEOUT).", self._timeout
            )
            return {"content": ""}
        except Exception as exc:
            logger.error("OllamaProvider: erreur inattendue — %s", exc)
            return {"content": ""}

    async def health(self) -> bool:
        """Vérifie la disponibilité d'Ollama via GET /api/tags."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self._url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False
