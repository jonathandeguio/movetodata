"""
provider_factory.py — Sélection du provider LLM via variable d'environnement.

Variable : LLM_PROVIDER (défaut : "ollama")
Valeurs supportées : "ollama" | "mistral"
"""
from __future__ import annotations

import os

from .llm_provider import LlmProvider


def get_llm_provider() -> LlmProvider:
    """
    Retourne le provider LLM configuré.

    La sélection est pilotée par la variable d'environnement LLM_PROVIDER
    (défaut : "ollama").

    Example
    -------
    >>> provider = get_llm_provider()
    >>> response = await provider.chat([{"role": "user", "content": "Bonjour"}])
    """
    provider_name = os.getenv("LLM_PROVIDER", "ollama").strip().lower()

    if provider_name == "mistral":
        from .mistral_provider import MistralProvider
        return MistralProvider()

    # Défaut : Ollama
    from .ollama_provider import OllamaProvider
    return OllamaProvider()
