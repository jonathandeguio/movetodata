#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Point d'entrée unifié CentOS 7 / 8 / 9 / Stream
# Usage : bash movetodata-centos.sh <commande> [options]
#
# Commandes disponibles :
#   install    Installe Docker + dépendances système (root requis)
#   env        Configure les variables d'environnement
#   build      Construit les images Docker
#   start      Démarre la plateforme (avec SELinux preflight)
#   stop       Arrête la plateforme
#   restart    Redémarre un service
#   update     Rebuild + restart d'un service
#   status     Affiche l'état des containers
#   health     Lance le healthcheck complet
#   logs       Affiche les logs
#   selinux    Diagnostique et répare les contextes SELinux
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# =============================================================================
# Détection OS (pour affichage seulement)
# =============================================================================
OS_NAME="CentOS/RHEL"
if [[ -f /etc/os-release ]]; then
  source /etc/os-release
  OS_NAME="${NAME:-CentOS} ${VERSION_ID:-}"
fi

# =============================================================================
# Usage
# =============================================================================
usage() {
  cat << EOF

${CYAN}╔══════════════════════════════════════════════════════════════╗
║       MoveToData Platform — Gestionnaire CentOS / RHEL           ║
║       Système : ${OS_NAME}
╚══════════════════════════════════════════════════════════════╝${NC}

${BLUE}Usage:${NC} bash movetodata-centos.sh <commande> [options]

${GREEN}Commandes d'installation :${NC}
  ${GREEN}install${NC}              Installe Docker + dépendances OS CentOS (sudo requis)
  ${GREEN}components${NC}           Installe les runtimes techniques (JDK, Node, Python, PG, ...) (sudo requis)
  ${GREEN}env${NC}                  Configure et génère le fichier .env.movetodata

${GREEN}Commandes de build :${NC}
  ${GREEN}build${NC} [service]      Construit les images Docker
                       (all | boson | frontend | snap | snap-ui | tycho)

${GREEN}Commandes de démarrage :${NC}
  ${GREEN}start${NC} [stack]        Démarre la plateforme avec SELinux preflight
                       (all | core | snap | tycho)
  ${GREEN}stop${NC} [stack]         Arrête la plateforme (all | core | snap | tycho)
                       Option : --volumes  (supprime les données Docker)

${GREEN}Commandes de maintenance :${NC}
  ${GREEN}restart${NC} [service]    Redémarre un service [--rebuild]
  ${GREEN}update${NC} [service]     Rebuild + redémarrage d'un service
  ${GREEN}status${NC}               État de tous les containers MoveToData
  ${GREEN}health${NC}               Healthcheck complet (API, DB, Redis, ports)
  ${GREEN}logs${NC} [service]       Affiche les logs [--tail N] [--follow]
                       (boson | frontend | snap | tycho | db | redis | all)

${GREEN}Commandes CentOS spécifiques :${NC}
  ${GREEN}selinux${NC}              Diagnostique et répare les contextes SELinux
  ${GREEN}firewall${NC}             Vérifie et ouvre les ports dans firewalld
  ${GREEN}fuse${NC}                 Vérifie et charge le module FUSE (requis par Snap)

${BLUE}Exemples :${NC}
  sudo bash movetodata-centos.sh install
  bash movetodata-centos.sh env
  bash movetodata-centos.sh build all
  bash movetodata-centos.sh start all
  bash movetodata-centos.sh logs boson --follow
  bash movetodata-centos.sh restart boson --rebuild
  bash movetodata-centos.sh stop all
  bash movetodata-centos.sh selinux
  bash movetodata-centos.sh health

${YELLOW}Ordre d'installation recommandé :${NC}
  1. sudo bash movetodata-centos.sh install       # Docker, SELinux, firewalld, FUSE
  2. sudo bash movetodata-centos.sh components    # JDK 11, Node 18, Python, PostgreSQL 16...
  3. bash movetodata-centos.sh env                # Génération des secrets .env.movetodata
  4. bash movetodata-centos.sh build all          # Build des images Docker (15-40 min)
  5. bash movetodata-centos.sh start all          # Démarrage de la plateforme

EOF
}

# =============================================================================
# Commande selinux : diagnostic + réparation
# =============================================================================
cmd_selinux() {
  echo ""
  echo -e "${CYAN}=== Diagnostic SELinux MoveToData ===${NC}"
  echo ""

  local selinux_status
  selinux_status=$(getenforce 2>/dev/null || echo "Disabled")
  info "Statut SELinux : ${selinux_status}"

  if [[ "${selinux_status}" == "Disabled" ]]; then
    warn "SELinux désactivé — aucune action requise"
    return 0
  fi

  # Afficher les AVC récents liés à Docker / MoveToData
  echo ""
  info "AVC (Access Vector Cache) récents — refus SELinux :"
  if command -v ausearch &>/dev/null; then
    ausearch -m avc -ts recent 2>/dev/null | grep -E "docker|movetodata|container" | \
      head -20 || echo "  Aucun refus SELinux récent"
  else
    warn "ausearch non disponible (paquet audit)"
  fi

  echo ""
  info "Ré-application des contextes sur /movetodata et /etc/movetodata..."

  local MOVETODATA_DATA="${MOVETODATA_MOUNT_PATH:-/movetodata}"

  if command -v semanage &>/dev/null && command -v restorecon &>/dev/null; then
    semanage fcontext -a -t container_file_t "${MOVETODATA_DATA}(/.*)?" 2>/dev/null || \
    semanage fcontext -m -t container_file_t "${MOVETODATA_DATA}(/.*)?" 2>/dev/null || true
    restorecon -Rv "${MOVETODATA_DATA}" 2>/dev/null | head -20 || true

    semanage fcontext -a -t container_file_t "/etc/movetodata(/.*)?" 2>/dev/null || \
    semanage fcontext -m -t container_file_t "/etc/movetodata(/.*)?" 2>/dev/null || true
    restorecon -Rv /etc/movetodata 2>/dev/null || true

    success "Contextes container_file_t appliqués"
  else
    warn "semanage non disponible — utilisation de chcon (temporaire)"
    chcon -Rt svirt_sandbox_file_t "${MOVETODATA_DATA}" 2>/dev/null && \
      success "chcon appliqué sur ${MOVETODATA_DATA}" || warn "chcon échoué"
    chcon -Rt svirt_sandbox_file_t /etc/movetodata 2>/dev/null || true
  fi

  echo ""
  info "Booléens SELinux MoveToData :"
  getsebool container_manage_cgroup 2>/dev/null  || true
  getsebool use_fusefs_home_dirs    2>/dev/null  || true

  echo ""
  info "Pour diagnostiquer les refus en détail :"
  echo "  ausearch -m avc -ts recent | audit2why"
  echo "  ausearch -m avc -ts recent | audit2allow -M movetodata_local"
  echo "  semodule -i movetodata_local.pp"
}

# =============================================================================
# Commande firewall : vérification + ouverture des ports
# =============================================================================
cmd_firewall() {
  echo ""
  echo -e "${CYAN}=== Vérification Firewalld ===${NC}"
  echo ""

  if ! command -v firewall-cmd &>/dev/null; then
    warn "firewalld non installé sur ce système"
    return 0
  fi

  if ! systemctl is-active firewalld &>/dev/null; then
    warn "firewalld non actif"
    info "Pour démarrer : sudo systemctl start firewalld"
    return 0
  fi

  declare -A PORTS=(
    ["80/tcp"]="Frontend React"
    ["8080/tcp"]="Boson API"
    ["8082/tcp"]="Snap Artifact Manager"
    ["8088/tcp"]="Tycho / Superset"
  )

  for PORT_PROTO in "${!PORTS[@]}"; do
    if firewall-cmd --query-port="${PORT_PROTO}" &>/dev/null; then
      success "Port ${PORT_PROTO} ouvert (${PORTS[$PORT_PROTO]})"
    else
      warn "Port ${PORT_PROTO} FERMÉ (${PORTS[$PORT_PROTO]})"
      info "  Ouvrir : sudo firewall-cmd --permanent --add-port=${PORT_PROTO} && sudo firewall-cmd --reload"
    fi
  done

  echo ""
  info "Ports actuellement ouverts (zone active) :"
  firewall-cmd --list-ports 2>/dev/null | tr ' ' '\n' | sed 's|^|  |'
}

# =============================================================================
# Commande fuse : vérification + chargement
# =============================================================================
cmd_fuse() {
  echo ""
  echo -e "${CYAN}=== Vérification FUSE (requis par Snap) ===${NC}"
  echo ""

  if lsmod | grep -q "^fuse "; then
    success "Module fuse chargé"
  else
    warn "Module fuse non chargé — chargement en cours..."
    if modprobe fuse 2>/dev/null; then
      success "Module fuse chargé avec modprobe"
    else
      error "Impossible de charger le module fuse"
    fi
  fi

  if [[ -c /dev/fuse ]]; then
    success "/dev/fuse disponible"
    ls -la /dev/fuse
  else
    error "/dev/fuse absent malgré le module chargé"
  fi

  # Persistance
  if [[ ! -f /etc/modules-load.d/fuse.conf ]]; then
    warn "/etc/modules-load.d/fuse.conf absent — module non persistant au reboot"
    info "Pour rendre persistant : echo 'fuse' | sudo tee /etc/modules-load.d/fuse.conf"
  else
    success "fuse persistant au reboot (/etc/modules-load.d/fuse.conf)"
  fi
}

# =============================================================================
# Point d'entrée
# =============================================================================
CMD="${1:-help}"
shift || true

# Chargement de l'env si disponible (pour MOVETODATA_MOUNT_PATH)
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"
[[ -f "${ENV_FILE}" ]] && { set -a; source "${ENV_FILE}"; set +a; }
MOVETODATA_MOUNT_PATH="${MOVETODATA_MOUNT_PATH:-/movetodata}"

case "${CMD}" in

  # --------------------------------------------------------------------------
  # Installation système (CentOS) — Docker, SELinux, firewalld, user, dirs
  # --------------------------------------------------------------------------
  install)
    if [[ $EUID -ne 0 ]]; then
      exec sudo bash "${SCRIPT_DIR}/00-install-system-centos.sh" "$@"
    else
      exec bash "${SCRIPT_DIR}/00-install-system-centos.sh" "$@"
    fi
    ;;

  # --------------------------------------------------------------------------
  # Installation composants techniques (JDK, Node, Python, PG, Redis, Nginx...)
  # --------------------------------------------------------------------------
  components|install-components)
    if [[ $EUID -ne 0 ]]; then
      exec sudo bash "${SCRIPT_DIR}/install-components-centos.sh" "$@"
    else
      exec bash "${SCRIPT_DIR}/install-components-centos.sh" "$@"
    fi
    ;;

  # --------------------------------------------------------------------------
  # Configuration des variables
  # --------------------------------------------------------------------------
  env)
    exec bash "${SCRIPT_DIR}/01-setup-env.sh" "$@"
    ;;

  # --------------------------------------------------------------------------
  # Build des images Docker (OS-agnostic)
  # --------------------------------------------------------------------------
  build)
    if [[ $# -gt 0 ]]; then
      exec bash "${SCRIPT_DIR}/02-build.sh" --service "$@"
    else
      exec bash "${SCRIPT_DIR}/02-build.sh" --service all
    fi
    ;;

  # --------------------------------------------------------------------------
  # Démarrage avec SELinux preflight (CentOS)
  # --------------------------------------------------------------------------
  start)
    if [[ $# -gt 0 ]]; then
      exec bash "${SCRIPT_DIR}/03-start-centos.sh" --stack "$@"
    else
      exec bash "${SCRIPT_DIR}/03-start-centos.sh" --stack all
    fi
    ;;

  # --------------------------------------------------------------------------
  # Arrêt (OS-agnostic)
  # --------------------------------------------------------------------------
  stop)
    if [[ $# -gt 0 ]]; then
      exec bash "${SCRIPT_DIR}/04-stop.sh" "$@"
    else
      exec bash "${SCRIPT_DIR}/04-stop.sh" all
    fi
    ;;

  # --------------------------------------------------------------------------
  # Healthcheck (OS-agnostic)
  # --------------------------------------------------------------------------
  health|healthcheck)
    exec bash "${SCRIPT_DIR}/05-healthcheck.sh" "$@"
    ;;

  # --------------------------------------------------------------------------
  # Logs (OS-agnostic)
  # --------------------------------------------------------------------------
  logs|log)
    exec bash "${SCRIPT_DIR}/06-logs.sh" "$@"
    ;;

  # --------------------------------------------------------------------------
  # Redémarrage (CentOS : SELinux preflight)
  # --------------------------------------------------------------------------
  restart)
    exec bash "${SCRIPT_DIR}/07-restart-centos.sh" "$@"
    ;;

  # --------------------------------------------------------------------------
  # Update = rebuild + restart
  # --------------------------------------------------------------------------
  update)
    SERVICE="${1:-boson}"; shift || true
    exec bash "${SCRIPT_DIR}/07-restart-centos.sh" --service "${SERVICE}" --rebuild "$@"
    ;;

  # --------------------------------------------------------------------------
  # Statut des containers
  # --------------------------------------------------------------------------
  status|ps)
    echo -e "${BLUE}=== MoveToData — État des containers ===${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
      | grep -E "movetodata|NAME" || echo "Aucun container MoveToData trouvé"
    echo ""
    echo -e "${BLUE}=== Volumes ===${NC}"
    docker volume ls --filter name=movetodata 2>/dev/null || true
    echo ""
    echo -e "${BLUE}=== Ressources ===${NC}"
    docker stats --no-stream --format \
      "  {{.Name}}\tCPU: {{.CPUPerc}}\tMEM: {{.MemUsage}}" \
      $(docker ps -q --filter name=movetodata) 2>/dev/null || echo "  (aucun container actif)"
    ;;

  # --------------------------------------------------------------------------
  # Commandes CentOS spécifiques
  # --------------------------------------------------------------------------
  selinux)
    cmd_selinux
    ;;

  firewall)
    cmd_firewall
    ;;

  fuse)
    cmd_fuse
    ;;

  # --------------------------------------------------------------------------
  help|--help|-h|"")
    usage
    ;;

  *)
    echo -e "${RED}Commande inconnue : ${CMD}${NC}"
    usage
    exit 1
    ;;
esac
