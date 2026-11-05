"""
mistral_provider.py — Stub pour le provider Mistral OVHcloud (non configuré).

Ce module réserve la place pour une future migration vers Mistral AI hébergé
sur OVHcloud (infrastructure européenne souveraine).

Pour l'activer :
  1. Définir LLM_PROVIDER=mistral dans les variables d'environnement.
  2. Définir MISTRAL_API_KEY et optionnellement MISTRAL_API_URL.
  3. Implémenter la logique d'appel dans cette classe.
"""
from __future__ import annotations

import logging
from typing import Any

from .llm_provider import LlmProvider

logger = logging.getLogger(__name__)


class MistralProvider(LlmProvider):
    """
    Provider Mistral OVHcloud — stub non implémenté.

    Toutes les méthodes lèvent NotImplementedError.
    """

    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        raise NotImplementedError(
            "Mistral OVHcloud provider not configured. "
            "Set LLM_PROVIDER=mistral and MISTRAL_API_KEY."
        )

    async def health(self) -> bool:
        """Mistral non configuré — retourne toujours False."""
        return False
