#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 03 : Démarrage sur Ubuntu
# Usage : bash 03-start.sh [--stack core|snap|tycho|all]
#
# Chemins :
#   Application : /opt/movetodata      (scripts, code source)
#   Données     : /opt/movetodata/data (volumes Docker)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}   $*"; }
success() { echo -e "${GREEN}[OK]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }
section() { echo -e "\n${CYAN}─── $* ───${NC}"; }

# =============================================================================
# Chargement de l'environnement
# =============================================================================
[[ ! -f "${ENV_FILE}" ]] && \
  error "Fichier .env.movetodata manquant.\n  Exécutez d'abord : bash 01-setup-env.sh"

set -a
source "${ENV_FILE}"
set +a

MOVETODATA_MOUNT_PATH="${MOVETODATA_MOUNT_PATH:-/opt/movetodata/data}"

# Parsing des arguments
STACK="all"
[[ $# -ge 1 && "$1" != "--stack" ]] && STACK="$1"
[[ $# -ge 2 && "$1" == "--stack" ]]  && STACK="$2"

COMPOSE_CORE="${SCRIPT_DIR}/../compose/docker-compose.core.yml"
COMPOSE_SNAP="${SCRIPT_DIR}/../compose/docker-compose.snap.yml"
COMPOSE_TYCHO="${SCRIPT_DIR}/../compose/docker-compose.tycho.yml"

# Compatibilité Docker Compose v1 (docker-compose) et v2 (docker compose)
if docker compose version &>/dev/null 2>&1; then
  _compose() { docker compose "$@"; }
elif command -v docker-compose &>/dev/null; then
  _compose() { docker-compose "$@"; }
else
  error "Docker Compose introuvable.\n  Installez-le : sudo apt-get install -y docker-compose-plugin"
fi

compose_core()  { _compose --project-name movetodata -f "${COMPOSE_CORE}"  --env-file "${ENV_FILE}" "$@"; }
compose_snap()  { _compose --project-name movetodata -f "${COMPOSE_SNAP}"  --env-file "${ENV_FILE}" "$@"; }
compose_tycho() { _compose --project-name movetodata -f "${COMPOSE_TYCHO}" --env-file "${ENV_FILE}" "$@"; }

# =============================================================================
# Vérification port UFW (informatif seulement)
# =============================================================================
check_firewall_port() {
  local port_proto="$1"
  local service_name="$2"

  if command -v ufw &>/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
    if ! ufw status | grep -qE "^${port_proto%/*}\s.*ALLOW"; then
      warn "UFW actif — port ${port_proto} (${service_name}) peut-être bloqué"
      warn "  Ouvrir : ufw allow ${port_proto}"
    else
      success "UFW: port ${port_proto} ouvert (${service_name})"
    fi
  fi
}

# =============================================================================
# Attente healthcheck container
# =============================================================================
wait_healthy() {
  local container="$1"
  local max_attempts="${2:-36}"   # 36 × 5s = 3 min
  local attempt=0

  info "Attente healthcheck ${container} (max $((max_attempts * 5 / 60))min$((max_attempts * 5 % 60))s)..."
  until docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null \
        | grep -q "healthy"; do
    attempt=$((attempt + 1))
    if [[ ${attempt} -ge ${max_attempts} ]]; then
      warn "${container} pas encore healthy — continuez avec : docker logs ${container}"
      return 1
    fi
    printf "."
    sleep 5
  done
  echo ""
  success "${container} : healthy"
}

# =============================================================================
# Arrêt propre des conteneurs existants
# =============================================================================
stop_existing() {
  local containers=("$@")
  local found=0

  for c in "${containers[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
      found=1
      break
    fi
  done

  if [[ ${found} -eq 1 ]]; then
    info "Conteneurs existants détectés — arrêt en cours..."
    compose_core down --remove-orphans 2>/dev/null || true
    compose_snap  down --remove-orphans 2>/dev/null || true
    for c in "${containers[@]}"; do
      if docker ps -q -f "name=^${c}$" | grep -q .; then
        docker stop "${c}" 2>/dev/null || true
      fi
      if docker ps -a -q -f "name=^${c}$" | grep -q .; then
        docker rm -f "${c}" 2>/dev/null || true
      fi
    done
    success "Conteneurs existants arrêtés et supprimés"
  fi
}

# =============================================================================
# START CORE — Boson + Frontend + PostgreSQL + Redis
# =============================================================================
start_core() {
  section "Stack Core (Boson + Frontend + PostgreSQL + Redis)"

  # --- Arrêt des conteneurs existants (y compris movetodata-docs) ---
  stop_existing movetodata-boson-db movetodata-redis movetodata-boson movetodata-frontend movetodata-docs

  # --- Vérification répertoires de stockage (créés par 00-setup-storage.sh) ---
  if [[ ! -d "${MOVETODATA_MOUNT_PATH}/frontend" ]]; then
    warn "Répertoires de stockage absents — exécution de 00-setup-storage.sh..."
    bash "${SCRIPT_DIR}/00-setup-storage.sh" || error "Échec de l'initialisation du stockage"
  fi

  # Garde-fou : s'assurer que les répertoires critiques existent
  mkdir -p \
    "${MOVETODATA_MOUNT_PATH}/postgres/boson" \
    "${MOVETODATA_MOUNT_PATH}/redis" \
    "${MOVETODATA_MOUNT_PATH}/frontend/build"

  # Vérification /etc/movetodata/saml.yml
  if [[ ! -f /etc/movetodata/saml.yml ]] || ! grep -q "relyingparty" /etc/movetodata/saml.yml 2>/dev/null; then
    warn "/etc/movetodata/saml.yml absent ou incomplet"
    warn "  Exécutez : sudo bash ${SCRIPT_DIR}/00-setup-storage.sh"
  fi

  # --- Vérification UFW ---
  check_firewall_port "80/tcp"   "Frontend"
  check_firewall_port "8080/tcp" "Boson API"

  # --- Préparation du frontend (AVANT compose up) ---
  # Les volumes Docker montent ces fichiers depuis l'hôte — ils doivent
  # exister AVANT le démarrage du conteneur, sinon Docker les crée en
  # tant que répertoires et le montage de fichier échoue.
  local FRONTEND_SRC="${SCRIPT_DIR}/../../frontend"
  local FRONTEND_MOUNT="${MOVETODATA_MOUNT_PATH}/frontend"

  info "Copie du nginx.conf depuis les sources..."
  local NGINX_SRC="${REPO_ROOT}/frontend/nginx.conf"
  if [[ -f "${NGINX_SRC}" ]]; then
    cp "${NGINX_SRC}" "${FRONTEND_MOUNT}/nginx.conf"
    success "nginx.conf copié : ${NGINX_SRC} → ${FRONTEND_MOUNT}/nginx.conf"
  else
    warn "nginx.conf source introuvable : ${NGINX_SRC}"
    warn "  Le container frontend utilisera son nginx.conf embarqué"
  fi

  # Build du frontend React si nécessaire
  if [[ ! -f "${FRONTEND_MOUNT}/build/index.html" ]]; then
    if [[ -f "${FRONTEND_SRC}/package.json" ]]; then
      info "Build du frontend React (peut prendre 2-4 minutes)..."
      local build_ok=0
      docker run --rm \
        -v "${FRONTEND_SRC}:/app" \
        -w /app \
        node:18.12 \
        sh -c "set -e; corepack enable; corepack prepare yarn@3.5.0 --activate; yarn install 2>&1; yarn build 2>&1" \
        && build_ok=1

      if [[ ${build_ok} -eq 1 ]] && [[ -f "${FRONTEND_SRC}/build/index.html" ]]; then
        cp -r "${FRONTEND_SRC}/build/." "${FRONTEND_MOUNT}/build/"
        success "Frontend buildé → ${FRONTEND_MOUNT}/build/"
      else
        warn "Build frontend échoué — vérifiez les logs ci-dessus"
        warn "  Relancez manuellement :"
        warn "  docker run --rm -v ${FRONTEND_SRC}:/app -w /app node:18.12 sh -c 'yarn install && yarn build'"
      fi
    else
      warn "Sources frontend introuvables dans ${FRONTEND_SRC} — build ignoré"
    fi
  else
    info "Build frontend déjà présent — pas de rebuild"
    info "  (Pour forcer : rm -rf ${FRONTEND_MOUNT}/build && relancer ce script)"
  fi

  # --- Suppression forcée de tout conteneur en conflit (quel que soit son projet d'origine) ---
  for _c in movetodata-boson-db movetodata-redis movetodata-boson movetodata-frontend movetodata-docs; do
    if docker ps -a -q -f "name=^${_c}$" | grep -q .; then
      warn "Suppression forcée du conteneur conflictuel : ${_c}"
      docker rm -f "${_c}" 2>/dev/null || true
    fi
  done

  # --- Démarrage des containers ---
  info "Démarrage des containers Core..."
  compose_core up -d --remove-orphans

  # --- Attente PostgreSQL ---
  info "Attente PostgreSQL (max 60s)..."
  local attempt=0
  until docker exec movetodata-boson-db pg_isready \
        -U "${BOSON_DB_USERNAME:-movetodata}" -d "${BOSON_DB_NAME:-boson}" &>/dev/null; do
    attempt=$((attempt + 1))
    [[ ${attempt} -ge 12 ]] && { warn "PostgreSQL lent — continuez quand même"; break; }
    printf "."
    sleep 5
  done
  echo ""

  # --- Attente Boson ---
  wait_healthy "movetodata-boson" 36 || true

  # --- Activation Upload (si pas encore configuré) ---
  local DB_USER="${BOSON_DB_USERNAME:-movetodata}"
  local DB_NAME="${BOSON_DB_NAME:-boson}"
  info "Vérification upload activé dans platform_config..."
  docker exec movetodata-boson-db psql -U "${DB_USER}" -d "${DB_NAME}" -c \
    "UPDATE platform_config SET upload = true, download = true WHERE name = 'platformConfig';" \
    2>/dev/null || true
  success "Upload/Download activés (ou déjà actifs)"

  success "Stack Core démarrée"
}

# =============================================================================
# START SNAP — Artifact manager
# =============================================================================
start_snap() {
  section "Stack Snap (artifact manager)"

  # --- Vérification FUSE ---
  if [[ ! -c /dev/fuse ]]; then
    warn "/dev/fuse absent — chargement du module fuse..."
    modprobe fuse 2>/dev/null || \
      error "/dev/fuse non disponible.\n  Installez fuse : sudo apt install -y fuse"
    sleep 1
  fi
  [[ -c /dev/fuse ]] && success "FUSE : /dev/fuse disponible" || \
    error "/dev/fuse toujours absent après modprobe fuse"

  # --- Répertoires Snap ---
  info "Création des répertoires Snap..."
  mkdir -p \
    "${MOVETODATA_MOUNT_PATH}/snap/artifactory" \
    "${MOVETODATA_MOUNT_PATH}/snap/logs" \
    "${MOVETODATA_MOUNT_PATH}/snap/db/data" \
    "${MOVETODATA_MOUNT_PATH}/snap/db/dbscripts"

  if [[ ! -d /var/lib/mycontainer ]]; then
    mkdir -p /var/lib/mycontainer
  fi

  # --- Copie des sources Snap ---
  local SNAP_REPOS_DIR="${SCRIPT_DIR}/../Unify/snap/repos"
  mkdir -p "${SNAP_REPOS_DIR}"

  if [[ ! -d "${SNAP_REPOS_DIR}/snap" ]] && [[ -d "${SCRIPT_DIR}/../snap" ]]; then
    cp -r "${SCRIPT_DIR}/../snap" "${SNAP_REPOS_DIR}/snap"
    info "Sources snap copiées → Unify/snap/repos/snap"
  fi
  if [[ ! -d "${SNAP_REPOS_DIR}/snap-ui" ]] && [[ -d "${SCRIPT_DIR}/../snap-ui" ]]; then
    cp -r "${SCRIPT_DIR}/../snap-ui" "${SNAP_REPOS_DIR}/snap-ui"
    info "Sources snap-ui copiées → Unify/snap/repos/snap-ui"
  fi

  # --- Vérification UFW ---
  check_firewall_port "8082/tcp" "Snap"

  # --- Suppression forcée des containers Snap en conflit ---
  for _c in movetodata-snap-db movetodata-snap movetodata-snap-ui movetodata-snap-proxy; do
    if docker ps -a -q -f "name=^${_c}$" | grep -q .; then
      warn "Suppression forcée du conteneur conflictuel : ${_c}"
      docker rm -f "${_c}" 2>/dev/null || true
    fi
  done

  info "Démarrage des containers Snap..."
  compose_snap up -d --remove-orphans

  wait_healthy "movetodata-snap" 36 || true
  success "Stack Snap démarrée"
}

# =============================================================================
# START TYCHO — Apache Superset BI
# =============================================================================
start_tycho() {
  section "Stack Tycho (Apache Superset)"

  # --- Réseau movetodata-network ---
  if ! docker network ls --format '{{.Name}}' | grep -q "^movetodata-network$"; then
    info "Création du réseau movetodata-network..."
    docker network create movetodata-network 2>/dev/null && \
      success "Réseau movetodata-network créé" || \
      warn "Réseau déjà existant"
  fi

  mkdir -p \
    "${MOVETODATA_MOUNT_PATH}/tycho/superset_home" \
    "${MOVETODATA_MOUNT_PATH}/postgres/tycho"

  # --- Vérification UFW ---
  check_firewall_port "8088/tcp" "Tycho/Superset"

  info "Démarrage des containers Tycho..."
  compose_tycho up -d --remove-orphans

  # --- Attente init Tycho ---
  info "Attente de l'initialisation Tycho (création DB + admin, max 3 min)..."
  local attempt=0
  until [[ "$(docker inspect --format='{{.State.Status}}' movetodata-tycho-init 2>/dev/null)" == "exited" ]] \
     || ! docker ps -a --format '{{.Names}}' | grep -q "^movetodata-tycho-init$"; do
    attempt=$((attempt + 1))
    [[ ${attempt} -ge 36 ]] && { warn "Init Tycho lent — vérifiez : docker logs movetodata-tycho-init"; break; }
    printf "."
    sleep 5
  done
  echo ""

  wait_healthy "movetodata-tycho" 36 || true
  success "Stack Tycho démarrée"
}

# =============================================================================
# DISPATCH
# =============================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   MoveToData Platform — Démarrage Ubuntu         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "Stack cible : ${STACK}"
info "Données     : ${MOVETODATA_MOUNT_PATH}"
info "Base URL    : ${BASE_URL:-non définie}"
echo ""

case "${STACK}" in
  core)  start_core  ;;
  snap)  start_snap  ;;
  tycho) start_tycho ;;
  all)
    start_core
    start_snap
    start_tycho
    ;;
  *)
    error "Stack inconnue : '${STACK}'\nUsage : bash 03-start.sh [--stack core|snap|tycho|all]"
    ;;
esac

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Plateforme MoveToData démarrée                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
info "URLs d'accès :"
echo "  Frontend   : http://${SERVER_IP}:80"
echo "  API Boson  : http://${SERVER_IP}:8080"
echo "  Swagger    : http://${SERVER_IP}:8080/swagger-ui/index.html"
echo "  Health     : http://${SERVER_IP}:8080/endpoints/health"

[[ "${STACK}" == "snap"  || "${STACK}" == "all" ]] && echo "  Snap       : http://${SERVER_IP}:8082"
[[ "${STACK}" == "tycho" || "${STACK}" == "all" ]] && echo "  Tycho      : http://${SERVER_IP}:8088"

echo ""
info "État des containers :"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | grep -E "movetodata|NAME" || true

echo ""
info "Commandes utiles :"
echo "  Logs Boson    : docker logs movetodata-boson --tail 100 -f"
echo "  Health check  : bash ${SCRIPT_DIR}/05-healthcheck.sh"
echo "  Logs complets : bash ${SCRIPT_DIR}/06-logs.sh --service all"
echo "  Arrêt         : bash ${SCRIPT_DIR}/04-stop.sh core"
echo ""
