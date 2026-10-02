#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 07 : Redémarrage d'un service
# Usage : bash 07-restart.sh [--service boson|frontend|snap|snap-ui|tycho|all]
#         bash 07-restart.sh --rebuild boson    # rebuild + restart
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SERVICE="boson"
REBUILD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service|-s) SERVICE="$2"; shift 2 ;;
    --rebuild|-r) REBUILD=true; shift ;;
    *)            SERVICE="$1"; shift ;;
  esac
done

[[ -f "${ENV_FILE}" ]] && { set -a; source "${ENV_FILE}"; set +a; }

COMPOSE_CORE="${SCRIPT_DIR}/../compose/docker-compose.core.yml"
COMPOSE_SNAP="${SCRIPT_DIR}/../compose/docker-compose.snap.yml"
COMPOSE_TYCHO="${SCRIPT_DIR}/../compose/docker-compose.tycho.yml"

# Compatibilité Docker Compose v1 (docker-compose) et v2 (docker compose)
if docker compose version &>/dev/null 2>&1; then
  _compose() { docker compose "$@"; }
elif command -v docker-compose &>/dev/null; then
  _compose() { docker-compose "$@"; }
else
  error "Docker Compose introuvable."
fi

restart_container() {
  local container="$1"
  info "Redémarrage de ${container}..."
  docker restart "${container}" 2>/dev/null || warn "${container} non trouvé"
  success "${container} redémarré"
}

rebuild_and_restart() {
  local service="$1"
  local compose_file="$2"
  info "Rebuild + restart du service ${service}..."
  ${REBUILD} && {
    info "Build en cours..."
    bash "${SCRIPT_DIR}/02-build.sh" --service "${service}"
  }
  _compose -f "${compose_file}" --env-file "${ENV_FILE}" up -d --no-deps --force-recreate "${service}"
  success "Service ${service} redémarré"
}

case "${SERVICE}" in
  boson)
    if ${REBUILD}; then
      rebuild_and_restart "boson" "${COMPOSE_CORE}"
    else
      restart_container "movetodata-boson"
    fi
    ;;
  frontend)
    if ${REBUILD}; then
      rebuild_and_restart "frontend" "${COMPOSE_CORE}"
    else
      restart_container "movetodata-frontend"
    fi
    ;;
  snap)
    if ${REBUILD}; then
      rebuild_and_restart "snap" "${COMPOSE_SNAP}"
    else
      restart_container "movetodata-snap"
    fi
    ;;
  snap-ui)
    if ${REBUILD}; then
      rebuild_and_restart "snap-ui" "${COMPOSE_SNAP}"
    else
      restart_container "movetodata-snap-ui"
    fi
    ;;
  tycho)
    if ${REBUILD}; then
      rebuild_and_restart "tycho" "${COMPOSE_TYCHO}"
    else
      restart_container "movetodata-tycho"
      restart_container "movetodata-tycho-worker"
      restart_container "movetodata-tycho-beat"
    fi
    ;;
  all)
    info "Redémarrage complet de la plateforme..."
    bash "${SCRIPT_DIR}/04-stop.sh" all
    bash "${SCRIPT_DIR}/03-start.sh" all
    ;;
  *)
    error "Service inconnu : ${SERVICE}"
    ;;
esac

echo ""
info "État post-redémarrage :"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep "^movetodata" || true
