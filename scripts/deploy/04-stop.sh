#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 04 : Arrêt de la plateforme
# Usage : bash 04-stop.sh [--stack core|snap|tycho|all] [--volumes]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# Parsing des arguments
STACK="all"
REMOVE_VOLUMES=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack)    STACK="$2"; shift 2 ;;
    --volumes)  REMOVE_VOLUMES=true; shift ;;
    *)          STACK="$1"; shift ;;
  esac
done

[[ ! -f "${ENV_FILE}" ]] && { warn "Fichier .env.movetodata absent — arrêt sans env"; }

COMPOSE_FLAGS=""
${REMOVE_VOLUMES} && {
  warn "L'option --volumes supprime TOUTES les données Docker (volumes). Confirmer ? [y/N]"
  read -r CONFIRM
  [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]] && info "Annulé." && exit 0
  COMPOSE_FLAGS="-v"
}

# Compatibilité Docker Compose v1 (docker-compose) et v2 (docker compose)
if docker compose version &>/dev/null 2>&1; then
  _compose() { docker compose "$@"; }
elif command -v docker-compose &>/dev/null; then
  _compose() { docker-compose "$@"; }
else
  error "Docker Compose introuvable."
fi

compose_down() {
  local file="$1"
  local name="$2"
  if [[ -f "${file}" ]]; then
    info "Arrêt stack ${name}..."
    if [[ -f "${ENV_FILE}" ]]; then
      _compose --project-name movetodata -f "${file}" --env-file "${ENV_FILE}" down ${COMPOSE_FLAGS} 2>/dev/null || true
    else
      _compose --project-name movetodata -f "${file}" down ${COMPOSE_FLAGS} 2>/dev/null || true
    fi
    success "Stack ${name} arrêtée"
  fi
}

case "${STACK}" in
  core)
    compose_down "${SCRIPT_DIR}/../compose/docker-compose.core.yml" "Core"
    ;;
  snap)
    compose_down "${SCRIPT_DIR}/../compose/docker-compose.snap.yml" "Snap"
    ;;
  tycho)
    compose_down "${SCRIPT_DIR}/../compose/docker-compose.tycho.yml" "Tycho"
    ;;
  all)
    # Arrêt dans l'ordre inverse du démarrage
    compose_down "${SCRIPT_DIR}/../compose/docker-compose.tycho.yml" "Tycho"
    compose_down "${SCRIPT_DIR}/../compose/docker-compose.snap.yml" "Snap"
    compose_down "${SCRIPT_DIR}/../compose/docker-compose.core.yml" "Core"
    ;;
  *)
    error "Stack inconnue : ${STACK}"
    ;;
esac

echo ""
success "Plateforme MoveToData arrêtée"
info "Containers actifs restants :"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep "movetodata" || echo "  (aucun)"
