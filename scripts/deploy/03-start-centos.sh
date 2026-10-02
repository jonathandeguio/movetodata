#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 03 : Démarrage sur CentOS 7 / 8 / 9
# Usage : bash 03-start-centos.sh [--stack core|snap|tycho|all]
#
# Différences vs Ubuntu (03-start.sh) :
#   - Pré-vol SELinux : restorecon + chcon sur /movetodata avant docker compose up
#   - /var/lib/mycontainer créé et étiqueté pour Snap (container_file_t)
#   - FUSE : message d'erreur corrigé (yum/dnf, pas apt)
#   - Firewalld : vérification que les ports sont ouverts
#   - Détection automatique CentOS 7 (yum) vs 8/9 (dnf)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

MOVETODATA_MOUNT_PATH="${MOVETODATA_MOUNT_PATH:-/movetodata}"

# Parsing des arguments
STACK="all"
[[ $# -ge 1 && "$1" != "--stack" ]] && STACK="$1"
[[ $# -ge 2 && "$1" == "--stack" ]]  && STACK="$2"

COMPOSE_CORE="${SCRIPT_DIR}/../compose/docker-compose.core.yml"
COMPOSE_SNAP="${SCRIPT_DIR}/../compose/docker-compose.snap.yml"
COMPOSE_TYCHO="${SCRIPT_DIR}/../compose/docker-compose.tycho.yml"

compose_core()  { docker compose --project-name movetodata -f "${COMPOSE_CORE}"  --env-file "${ENV_FILE}" "$@"; }
compose_snap()  { docker compose --project-name movetodata -f "${COMPOSE_SNAP}"  --env-file "${ENV_FILE}" "$@"; }
compose_tycho() { docker compose --project-name movetodata -f "${COMPOSE_TYCHO}" --env-file "${ENV_FILE}" "$@"; }

# Détection du gestionnaire de paquets
PKG_MGR="dnf"
if [[ -f /etc/os-release ]]; then
  source /etc/os-release
  [[ "${VERSION_ID%%.*}" == "7" ]] && PKG_MGR="yum"
fi

# =============================================================================
# PRÉ-VOLS SELINUX — à exécuter AVANT tout docker compose up
# =============================================================================
preflight_selinux() {
  local target_dir="$1"
  local label="${2:-${target_dir}}"

  local selinux_status
  selinux_status=$(getenforce 2>/dev/null || echo "Disabled")

  if [[ "${selinux_status}" == "Disabled" ]]; then
    return 0
  fi

  info "SELinux ${selinux_status} — application des contextes sur ${label}..."

  if [[ ! -d "${target_dir}" ]]; then
    mkdir -p "${target_dir}"
  fi

  # Préférer semanage + restorecon (persistant)
  if command -v semanage &>/dev/null && command -v restorecon &>/dev/null; then
    semanage fcontext -a -t container_file_t "${target_dir}(/.*)?" 2>/dev/null || \
    semanage fcontext -m -t container_file_t "${target_dir}(/.*)?" 2>/dev/null || true
    restorecon -Rv "${target_dir}" 2>/dev/null | \
      grep -E "^Relabeled" | head -5 || true
    success "SELinux: contexte container_file_t appliqué sur ${label}"
  else
    # Fallback chcon (temporaire, perdu après relabeling)
    chcon -Rt svirt_sandbox_file_t "${target_dir}" 2>/dev/null && \
      success "SELinux: chcon svirt_sandbox_file_t appliqué sur ${label}" || \
      warn "SELinux: impossible d'appliquer le contexte sur ${label} — accès volume Docker potentiellement bloqué"
  fi
}

# =============================================================================
# Vérification firewalld
# =============================================================================
check_firewall_port() {
  local port_proto="$1"   # ex: "8080/tcp"
  local service_name="$2"

  if systemctl is-active firewalld &>/dev/null; then
    if ! firewall-cmd --query-port="${port_proto}" &>/dev/null; then
      warn "Port ${port_proto} (${service_name}) non ouvert dans firewalld"
      warn "  Ouvrir : firewall-cmd --permanent --add-port=${port_proto} && firewall-cmd --reload"
    else
      success "Firewall: port ${port_proto} ouvert (${service_name})"
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
# Arrêt propre des conteneurs existants du projet
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
    # Essai via docker compose (projet movetodata)
    compose_core down --remove-orphans 2>/dev/null || true
    compose_snap  down --remove-orphans 2>/dev/null || true
    # Arrêt forcé des conteneurs encore présents
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

  # --- Arrêt des conteneurs existants ---
  stop_existing movetodata-boson-db movetodata-redis movetodata-boson movetodata-frontend

  # --- Pré-vols SELinux ---
  info "Préparation des volumes (SELinux + répertoires)..."
  preflight_selinux "${MOVETODATA_MOUNT_PATH}"         "/movetodata"
  preflight_selinux "${MOVETODATA_MOUNT_PATH}/postgres" "/movetodata/postgres"
  preflight_selinux "${MOVETODATA_MOUNT_PATH}/redis"    "/movetodata/redis"
  preflight_selinux "${MOVETODATA_MOUNT_PATH}/boson"    "/movetodata/boson"
  preflight_selinux "/etc/movetodata"                   "/etc/movetodata"

  # Créer les répertoires manquants
  mkdir -p \
    "${MOVETODATA_MOUNT_PATH}/postgres/boson" \
    "${MOVETODATA_MOUNT_PATH}/redis" \
    "${MOVETODATA_MOUNT_PATH}/boson/logs/accessLogs" \
    "${MOVETODATA_MOUNT_PATH}/boson/data" \
    "${MOVETODATA_MOUNT_PATH}/dataset" \
    "${MOVETODATA_MOUNT_PATH}/file" \
    "${MOVETODATA_MOUNT_PATH}/repositories" \
    "${MOVETODATA_MOUNT_PATH}/spark-streaming"

  # Vérifier que /etc/movetodata/saml.yml est présent et complet
  # (requis pour que Spring crée le bean RelyingPartyRegistrationRepository)
  if [[ ! -f /etc/movetodata/saml.yml ]]; then
    warn "/etc/movetodata/saml.yml absent — exécutez d'abord : bash 00-install-system-centos.sh"
  elif ! grep -q "platform-default-login" /etc/movetodata/saml.yml; then
    warn "/etc/movetodata/saml.yml incomplet (platform-default-login manquant) — correction..."
    sed -i '1s/^/platform-default-login: password\n\n/' /etc/movetodata/saml.yml
    success "/etc/movetodata/saml.yml corrigé"
  fi

  # --- Vérification firewalld ---
  check_firewall_port "80/tcp"   "Frontend"
  check_firewall_port "8080/tcp" "Boson API"

  # --- Préparation du frontend (AVANT compose up) ---
  # Les volumes docker-compose montent ces fichiers/répertoires : ils doivent
  # exister sur l'hôte AVANT le démarrage du conteneur, sinon Docker les crée
  # comme répertoires et le montage de fichier échoue.
  local FRONTEND_SRC="${SCRIPT_DIR}/../../frontend"
  local FRONTEND_MOUNT="${MOVETODATA_MOUNT_PATH}/frontend"

  info "Préparation des volumes frontend..."
  mkdir -p "${FRONTEND_MOUNT}/build"

  # Écrire le nginx.conf comme FICHIER (proxy API + cookies SameSite=Lax)
  cat > "${FRONTEND_MOUNT}/nginx.conf" << 'NGINX_EOF'
user  nginx;
worker_processes  1;
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include            /etc/nginx/mime.types;
    default_type       application/octet-stream;
    log_format  main   '$remote_addr - $remote_user [$time_local] "$request" '
                       '$status $body_bytes_sent "$http_referer" '
                       '"$http_user_agent" "$http_x_forwarded_for"';
    access_log         /var/log/nginx/access.log  main;
    sendfile           on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;
        root   /app;

        location /api/ {
            proxy_pass http://movetodata-boson:8080/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 120s;
            proxy_cookie_flags bAT nosecure samesite=lax;
            proxy_cookie_flags bRT nosecure samesite=lax;
        }

        location /saml2/ {
            proxy_pass http://movetodata-boson:8080/saml2/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            index  index.html;
            try_files $uri $uri/ /index.html;
        }

        error_page   500 502 503 504  /50x.html;

        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
NGINX_EOF
  success "nginx.conf écrit dans ${FRONTEND_MOUNT}/nginx.conf"

  # Builder le frontend React si le build n'est pas déjà présent
  if [[ ! -f "${FRONTEND_MOUNT}/build/index.html" ]]; then
    if [[ -f "${FRONTEND_SRC}/package.json" ]]; then
      info "Build du frontend React (peut prendre 2-4 minutes)..."
      local build_ok=0
      docker run --rm \
        -v "${FRONTEND_SRC}:/app" \
        -w /app \
        node:18.12 \
        sh -c "set -e; yarn install 2>&1; yarn build 2>&1" \
        && build_ok=1

      if [[ ${build_ok} -eq 1 ]] && [[ -f "${FRONTEND_SRC}/build/index.html" ]]; then
        cp -r "${FRONTEND_SRC}/build/." "${FRONTEND_MOUNT}/build/"
        success "Frontend buildé → ${FRONTEND_MOUNT}/build/"
      else
        warn "Build frontend échoué — vérifiez les logs ci-dessus"
        warn "  Le conteneur frontend démarrera mais ne servira pas l'application React"
        warn "  Relancez manuellement : docker run --rm -v ${FRONTEND_SRC}:/app -w /app node:18.12 sh -c 'yarn install && yarn build'"
      fi
    else
      warn "Sources frontend introuvables dans ${FRONTEND_SRC} — build ignoré"
    fi
  else
    info "Build frontend déjà présent dans ${FRONTEND_MOUNT}/build/ — pas de rebuild"
    info "  (Pour forcer un rebuild : rm -rf ${FRONTEND_MOUNT}/build && relancer ce script)"
  fi

  # --- Docker Compose ---
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

  success "Stack Core démarrée"
}

# =============================================================================
# START SNAP — Artifact manager + Snap-UI + Nginx
# =============================================================================
start_snap() {
  section "Stack Snap (artifact manager)"

  # --- Vérification FUSE ---
  if [[ ! -c /dev/fuse ]]; then
    warn "/dev/fuse absent — chargement du module fuse..."
    modprobe fuse 2>/dev/null || \
      error "/dev/fuse non disponible.\n  Installez fuse : sudo ${PKG_MGR} install -y fuse fuse-libs"
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

  # /var/lib/mycontainer : utilisé par Snap pour stocker les containers OCI
  if [[ ! -d /var/lib/mycontainer ]]; then
    mkdir -p /var/lib/mycontainer
    info "/var/lib/mycontainer créé"
  fi

  # --- Pré-vols SELinux Snap ---
  preflight_selinux "${MOVETODATA_MOUNT_PATH}/snap"  "/movetodata/snap"
  preflight_selinux "/var/lib/mycontainer"        "/var/lib/mycontainer"

  # SELinux + FUSE : autoriser containers à utiliser fusefs
  local selinux_status
  selinux_status=$(getenforce 2>/dev/null || echo "Disabled")
  if [[ "${selinux_status}" != "Disabled" ]]; then
    setsebool -P use_fusefs_home_dirs 1 2>/dev/null && \
      success "SELinux: use_fusefs_home_dirs activé" || \
      warn "SELinux: impossible de positionner use_fusefs_home_dirs"

    # Le conteneur Snap est privileged + label:disable → SELinux contourné automatiquement
    info "SELinux: conteneur Snap en mode privileged + label:disable (contournement SELinux géré par Docker)"
  fi

  # --- Copie des sources Snap dans le répertoire attendu ---
  local SNAP_REPOS_DIR
  SNAP_REPOS_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)/Unify/snap/repos"
  mkdir -p "${SNAP_REPOS_DIR}"

  if [[ ! -d "${SNAP_REPOS_DIR}/snap" ]]; then
    local SNAP_SRC
    SNAP_SRC="$(cd "${SCRIPT_DIR}/../.." && pwd)/snap"
    if [[ -d "${SNAP_SRC}" ]]; then
      cp -r "${SNAP_SRC}" "${SNAP_REPOS_DIR}/snap"
      info "Sources snap copiées → Unify/snap/repos/snap"
    else
      warn "Répertoire snap/ introuvable — build depuis image pre-built uniquement"
    fi
  fi

  if [[ ! -d "${SNAP_REPOS_DIR}/snap-ui" ]]; then
    local SNAP_UI_SRC
    SNAP_UI_SRC="$(cd "${SCRIPT_DIR}/../.." && pwd)/snap-ui"
    if [[ -d "${SNAP_UI_SRC}" ]]; then
      cp -r "${SNAP_UI_SRC}" "${SNAP_REPOS_DIR}/snap-ui"
      info "Sources snap-ui copiées → Unify/snap/repos/snap-ui"
    else
      warn "Répertoire snap-ui/ introuvable — build depuis image pre-built uniquement"
    fi
  fi

  # --- Vérification firewalld ---
  check_firewall_port "8082/tcp" "Snap"

  # --- Docker Compose ---
  info "Démarrage des containers Snap..."
  compose_snap up -d --remove-orphans

  # --- Attente Snap ---
  wait_healthy "movetodata-snap" 36 || true

  success "Stack Snap démarrée"
}

# =============================================================================
# START TYCHO — Apache Superset BI
# =============================================================================
start_tycho() {
  section "Stack Tycho (Apache Superset)"

  # --- Réseau movetodata-network (créé par core) ---
  if ! docker network ls --format '{{.Name}}' | grep -q "^movetodata-network$"; then
    warn "Réseau movetodata-network absent"
    info "Création du réseau movetodata-network..."
    docker network create movetodata-network 2>/dev/null && \
      success "Réseau movetodata-network créé" || \
      warn "Réseau déjà existant ou erreur"
  fi

  # --- Répertoires Tycho ---
  mkdir -p \
    "${MOVETODATA_MOUNT_PATH}/tycho/superset_home" \
    "${MOVETODATA_MOUNT_PATH}/postgres/tycho"

  # --- Pré-vols SELinux Tycho ---
  preflight_selinux "${MOVETODATA_MOUNT_PATH}/tycho"    "/movetodata/tycho"
  preflight_selinux "${MOVETODATA_MOUNT_PATH}/postgres/tycho" "/movetodata/postgres/tycho"

  # --- Vérification firewalld ---
  check_firewall_port "8088/tcp" "Tycho/Superset"

  # --- Docker Compose ---
  info "Démarrage des containers Tycho (app + worker + beat + websocket)..."
  compose_tycho up -d --remove-orphans

  # --- Attente init Tycho (one-shot : crée la DB et l'admin) ---
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

  local init_exit
  init_exit=$(docker inspect --format='{{.State.ExitCode}}' movetodata-tycho-init 2>/dev/null || echo "N/A")
  if [[ "${init_exit}" == "0" ]]; then
    success "Initialisation Tycho réussie (exit 0)"
  elif [[ "${init_exit}" != "N/A" ]]; then
    warn "Init Tycho exitcode=${init_exit} — vérifiez : docker logs movetodata-tycho-init"
  fi

  # --- Attente Tycho app ---
  wait_healthy "movetodata-tycho" 36 || true

  success "Stack Tycho démarrée"
}

# =============================================================================
# DISPATCH
# =============================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   MoveToData Platform — Démarrage sur CentOS     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "Stack cible : ${STACK}"
info "Données     : ${MOVETODATA_MOUNT_PATH}"
info "Base URL    : ${BASE_URL:-non définie}"
echo ""

case "${STACK}" in
  core)
    start_core
    ;;
  snap)
    start_snap
    ;;
  tycho)
    start_tycho
    ;;
  all)
    start_core
    start_snap
    start_tycho
    ;;
  *)
    error "Stack inconnue : '${STACK}'\nUsage : bash 03-start-centos.sh [--stack core|snap|tycho|all]"
    ;;
esac

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 | awk '{print $7}' | head -1)

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

[[ "${STACK}" == "snap" || "${STACK}" == "all" ]] && \
  echo "  Snap       : http://${SERVER_IP}:8082"
[[ "${STACK}" == "tycho" || "${STACK}" == "all" ]] && \
  echo "  Tycho      : http://${SERVER_IP}:8088"

echo ""
info "État des containers :"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | grep -E "movetodata|NAME" || true

echo ""
info "Commandes utiles :"
echo "  Logs Boson    : docker logs movetodata-boson --tail 100 -f"
echo "  Health check  : bash ${SCRIPT_DIR}/05-healthcheck.sh"
echo "  Logs complets : bash ${SCRIPT_DIR}/06-logs.sh --service all"
echo ""

# Avertissement SELinux si Enforcing et erreurs potentielles
SELINUX_STATUS=$(getenforce 2>/dev/null || echo "Disabled")
if [[ "${SELINUX_STATUS}" == "Enforcing" ]]; then
  warn "SELinux Enforcing actif — si un container refuse d'accéder à un volume :"
  echo "  1. Vérifier : ausearch -m avc -ts recent | audit2why"
  echo "  2. Appliquer : restorecon -Rv /movetodata"
  echo "  3. En dernier recours sur un volume précis : chcon -Rt svirt_sandbox_file_t <chemin>"
fi
