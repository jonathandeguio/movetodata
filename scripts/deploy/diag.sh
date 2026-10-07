#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script diag : Diagnostic rapide production
#
# Usage :
#   bash diag.sh              # rapport rapide (~15s)
#   bash diag.sh --full       # inclut tail logs (30s supplémentaires)
#   bash diag.sh --ws-check   # test handshake WebSocket réel
#   bash diag.sh --full --ws-check
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

ok()      { echo -e "  ${GREEN}[OK]${NC}    $*"; }
fail()    { echo -e "  ${RED}[FAIL]${NC}  $*"; }
warn()    { echo -e "  ${YELLOW}[WARN]${NC}  $*"; }
info()    { echo -e "  ${BLUE}[INFO]${NC}  $*"; }
section() { echo -e "\n${CYAN}══════════════════════════════════════════${NC}"; \
            echo -e "${CYAN}  $*${NC}"; \
            echo -e "${CYAN}══════════════════════════════════════════${NC}"; }

OPT_FULL=0; OPT_WS=0
for arg in "$@"; do
  [[ "$arg" == "--full"     ]] && OPT_FULL=1
  [[ "$arg" == "--ws-check" ]] && OPT_WS=1
done

if [[ -f "${ENV_FILE}" ]]; then
  set -a; source "${ENV_FILE}" 2>/dev/null; set +a
else
  warn ".env.movetodata introuvable — certains tests seront partiels"
fi

MOUNT_PATH="${MOVETODATA_MOUNT_PATH:-/opt/movetodata/data}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   MoveToData — Diagnostic Platform         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Date      : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
info "Mount path: ${MOUNT_PATH}"

# =============================================================================
# 1. ÉTAT DES CONTAINERS
# =============================================================================
section "1. Containers"

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | grep -E "movetodata|NAME" || true

echo ""
for cname in movetodata-boson movetodata-frontend movetodata-boson-db movetodata-redis; do
  raw=$(docker inspect --format='{{.State.Status}} health={{.State.Health.Status}}' \
        "${cname}" 2>/dev/null || echo "absent")
  if echo "${raw}" | grep -q "running"; then
    ok "${cname}: ${raw}"
  else
    fail "${cname}: ${raw}"
  fi
done

# =============================================================================
# 2. PORTS
# =============================================================================
section "2. Ports sur l'hôte"

info "Ports en écoute :"
ss -tlnp 2>/dev/null | grep -E ":(80|443|8080|8081|8082|8088)\s" \
  | awk '{print "    " $1 " " $4 " " $7}' || \
  netstat -tlnp 2>/dev/null | grep -E ":(80|443|8080|8081|8082|8088) " || \
  warn "ss/netstat indisponibles"

echo ""
for port in 5432 6379 8080; do
  if ss -tlnp 2>/dev/null | grep ":${port}" | grep -q "0\.0\.0\.0\|\*:"; then
    fail "Port ${port} exposé sur 0.0.0.0 — devrait être loopback uniquement"
  else
    ok "Port ${port} restreint à loopback"
  fi
done

# =============================================================================
# 3. NGINX SYSTÈME
# =============================================================================
section "3. Nginx système (HTTPS :443)"

if systemctl is-active --quiet nginx 2>/dev/null; then
  ok "nginx système : actif"
  nginx -t 2>&1 | grep -v "^$" | sed 's/^/    /'
else
  fail "nginx système : INACTIF ou absent"
fi

echo ""
info "Site movetodata :"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null | grep -i movetodata \
  || warn "/etc/nginx/sites-enabled/movetodata absent"

echo ""
info "Test connexion HTTP locale :"
CODE=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "http://localhost:8081/" 2>/dev/null || echo "000")
[[ "${CODE}" =~ ^[23] ]] && ok "http://localhost:8081/ → HTTP ${CODE}" \
                          || fail "http://localhost:8081/ → HTTP ${CODE}"

# =============================================================================
# 4. NGINX FRONTEND (container)
# =============================================================================
section "4. Nginx frontend (container)"

if docker ps -q -f "name=^movetodata-frontend$" | grep -q .; then
  docker exec movetodata-frontend nginx -t 2>&1 | sed 's/^/    /' \
    || fail "nginx -t a échoué dans le container"
  echo ""
  info "nginx.conf monté depuis l'hôte :"
  ls -la "${MOUNT_PATH}/frontend/nginx.conf" 2>/dev/null | sed 's/^/    /' \
    || warn "${MOUNT_PATH}/frontend/nginx.conf absent"
else
  fail "Container movetodata-frontend non démarré"
fi

# =============================================================================
# 5. VERSION IMAGE FRONTEND
# =============================================================================
section "5. Version image frontend"

info "Métadonnées Docker image :"
docker inspect --format='  Tag     : {{index .RepoTags 0}}
  Créée   : {{.Created}}
  Version : {{index .Config.Labels "org.movetodata.version"}}
  Build   : {{index .Config.Labels "org.movetodata.buildDate"}}
  API URL : {{index .Config.Labels "org.movetodata.reactAppBaseUrlApi"}}' \
  movetodata/frontend:latest 2>/dev/null \
  || warn "Image movetodata/frontend:latest introuvable"

echo ""
info "build-info.json dans le container :"
docker exec movetodata-frontend cat /usr/local/build-info.json 2>/dev/null \
  | python3 -m json.tool 2>/dev/null \
  | sed 's/^/    /' \
  || warn "  /usr/local/build-info.json absent (rebuild nécessaire pour injecter)"

echo ""
info "REACT_APP_BASE_URL_API baked dans le bundle JS :"
docker exec movetodata-frontend sh -c \
  'grep -o "baseURL=\"[^\"]*\"" /app/static/js/main.*.js 2>/dev/null | head -3 || \
   grep -o "\.baseURL=[^,;]*" /app/static/js/main.*.js 2>/dev/null | head -3' \
  | sed 's/^/    /' \
  || warn "  Impossible de lire les bundles JS (volume /app potentiellement vide)"

# =============================================================================
# 6. SOCKJS / WEBSOCKET
# =============================================================================
section "6. SockJS info endpoint"

SOCKJS_URL="http://localhost:8081/api/ws/info"
info "Test : GET ${SOCKJS_URL}"
HTTP_CODE=$(curl -s --max-time 5 -o /tmp/mtd_sockjs_info.json \
  -w "%{http_code}" "${SOCKJS_URL}" 2>/dev/null || echo "000")

if [[ "${HTTP_CODE}" == "200" ]]; then
  ok "SockJS /info : HTTP 200"
  echo "    $(cat /tmp/mtd_sockjs_info.json 2>/dev/null | head -c 200)"
else
  fail "SockJS /info via nginx : HTTP ${HTTP_CODE}"
fi

echo ""
info "Test direct boson (bypass nginx) : GET http://localhost:8080/api/ws/info"
HTTP_DIRECT=$(curl -s --max-time 5 -o /dev/null \
  -w "%{http_code}" "http://localhost:8080/api/ws/info" 2>/dev/null || echo "000")

if [[ "${HTTP_DIRECT}" == "200" ]]; then
  ok "SockJS /info direct boson : HTTP 200"
else
  fail "SockJS /info direct boson : HTTP ${HTTP_DIRECT}"
fi

if [[ "${HTTP_DIRECT}" == "200" && "${HTTP_CODE}" != "200" ]]; then
  warn "DIAGNOSTIC : Boson répond mais nginx retourne ${HTTP_CODE}"
  warn "  → Problème de proxy nginx (Upgrade/Connection headers, location order)"
fi
if [[ "${HTTP_DIRECT}" != "200" && "${HTTP_CODE}" != "200" ]]; then
  warn "DIAGNOSTIC : Boson ne répond pas — vérifiez : docker logs movetodata-boson --tail 50"
fi

# =============================================================================
# 7. SANTÉ BOSON + TEST RATE LIMIT
# =============================================================================
section "7. Santé API Boson"

info "GET http://localhost:8080/endpoints/health"
HEALTH=$(curl -s --max-time 5 -w "\nHTTP_%{http_code}" \
  "http://localhost:8080/endpoints/health" 2>/dev/null || echo "HTTP_000")
HTTP_H=$(echo "${HEALTH}" | grep "HTTP_" | cut -d_ -f2)
BODY_H=$(echo "${HEALTH}" | grep -v "HTTP_")
[[ "${HTTP_H}" =~ ^[23] ]] && ok "Boson health : HTTP ${HTTP_H}" \
                             || fail "Boson health : HTTP ${HTTP_H}"
[[ -n "${BODY_H}" ]] && echo "    ${BODY_H}" | head -c 300

echo ""
info "Test rate limit (3 requêtes rapides sur /api/) :"
for i in 1 2 3; do
  RC=$(curl -s --max-time 3 -o /dev/null -w "%{http_code}" \
    "http://localhost:8081/api/health" 2>/dev/null || echo "000")
  echo "    Requête ${i} : HTTP ${RC}"
  [[ "${RC}" == "429" ]] && warn "  429 détecté dès la requête ${i} — rate limit potentiellement trop agressif"
done

# =============================================================================
# 8. REDIS
# =============================================================================
section "8. Redis"

if docker ps -q -f "name=^movetodata-redis$" | grep -q .; then
  PING=$(docker exec movetodata-redis redis-cli ping 2>/dev/null || echo "FAIL")
  [[ "${PING}" == "PONG" ]] && ok "Redis : PONG" || fail "Redis ne répond pas"

  echo ""
  info "Keyspace :"
  docker exec movetodata-redis redis-cli info keyspace 2>/dev/null | sed 's/^/    /'

  echo ""
  info "Mémoire :"
  docker exec movetodata-redis redis-cli info memory 2>/dev/null \
    | grep -E "used_memory_human|maxmemory" | sed 's/^/    /'

  echo ""
  info "Top 15 keys :"
  docker exec movetodata-redis redis-cli --scan 2>/dev/null | head -15 | sed 's/^/    /' || true
else
  fail "Container movetodata-redis non démarré"
fi

# =============================================================================
# 9. LOGS (optionnel avec --full)
# =============================================================================
section "9. Logs récents"

if [[ "${OPT_FULL}" -eq 1 ]]; then
  info "--- Boson (50 dernières lignes) ---"
  docker logs movetodata-boson --tail 50 2>&1 | grep -v "^$" | sed 's/^/  /' || true
  echo ""
  info "--- Frontend nginx access (20 dernières lignes) ---"
  docker exec movetodata-frontend tail -n 20 /var/log/nginx/access.log 2>/dev/null \
    | sed 's/^/  /' || warn "access.log vide"
  echo ""
  info "--- Frontend nginx error (20 dernières lignes) ---"
  docker exec movetodata-frontend tail -n 20 /var/log/nginx/error.log 2>/dev/null \
    | sed 's/^/  /' || warn "error.log vide"
else
  info "Boson (10 dernières lignes — utilisez --full pour plus) :"
  docker logs movetodata-boson --tail 10 2>&1 | grep -v "^$" | sed 's/^/  /' || true
  echo ""
  info "Frontend nginx error (5 dernières lignes) :"
  docker exec movetodata-frontend tail -n 5 /var/log/nginx/error.log 2>/dev/null \
    | sed 's/^/  /' || warn "error.log vide"
fi

# =============================================================================
# 10. TEST HANDSHAKE WEBSOCKET (optionnel avec --ws-check)
# =============================================================================
check_websocket() {
  section "10. Test WebSocket handshake"

  info "[1/3] SockJS GET /api/ws/info"
  WS_CODE=$(curl -s --max-time 5 -o /tmp/mtd_ws_info.json \
    -w "%{http_code}" "http://localhost:8081/api/ws/info" 2>/dev/null || echo "000")
  if [[ "${WS_CODE}" == "200" ]]; then
    ok "SockJS /info : OK"
    WS_ENABLED=$(grep -o '"websocket":true' /tmp/mtd_ws_info.json 2>/dev/null || echo "non trouvé")
    echo "    websocket: ${WS_ENABLED}"
  else
    fail "SockJS /info : HTTP ${WS_CODE} — handshake impossible"
    return 1
  fi

  echo ""
  info "[2/3] Handshake WebSocket (curl --upgrade)"
  local SERVER_ID="000"
  local SESSION_ID="diag_$(date +%s)"
  local WS_ENDPOINT="http://localhost:8081/api/ws/${SERVER_ID}/${SESSION_ID}/websocket"
  local WS_KEY
  WS_KEY=$(printf "diag$(date +%s)" | base64 | head -c 24)

  WS_RESP=$(curl -s --max-time 5 --include --no-buffer --http1.1 \
    -H "Upgrade: websocket" \
    -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: ${WS_KEY}==" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Origin: http://localhost:8081" \
    "${WS_ENDPOINT}" 2>&1 | head -10)

  if echo "${WS_RESP}" | grep -qi "101 Switching"; then
    ok "Handshake WebSocket : HTTP 101 Switching Protocols"
  elif echo "${WS_RESP}" | grep -qi "HTTP/1.1 [45]"; then
    HTTP_WS=$(echo "${WS_RESP}" | grep "HTTP/1.1" | head -1)
    fail "Handshake refusé : ${HTTP_WS}"
  else
    warn "Réponse ambiguë — curl a peut-être fermé après l'upgrade (normal) :"
    echo "${WS_RESP}" | head -5 | sed 's/^/    /'
  fi

  echo ""
  info "[3/3] wscat (si disponible)"
  if command -v wscat &>/dev/null; then
    ok "wscat disponible — test ws://localhost:8081/api/ws/websocket"
    timeout 5 wscat --connect "ws://localhost:8081/api/ws/websocket" --no-color 2>&1 \
      | head -10 | sed 's/^/    /' || true
  else
    warn "wscat non installé (npm install -g wscat pour un test STOMP complet)"
  fi
}

if [[ "${OPT_WS}" -eq 1 ]]; then
  check_websocket
else
  section "10. Test WebSocket"
  info "Désactivé — relancer avec : bash ${SCRIPT_DIR}/diag.sh --ws-check"
fi

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Diagnostic terminé                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "  Commandes utiles :"
echo "    Logs boson temps réel  : docker logs movetodata-boson -f --tail 50"
echo "    Logs nginx access      : docker exec movetodata-frontend tail -f /var/log/nginx/access.log"
echo "    Reload nginx (sans arrêt): docker exec movetodata-frontend nginx -s reload"
echo "    Debug WS complet       : bash ${SCRIPT_DIR}/diag.sh --full --ws-check"
echo ""
echo "  Activer debug Spring Boot (sans rebuild) :"
echo "    echo 'LOGGING_LEVEL_ROOT=DEBUG' >> ${SCRIPT_DIR}/.env.movetodata"
echo "    docker compose --project-name movetodata \\"
echo "      -f ${SCRIPT_DIR}/../compose/docker-compose.core.yml \\"
echo "      --env-file ${SCRIPT_DIR}/.env.movetodata \\"
echo "      up -d --no-deps boson"
echo ""
echo "  Debug WebSocket nginx :"
echo "    # Décommenter 'access_log /var/log/nginx/ws_debug.log ws_debug;'"
echo "    # dans frontend/nginx.conf location /api/ws/"
echo "    cp /opt/movetodata/frontend/nginx.conf /opt/movetodata/data/frontend/nginx.conf"
echo "    docker exec movetodata-frontend nginx -s reload"
echo "    docker exec movetodata-frontend tail -f /var/log/nginx/ws_debug.log"
echo ""
