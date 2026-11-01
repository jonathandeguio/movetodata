"""
studio_ai_service.py — Service LLM pour le Studio de Webapps IA.

Pipeline :
  1. Charge le prompt système depuis un fichier configurable.
  2. Construit le contexte (schéma datasource, arbre de nœuds, requêtes, nœud sélectionné, historique).
  3. Appelle Ollama /api/chat avec tool use (outil apply_patch).
  4. Valide la sortie JSON (patch bien formé, SQL conforme §6).
  5. Sur erreur : 1 retry avec l'erreur renvoyée au modèle.
  6. Retourne {explanation, patch}.

Sécurité :
  - Aucune donnée utilisateur (params, valeurs de cellules) n'est envoyée au LLM.
  - Seul le schéma (noms de tables/colonnes/types) est passé en contexte.
  - Aucun log de données sensibles.
"""
from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
STUDIO_AI_MODEL: str = os.getenv("STUDIO_AI_MODEL", "qwen2.5:14b")
TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "120"))
STUDIO_SYSTEM_PROMPT_PATH: str = os.getenv(
    "STUDIO_SYSTEM_PROMPT_PATH",
    str(Path(__file__).parent.parent.parent / "prompts" / "studio_system.md"),
)

# ---------------------------------------------------------------------------
# JSON Schema de l'outil apply_patch (dérivé du modèle TypeScript PatchOp)
# ---------------------------------------------------------------------------

_PATCH_OP_SCHEMA: dict[str, Any] = {
    "type": "object",
    "description": "Une opération atomique de modification de la définition d'application.",
    "properties": {
        "op": {
            "type": "string",
            "enum": ["addNode", "updateNode", "removeNode", "moveNode", "upsertQuery", "removeQuery"],
        },
        "parentId": {"type": "string"},
        "index": {"type": "integer"},
        "node": {
            "type": "object",
            "description": "Nœud AppNode complet (pour addNode)",
        },
        "nodeId": {"type": "string"},
        "props": {"type": "object"},
        "bind": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
        },
        "events": {"type": "object"},
        "query": {
            "type": "object",
            "description": "QueryDef complet (pour upsertQuery)",
            "properties": {
                "id": {"type": "string"},
                "kind": {"type": "string", "enum": ["read", "write"]},
                "sql": {"type": "string"},
                "params": {"type": "array", "items": {"type": "string"}},
                "onSuccess": {"type": "array"},
            },
            "required": ["id", "kind", "sql", "params"],
        },
        "queryId": {"type": "string"},
    },
    "required": ["op"],
}

_APPLY_PATCH_TOOL: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "apply_patch",
        "description": (
            "Applique un ensemble de modifications (patch) à la définition de l'application Studio. "
            "Utiliser cet outil pour TOUTE modification de l'arbre de composants ou des requêtes."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "explanation": {
                    "type": "string",
                    "description": "Explication en langage naturel de ce qui a été fait ou proposé.",
                },
                "patch": {
                    "type": "array",
                    "description": "Tableau de PatchOp à appliquer dans l'ordre.",
                    "items": _PATCH_OP_SCHEMA,
                },
            },
            "required": ["explanation", "patch"],
        },
    },
}

# ---------------------------------------------------------------------------
# SQL validator léger (règles §6 simplifiées)
# ---------------------------------------------------------------------------

_FORBIDDEN_STARTS = {"DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "EXECUTE", "EXEC"}


def _validate_sql_light(sql: str, kind: str) -> str | None:
    """Retourne un message d'erreur si le SQL viole les règles §6, None sinon."""
    if not sql or not sql.strip():
        return "SQL vide ou absent."

    stripped = sql.strip()

    # Détection multi-instructions
    # On sépare par ; et on retire les parties vides
    stmts = [s.strip() for s in stripped.rstrip(";").split(";") if s.strip()]
    if len(stmts) > 1:
        return f"Multi-instructions interdites ({len(stmts)} instructions détectées)."

    first_word = stripped.split()[0].upper() if stripped.split() else ""

    if first_word in _FORBIDDEN_STARTS:
        return f"Instruction SQL interdite : {first_word}."

    if kind == "read":
        if first_word not in ("SELECT", "WITH"):
            return f"Une requête 'read' doit être un SELECT. Instruction détectée : {first_word}."
    elif kind == "write":
        if first_word not in ("INSERT", "UPDATE"):
            return f"Une requête 'write' doit être un INSERT ou un UPDATE. Instruction détectée : {first_word}."
        if first_word == "UPDATE":
            # Vérification simplifiée WHERE
            if not re.search(r"\bWHERE\b", stripped, re.IGNORECASE):
                return "UPDATE sans clause WHERE est interdit."
    else:
        return f"Kind inconnu : {kind}. Valeurs acceptées : read, write."

    return None


def _validate_patch_sql(patch: list[dict[str, Any]]) -> str | None:
    """Valide le SQL de toutes les opérations upsertQuery dans le patch."""
    for op in patch:
        if op.get("op") == "upsertQuery":
            query = op.get("query") or {}
            sql = query.get("sql", "")
            kind = query.get("kind", "")
            err = _validate_sql_light(sql, kind)
            if err:
                return f"Requête '{query.get('id', '?')}' invalide : {err}"
    return None


# ---------------------------------------------------------------------------
# Chargement du prompt système
# ---------------------------------------------------------------------------

def _load_system_prompt() -> str:
    path = Path(STUDIO_SYSTEM_PROMPT_PATH)
    if path.exists():
        return path.read_text(encoding="utf-8")
    logger.warning("Prompt système Studio introuvable : %s", path)
    return "Tu es l'assistant IA du Studio de Webapps MoveToData."


# ---------------------------------------------------------------------------
# Construction du contexte
# ---------------------------------------------------------------------------

def _build_context_messages(
    app_definition: dict[str, Any] | None,
    schema_info: dict[str, Any] | None,
    selected_node_id: str | None,
    history: list[dict[str, str]] | None,
) -> list[dict[str, str]]:
    """
    Construit le tableau de messages (role/content) pour l'appel LLM.
    Ne transmet JAMAIS de données utilisateur (valeurs de cellules).
    """
    messages: list[dict[str, str]] = []

    # Message contextuel (non historisé dans la conversation visible)
    context_parts: list[str] = []

    if schema_info:
        context_parts.append(
            f"## Schéma de la datasource\n```json\n{json.dumps(schema_info, ensure_ascii=False, indent=2)}\n```"
        )

    if app_definition:
        # Masquer les valeurs de state (potentiellement sensibles)
        safe_def = {k: v for k, v in app_definition.items() if k != "state"}
        safe_def["state"] = {}
        context_parts.append(
            f"## Définition actuelle de l'application\n```json\n{json.dumps(safe_def, ensure_ascii=False, indent=2)}\n```"
        )

    if selected_node_id:
        context_parts.append(f"## Nœud sélectionné : `{selected_node_id}`")

    if context_parts:
        messages.append({
            "role": "user",
            "content": "Contexte de session :\n\n" + "\n\n".join(context_parts),
        })
        messages.append({
            "role": "assistant",
            "content": "Contexte reçu. Je suis prêt à vous aider.",
        })

    # Historique des messages (10 derniers max, déjà tronqué par l'appelant)
    for msg in (history or []):
        role = msg.get("role", "user")
        text = msg.get("text", "")
        if text:
            messages.append({"role": role, "content": text})

    return messages


# ---------------------------------------------------------------------------
# Appel Ollama avec tool use
# ---------------------------------------------------------------------------

async def _call_ollama_with_tools(
    system_prompt: str,
    messages: list[dict[str, str]],
    user_prompt: str,
) -> dict[str, Any] | None:
    """
    Appelle Ollama /api/chat avec l'outil apply_patch.
    Retourne le dict de l'appel d'outil, ou None si Ollama est indisponible.
    """
    all_messages = [*messages, {"role": "user", "content": user_prompt}]

    payload = {
        "model": STUDIO_AI_MODEL,
        "messages": all_messages,
        "tools": [_APPLY_PATCH_TOOL],
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 4096},
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        msg = data.get("message", {})
        tool_calls = msg.get("tool_calls") or []

        for call in tool_calls:
            fn = call.get("function", {})
            if fn.get("name") == "apply_patch":
                args = fn.get("arguments", {})
                if isinstance(args, str):
                    args = json.loads(args)
                return args

        # Modèle n'a pas appelé l'outil — on essaie d'extraire du JSON du contenu texte
        content = msg.get("content", "")
        if content:
            extracted = _extract_json_from_text(content)
            if extracted:
                return extracted

        logger.warning("Studio AI: le modèle n'a pas appelé l'outil apply_patch.")
        return None

    except httpx.ConnectError:
        logger.error("Studio AI: impossible de joindre Ollama à %s.", OLLAMA_URL)
        return None
    except httpx.TimeoutException:
        logger.error("Studio AI: timeout Ollama après %s s.", TIMEOUT)
        return None
    except Exception as exc:
        logger.error("Studio AI: erreur inattendue lors de l'appel Ollama : %s", exc)
        return None


def _extract_json_from_text(text: str) -> dict[str, Any] | None:
    """Tente d'extraire un objet JSON depuis du texte libre (fallback)."""
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return None


# ---------------------------------------------------------------------------
# Validation du résultat
# ---------------------------------------------------------------------------

def _validate_result(result: dict[str, Any]) -> str | None:
    """Retourne un message d'erreur si le résultat est mal formé, None sinon."""
    if not isinstance(result, dict):
        return "La sortie du LLM n'est pas un objet JSON."
    if "explanation" not in result:
        return "Champ 'explanation' manquant."
    if "patch" not in result:
        return "Champ 'patch' manquant."
    if not isinstance(result["patch"], list):
        return "Le champ 'patch' doit être un tableau."

    for i, op in enumerate(result["patch"]):
        if not isinstance(op, dict):
            return f"L'opération #{i} n'est pas un objet."
        if "op" not in op:
            return f"L'opération #{i} n'a pas de champ 'op'."
        valid_ops = {"addNode", "updateNode", "removeNode", "moveNode", "upsertQuery", "removeQuery"}
        if op["op"] not in valid_ops:
            return f"Opération inconnue : '{op['op']}'."

    sql_err = _validate_patch_sql(result["patch"])
    if sql_err:
        return sql_err

    return None


# ---------------------------------------------------------------------------
# Point d'entrée principal : chat IA
# ---------------------------------------------------------------------------

async def run_ai_chat(
    prompt: str,
    app_definition: dict[str, Any] | None = None,
    schema_info: dict[str, Any] | None = None,
    selected_node_id: str | None = None,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """
    Pipeline complet :
    1. Appel LLM avec tool use.
    2. Validation de la sortie.
    3. Sur erreur : 1 retry avec l'erreur renvoyée au modèle.
    4. Retourne {explanation, patch}.

    Lève RuntimeError si Ollama est indisponible ou si les deux tentatives échouent.
    """
    system_prompt = _load_system_prompt()
    context_messages = _build_context_messages(
        app_definition, schema_info, selected_node_id, history
    )

    # --- Tentative 1 ---
    result = await _call_ollama_with_tools(system_prompt, context_messages, prompt)
    if result is None:
        raise RuntimeError("LLM_UNAVAILABLE")

    validation_error = _validate_result(result)
    if validation_error is None:
        return result

    logger.warning("Studio AI: validation échouée (tentative 1) : %s", validation_error)

    # --- Retry avec l'erreur ---
    retry_prompt = (
        f"{prompt}\n\n"
        f"[ERREUR DE VALIDATION — corriger et réessayer] : {validation_error}"
    )
    result = await _call_ollama_with_tools(system_prompt, context_messages, retry_prompt)
    if result is None:
        raise RuntimeError("LLM_UNAVAILABLE")

    validation_error = _validate_result(result)
    if validation_error is not None:
        logger.error("Studio AI: validation échouée après retry : %s", validation_error)
        raise ValueError(f"Réponse invalide après retry : {validation_error}")

    return result


# ---------------------------------------------------------------------------
# Point d'entrée : génération complète d'application
# ---------------------------------------------------------------------------

_GENERATE_TOOL: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "create_app_definition",
        "description": "Crée une définition complète d'application Studio (AppDefinition) avec 3 à 5 composants liés à de vraies requêtes SQL.",
        "parameters": {
            "type": "object",
            "properties": {
                "explanation": {
                    "type": "string",
                    "description": "Résumé de l'application générée (dans la langue de l'utilisateur).",
                },
                "definition": {
                    "type": "object",
                    "description": "AppDefinition complète au format JSON.",
                },
            },
            "required": ["explanation", "definition"],
        },
    },
}


async def generate_app_definition(
    name: str,
    description: str,
    datasource_id: str,
    table_name: str,
    columns: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """
    Génère une AppDefinition complète pour une nouvelle application.
    Retourne {explanation, definition}.
    Lève RuntimeError si Ollama est indisponible.
    """
    system_prompt = _load_system_prompt()

    cols_info = ""
    if columns:
        cols_info = "\n".join(f"  - {c.get('name', '?')} ({c.get('type', 'text')})" for c in columns)
    else:
        cols_info = "  (colonnes non précisées — utilise des colonnes génériques cohérentes)"

    generate_prompt = f"""Génère une application Studio complète pour :

- Nom : {name}
- Description : {description}
- Datasource ID : {datasource_id}
- Table principale : {table_name}
- Colonnes disponibles :
{cols_info}

L'application doit contenir 3 à 5 composants variés (table, form, kpis ou chart) liés à des requêtes SQL réelles sur la table `{table_name}`.

Utilise l'outil `create_app_definition` pour retourner la définition complète au format AppDefinition.

La définition doit respecter ce schéma JSON :
{{
  "schemaVersion": 1,
  "id": "<uuid de l'app — LAISSER VIDE : sera remplacé côté serveur>",
  "name": "{name}",
  "datasourceId": "{datasource_id}",
  "queries": {{ ... }},
  "state": {{}},
  "pages": [{{
    "id": "p_main",
    "name": "Accueil",
    "root": {{
      "id": "n_stack_root",
      "type": "stack",
      "props": {{"gap": 16}},
      "children": [ ... ]
    }}
  }}]
}}
"""

    payload = {
        "model": STUDIO_AI_MODEL,
        "messages": [{"role": "user", "content": generate_prompt}],
        "tools": [_GENERATE_TOOL],
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 8192},
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        msg = data.get("message", {})
        tool_calls = msg.get("tool_calls") or []

        for call in tool_calls:
            fn = call.get("function", {})
            if fn.get("name") == "create_app_definition":
                args = fn.get("arguments", {})
                if isinstance(args, str):
                    args = json.loads(args)
                return args

        # Fallback : extraction JSON du texte
        content = msg.get("content", "")
        if content:
            extracted = _extract_json_from_text(content)
            if extracted and "definition" in extracted:
                return extracted

        raise ValueError("Le LLM n'a pas retourné de définition d'application.")

    except httpx.ConnectError:
        raise RuntimeError("LLM_UNAVAILABLE")
    except httpx.TimeoutException:
        raise RuntimeError("LLM_UNAVAILABLE")
