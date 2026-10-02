#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 05 : Vérification de santé complète
# Usage : bash 05-healthcheck.sh
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
fail() { echo -e "  ${RED}✗${NC} $*"; ERRORS=$((ERRORS+1)); }
warn() { echo -e "  ${YELLOW}!${NC} $*"; }
info() { echo -e "${BLUE}[CHECK]${NC} $*"; }

ERRORS=0

[[ -f "${ENV_FILE}" ]] && { set -a; source "${ENV_FILE}"; set +a; }

BASE_URL="${BASE_URL:-http://localhost:8080}"
BOSON_HOST="localhost"
BOSON_PORT="8080"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   MoveToData Platform — Healthcheck$(date '+  %Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# -----------------------------------------------------------------------------
info "=== Containers Docker ==="
# -----------------------------------------------------------------------------
CONTAINERS=(
  "movetodata-boson-db"
  "movetodata-redis"
  "movetodata-boson"
  "movetodata-frontend"
)
SNAP_CONTAINERS=("movetodata-snap-db" "movetodata-snap" "movetodata-snap-ui" "movetodata-snap-proxy")
TYCHO_CONTAINERS=("movetodata-tycho-db" "movetodata-tycho" "movetodata-tycho-worker" "movetodata-tycho-beat")

check_container() {
  local name="$1"
  local status
  status=$(docker inspect --format='{{.State.Status}}' "${name}" 2>/dev/null || echo "absent")
  local health
  health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-health{{end}}' "${name}" 2>/dev/null || echo "absent")

  if [[ "${status}" == "running" ]]; then
    if [[ "${health}" == "healthy" || "${health}" == "no-health" ]]; then
      ok "${name} : running ${health:+(${health})}"
    elif [[ "${health}" == "starting" ]]; then
      warn "${name} : running (health: starting...)"
    else
      fail "${name} : running mais unhealthy (${health})"
    fi
  elif [[ "${status}" == "absent" ]]; then
    warn "${name} : absent (stack non démarrée ?)"
  else
    fail "${name} : ${status}"
  fi
}

for c in "${CONTAINERS[@]}";        do check_container "$c"; done
for c in "${SNAP_CONTAINERS[@]}";   do check_container "$c"; done
for c in "${TYCHO_CONTAINERS[@]}";  do check_container "$c"; done

echo ""

# -----------------------------------------------------------------------------
info "=== API Boson ==="
# -----------------------------------------------------------------------------
HEALTH_URL="http://${BOSON_HOST}:${BOSON_PORT}/endpoints/health"
HEALTH_RESPONSE=$(curl -sf --max-time 5 "${HEALTH_URL}" 2>/dev/null || echo "UNREACHABLE")
if echo "${HEALTH_RESPONSE}" | grep -q "UP"; then
  ok "GET ${HEALTH_URL} → UP"
else
  fail "GET ${HEALTH_URL} → ${HEALTH_RESPONSE}"
fi

INFO_URL="http://${BOSON_HOST}:${BOSON_PORT}/endpoints/info"
INFO_RESPONSE=$(curl -sf --max-time 5 "${INFO_URL}" 2>/dev/null | python3 -m json.tool 2>/dev/null | head -5 || echo "UNREACHABLE")
if [[ "${INFO_RESPONSE}" != "UNREACHABLE" ]]; then
  ok "GET ${INFO_URL} → OK"
else
  warn "GET ${INFO_URL} → inaccessible"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Frontend ==="
# -----------------------------------------------------------------------------
FRONTEND_STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 5 http://localhost:80 2>/dev/null || echo "000")
if [[ "${FRONTEND_STATUS}" == "200" ]]; then
  ok "http://localhost:80 → HTTP ${FRONTEND_STATUS}"
else
  fail "http://localhost:80 → HTTP ${FRONTEND_STATUS}"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Base de données PostgreSQL Boson ==="
# -----------------------------------------------------------------------------
if docker exec movetodata-boson-db pg_isready -U "${BOSON_DB_USERNAME:-movetodata}" -d "${BOSON_DB_NAME:-boson}" &>/dev/null; then
  ok "PostgreSQL Boson (movetodata-boson-db) : ready"
  TABLE_COUNT=$(docker exec movetodata-boson-db psql -U "${BOSON_DB_USERNAME:-movetodata}" -d "${BOSON_DB_NAME:-boson}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "N/A")
  [[ "${TABLE_COUNT}" != "N/A" ]] && ok "Tables Flyway : ${TABLE_COUNT} tables dans boson"
else
  fail "PostgreSQL Boson : non disponible"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Redis ==="
# -----------------------------------------------------------------------------
REDIS_PING=$(docker exec movetodata-redis redis-cli ping 2>/dev/null || echo "FAIL")
if [[ "${REDIS_PING}" == "PONG" ]]; then
  ok "Redis (movetodata-redis) : PONG"
else
  fail "Redis : ${REDIS_PING}"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Snap (si démarré) ==="
# -----------------------------------------------------------------------------
SNAP_STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 5 http://localhost:8082 2>/dev/null || echo "000")
if [[ "${SNAP_STATUS}" =~ ^(200|301|302)$ ]]; then
  ok "http://localhost:8082 → HTTP ${SNAP_STATUS}"
else
  warn "http://localhost:8082 → HTTP ${SNAP_STATUS} (Snap non démarré ou non accessible)"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Tycho / Superset (si démarré) ==="
# -----------------------------------------------------------------------------
TYCHO_STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 10 http://localhost:8088/health 2>/dev/null || echo "000")
if [[ "${TYCHO_STATUS}" == "200" ]]; then
  ok "http://localhost:8088/health → HTTP ${TYCHO_STATUS}"
else
  warn "http://localhost:8088/health → HTTP ${TYCHO_STATUS} (Tycho non démarré ou démarrage en cours)"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Résumé CORS ==="
# -----------------------------------------------------------------------------
CORS_RESP=$(curl -sI --max-time 5 \
  -H "Origin: ${BASE_URL:-http://localhost:3000}" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "http://${BOSON_HOST}:${BOSON_PORT}/endpoints/health" 2>/dev/null | grep -i "access-control" || echo "non vérifié")
if echo "${CORS_RESP}" | grep -qi "access-control-allow"; then
  ok "CORS actif pour : ${BASE_URL:-http://localhost:3000}"
else
  warn "CORS : ${CORS_RESP}"
fi

echo ""

# -----------------------------------------------------------------------------
info "=== Utilisation ressources ==="
# -----------------------------------------------------------------------------
docker stats --no-stream --format \
  "  {{.Name}}\tCPU: {{.CPUPerc}}\tMEM: {{.MemUsage}}" \
  $(docker ps --format "{{.Names}}" | grep "^movetodata") 2>/dev/null || true

echo ""

# -----------------------------------------------------------------------------
echo -e "${BLUE}================================================${NC}"
if [[ ${ERRORS} -eq 0 ]]; then
  echo -e "${GREEN} ✓ Tous les checks sont OK${NC}"
else
  echo -e "${RED} ✗ ${ERRORS} check(s) en ERREUR — vérifiez les logs${NC}"
  echo ""
  echo "  Logs Boson   : docker logs movetodata-boson --tail 50"
  echo "  Logs DB      : docker logs movetodata-boson-db --tail 20"
  echo "  Logs Frontend: docker logs movetodata-frontend --tail 20"
fi
echo -e "${BLUE}================================================${NC}"
echo ""
exit ${ERRORS}
