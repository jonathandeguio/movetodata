#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 06 : Consultation des logs
# Usage : bash 06-logs.sh [--service boson|frontend|snap|tycho|db|redis|all]
#                         [--tail N] [--follow]
# =============================================================================
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info() { echo -e "${BLUE}[LOGS]${NC} $*"; }

SERVICE="boson"
TAIL=100
FOLLOW=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service|-s) SERVICE="$2"; shift 2 ;;
    --tail|-n)    TAIL="$2"; shift 2 ;;
    --follow|-f)  FOLLOW=true; shift ;;
    *)            SERVICE="$1"; shift ;;
  esac
done

FOLLOW_FLAG=""
${FOLLOW} && FOLLOW_FLAG="-f"

logs() {
  local container="$1"
  local label="$2"
  info "=== Logs ${label} (${container}) ==="
  docker logs "${container}" --tail "${TAIL}" ${FOLLOW_FLAG} 2>/dev/null \
    || echo "  Container ${container} introuvable ou non démarré"
  echo ""
}

case "${SERVICE}" in
  boson)
    logs "movetodata-boson" "Boson API"
    # Logs Tomcat access logs
    ACCESS_LOG_DIR="${MOVETODATA_MOUNT_PATH:-/movetodata}/logs/boson/accessLogs"
    if [[ -d "${ACCESS_LOG_DIR}" ]]; then
      info "=== Access logs Tomcat ==="
      ls -lah "${ACCESS_LOG_DIR}/" 2>/dev/null | tail -5
      LAST_LOG=$(ls -t "${ACCESS_LOG_DIR}"/ 2>/dev/null | head -1)
      [[ -n "${LAST_LOG}" ]] && tail -${TAIL} "${ACCESS_LOG_DIR}/${LAST_LOG}"
    fi
    ;;
  frontend)
    logs "movetodata-frontend" "Frontend Nginx"
    ;;
  snap)
    logs "movetodata-snap" "Snap API"
    logs "movetodata-snap-ui" "Snap UI"
    logs "movetodata-snap-proxy" "Snap Proxy Nginx"
    ;;
  tycho)
    logs "movetodata-tycho" "Tycho App"
    logs "movetodata-tycho-worker" "Tycho Worker"
    logs "movetodata-tycho-beat" "Tycho Beat"
    ;;
  db)
    logs "movetodata-boson-db" "PostgreSQL Boson"
    logs "movetodata-snap-db" "PostgreSQL Snap"
    logs "movetodata-tycho-db" "PostgreSQL Tycho"
    ;;
  redis)
    logs "movetodata-redis" "Redis"
    ;;
  all)
    logs "movetodata-boson-db" "PostgreSQL Boson"
    logs "movetodata-redis" "Redis"
    logs "movetodata-boson" "Boson API"
    logs "movetodata-frontend" "Frontend"
    logs "movetodata-snap" "Snap API"
    logs "movetodata-tycho" "Tycho App"
    logs "movetodata-tycho-worker" "Tycho Worker"
    ;;
  *)
    # Essai direct avec le nom donné
    logs "movetodata-${SERVICE}" "${SERVICE}"
    ;;
esac
