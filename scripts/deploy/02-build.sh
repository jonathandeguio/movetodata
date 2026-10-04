#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 02 : Build de toutes les images Docker
# Usage : bash 02-build.sh [--service boson|frontend|snap|snap-ui|tycho|all]
# Durée estimée : 15–40 min selon la bande passante (Spark ~400Mo)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ ! -f "${ENV_FILE}" ]] && error "Fichier d'environnement manquant : ${ENV_FILE}\n  Exécutez d'abord : bash 01-setup-env.sh"

# Chargement de l'environnement
set -a; source "${ENV_FILE}"; set +a

SERVICE="${1:-all}"
[[ "$#" -ge 2 && "$1" == "--service" ]] && SERVICE="$2"

BUILD_START=$(date +%s)

# =============================================================================
build_boson() {
  info "=== Build Boson (Java 11 + Spring Boot + Spark 3.4.3) ==="
  info "    Durée estimée : 10–20 min (téléchargement Spark ~400Mo)"
  # BuildKit ignore --pull quand FROM a --platform explicite → forcer rmi + pull manuel
  info "    Forçage du re-pull de gradle:7.6.1-jdk11 (contournement cache stale amd64)..."
  docker rmi -f gradle:7.6.1-jdk11 2>/dev/null || true
  docker pull --platform linux/amd64 gradle:7.6.1-jdk11
  docker build \
    --platform linux/amd64 \
    --tag movetodata/boson:latest \
    --tag movetodata/boson:"$(date +%Y%m%d)" \
    "${REPO_ROOT}/boson"
  success "Image movetodata/boson:latest construite"
}

build_frontend() {
  info "=== Build Frontend (React 18 + Nginx) ==="
  docker build \
    --platform linux/amd64 \
    --tag movetodata/frontend:latest \
    --tag movetodata/frontend:"$(date +%Y%m%d)" \
    --build-arg REACT_APP_API_URL="${BASE_URL:-http://localhost:8080}/api" \
    "${REPO_ROOT}/frontend"
  success "Image movetodata/frontend:latest construite"
}

build_snap() {
  info "=== Build Snap (Java Spring Boot - artifact manager) ==="
  docker build \
    --platform linux/amd64 \
    --tag movetodata/snap:latest \
    --tag movetodata/snap:"$(date +%Y%m%d)" \
    "${REPO_ROOT}/snap"
  success "Image movetodata/snap:latest construite"
}

build_snap_ui() {
  info "=== Build Snap-UI (React + Nginx) ==="
  docker build \
    --platform linux/amd64 \
    --tag movetodata/snap-ui:latest \
    --tag movetodata/snap-ui:"$(date +%Y%m%d)" \
    "${REPO_ROOT}/snap-ui"
  success "Image movetodata/snap-ui:latest construite"
}

build_tycho() {
  info "=== Build Tycho (Apache Superset fork - Python 3.8) ==="
  info "    Durée estimée : 10–20 min (compilation Python + Node)"
  docker build \
    --platform linux/amd64 \
    --tag movetodata/tycho:latest \
    --tag movetodata/tycho:"$(date +%Y%m%d)" \
    "${REPO_ROOT}/tycho"
  success "Image movetodata/tycho:latest construite"
}

# =============================================================================

case "${SERVICE}" in
  boson)     build_boson ;;
  frontend)  build_frontend ;;
  snap)      build_snap ;;
  snap-ui)   build_snap_ui ;;
  tycho)     build_tycho ;;
  all)
    build_boson
    build_frontend
    build_snap
    build_snap_ui
    build_tycho
    ;;
  *)
    error "Service inconnu : ${SERVICE}\nUsage : bash 02-build.sh [--service boson|frontend|snap|snap-ui|tycho|all]"
    ;;
esac

BUILD_END=$(date +%s)
BUILD_DURATION=$(( BUILD_END - BUILD_START ))

echo ""
success "==================================================="
success " Build MoveToData terminé en $((BUILD_DURATION / 60))m$((BUILD_DURATION % 60))s"
success "==================================================="
echo ""
info "Images disponibles :"
docker images | grep "^movetodata" | sort

echo ""
info "Prochaine étape : bash 03-start.sh"
