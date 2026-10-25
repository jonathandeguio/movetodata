#!/bin/bash
# Re-indexe les documents de la base de connaissances dans le RAG docs (ChromaDB).
# À lancer après chaque ajout ou modification de fichiers dans movetodata-docs/docs/

set -e

AI_URL="${MOVETODATA_AI_URL:-http://localhost:8090}"

echo "=== Indexation RAG docs ==="
echo "Service AI : $AI_URL"
echo ""

# Status avant
echo ">> Statut avant indexation :"
curl -sf "$AI_URL/docs/rag/status" | python3 -m json.tool 2>/dev/null || echo "(pas de statut disponible)"
echo ""

# Lancer l'indexation
echo ">> Lancement de l'indexation..."
RESULT=$(curl -sf -X POST "$AI_URL/docs/rag/index")
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

# Status après
echo ">> Statut après indexation :"
curl -sf "$AI_URL/docs/rag/status" | python3 -m json.tool 2>/dev/null || echo "(pas de statut disponible)"
echo ""

echo "=== Indexation terminée ==="
