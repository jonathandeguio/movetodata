#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 07 : Redémarrage d'un service (CentOS)
# Usage : bash 07-restart-centos.sh [--service boson|frontend|snap|snap-ui|tycho|all]
#         bash 07-restart-centos.sh --service boson --rebuild
#
# Différences vs Ubuntu :
#   - Appelle 03-start-centos.sh (avec SELinux preflight + FUSE check)
#   - Ré-applique le contexte SELinux avant docker compose up
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

# =============================================================================
# SELinux : ré-application du contexte (persistant via semanage ou chcon)
# =============================================================================
reapply_selinux() {
  local target_dir="$1"
  local selinux_status
  selinux_status=$(getenforce 2>/dev/null || echo "Disabled")
  [[ "${selinux_status}" == "Disabled" ]] && return 0

  if command -v semanage &>/dev/null && command -v restorecon &>/dev/null; then
    semanage fcontext -a -t container_file_t "${target_dir}(/.*)?" 2>/dev/null || \
    semanage fcontext -m -t container_file_t "${target_dir}(/.*)?" 2>/dev/null || true
    restorecon -Rv "${target_dir}" 2>/dev/null | grep -E "^Relabeled" | head -3 || true
  else
    chcon -Rt svirt_sandbox_file_t "${target_dir}" 2>/dev/null || true
  fi
}

# =============================================================================
# Restart simple d'un container (sans rebuild)
# =============================================================================
restart_container() {
  local container="$1"
  info "Redémarrage de ${container}..."
  docker restart "${container}" 2>/dev/null || warn "${container} non trouvé"
  success "${container} redémarré"
}

# =============================================================================
# Rebuild + recreate via docker compose
# =============================================================================
rebuild_and_restart() {
  local service="$1"
  local compose_file="$2"
  local volume_dir="${3:-${MOVETODATA_MOUNT_PATH:-/movetodata}}"

  info "Rebuild + restart du service ${service}..."

  if ${REBUILD}; then
    info "Build de l'image ${service}..."
    bash "${SCRIPT_DIR}/02-build.sh" --service "${service}"
  fi

  # Ré-appliquer SELinux sur le volume avant docker compose up
  reapply_selinux "${volume_dir}"

  docker compose -f "${compose_file}" \
    --env-file "${ENV_FILE}" \
    up -d --no-deps --force-recreate "${service}"

  success "Service ${service} redémarré"
}

# =============================================================================
# Dispatch par service
# =============================================================================
MOVETODATA_MOUNT_PATH="${MOVETODATA_MOUNT_PATH:-/movetodata}"

case "${SERVICE}" in
  boson)
    if ${REBUILD}; then
      rebuild_and_restart "boson" "${COMPOSE_CORE}" "${MOVETODATA_MOUNT_PATH}/boson"
    else
      restart_container "movetodata-boson"
    fi
    ;;

  frontend)
    if ${REBUILD}; then
      rebuild_and_restart "frontend" "${COMPOSE_CORE}" "${MOVETODATA_MOUNT_PATH}"
    else
      restart_container "movetodata-frontend"
    fi
    ;;

  snap)
    # Snap nécessite FUSE + SELinux
    if [[ ! -c /dev/fuse ]]; then
      warn "/dev/fuse absent — chargement du module fuse..."
      modprobe fuse 2>/dev/null || error "/dev/fuse non disponible après modprobe"
    fi

    if ${REBUILD}; then
      rebuild_and_restart "snap" "${COMPOSE_SNAP}" "${MOVETODATA_MOUNT_PATH}/snap"
    else
      reapply_selinux "${MOVETODATA_MOUNT_PATH}/snap"
      restart_container "movetodata-snap"
    fi
    ;;

  snap-ui)
    if ${REBUILD}; then
      rebuild_and_restart "snap-ui" "${COMPOSE_SNAP}" "${MOVETODATA_MOUNT_PATH}/snap"
    else
      restart_container "movetodata-snap-ui"
    fi
    ;;

  tycho)
    if ${REBUILD}; then
      rebuild_and_restart "tycho" "${COMPOSE_TYCHO}" "${MOVETODATA_MOUNT_PATH}/tycho"
    else
      restart_container "movetodata-tycho"
      restart_container "movetodata-tycho-worker"
      restart_container "movetodata-tycho-beat"
    fi
    ;;

  all)
    info "Redémarrage complet de la plateforme..."
    bash "${SCRIPT_DIR}/04-stop.sh" all
    # Ré-application SELinux globale avant relance
    reapply_selinux "${MOVETODATA_MOUNT_PATH}"
    bash "${SCRIPT_DIR}/03-start-centos.sh" all
    ;;

  *)
    error "Service inconnu : ${SERVICE}\nUsage : bash 07-restart-centos.sh [--service boson|frontend|snap|snap-ui|tycho|all] [--rebuild]"
    ;;
esac

echo ""
info "État post-redémarrage :"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | grep -E "movetodata|NAME" || echo "  (aucun container movetodata actif)"
