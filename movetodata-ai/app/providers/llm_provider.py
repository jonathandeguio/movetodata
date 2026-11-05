"""
llm_provider.py — Interface abstraite pour les fournisseurs LLM.

Souveraineté : toutes les implémentations concrètes doivent garantir que les
valeurs de cellules de données ne sont jamais transmises au LLM.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class LlmProvider(ABC):
    """Interface commune pour tous les fournisseurs LLM utilisés dans MoveToData."""

    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Envoie une liste de messages au LLM et retourne la réponse brute.

        Parameters
        ----------
        messages : list[dict]
            Liste de messages au format ``[{"role": str, "content": str}]``.
        tools : list[dict] | None
            Définitions d'outils (tool use) au format Ollama / OpenAI, optionnel.

        Returns
        -------
        dict
            Réponse brute du provider. Le champ ``content`` (str) contient le
            texte généré. D'autres clés dépendent du provider.
        """
        ...

    @abstractmethod
    async def health(self) -> bool:
        """Retourne True si le provider est joignable, False sinon."""
        ...
