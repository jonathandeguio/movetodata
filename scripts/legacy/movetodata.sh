#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Point d'entrée unifié
# Usage : bash movetodata.sh <commande> [options]
#
# Commandes disponibles :
#   install    Installe les dépendances système (root requis)
#   env        Configure les variables d'environnement
#   build      Construit les images Docker
#   start      Démarre la plateforme
#   stop       Arrête la plateforme
#   restart    Redémarre un service
#   status     Affiche l'état des containers
#   health     Lance le healthcheck complet
#   logs       Affiche les logs
#   update     Rebuild + restart d'un service
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

usage() {
  cat << EOF

${BLUE}MoveToData Platform — Gestionnaire de plateforme${NC}

Usage: bash movetodata.sh <commande> [options]

Commandes:
  ${GREEN}install${NC}              Installe Docker + dépendances système (sudo requis)
  ${GREEN}env${NC}                  Configure et génère le fichier .env.movetodata
  ${GREEN}build${NC} [service]      Construit les images Docker (all|boson|frontend|snap|snap-ui|tycho)
  ${GREEN}start${NC} [stack]        Démarre la plateforme (all|core|snap|tycho)
  ${GREEN}stop${NC} [stack]         Arrête la plateforme (all|core|snap|tycho) [--volumes]
  ${GREEN}restart${NC} [service]    Redémarre un service [--rebuild]
  ${GREEN}status${NC}               Affiche l'état de tous les containers
  ${GREEN}health${NC}               Lance le healthcheck complet
  ${GREEN}logs${NC} [service]       Affiche les logs [--tail N] [--follow]
  ${GREEN}update${NC} [service]     Rebuild + redémarrage d'un service

Exemples:
  sudo bash movetodata.sh install
  bash movetodata.sh env
  bash movetodata.sh build all
  bash movetodata.sh start all
  bash movetodata.sh logs boson --follow
  bash movetodata.sh restart boson --rebuild
  bash movetodata.sh stop all

EOF
}

CMD="${1:-help}"
shift || true

case "${CMD}" in
  install)
    exec sudo bash "${SCRIPT_DIR}/00-install-system.sh" "$@"
    ;;
  env)
    exec bash "${SCRIPT_DIR}/01-setup-env.sh" "$@"
    ;;
  build)
    if [[ $# -gt 0 ]]; then
      exec bash "${SCRIPT_DIR}/02-build.sh" --service "$@"
    else
      exec bash "${SCRIPT_DIR}/02-build.sh" --service all
    fi
    ;;
  start)
    if [[ $# -gt 0 ]]; then
      exec bash "${SCRIPT_DIR}/03-start.sh" --stack "$@"
    else
      exec bash "${SCRIPT_DIR}/03-start.sh" --stack all
    fi
    ;;
  stop)
    if [[ $# -gt 0 ]]; then
      exec bash "${SCRIPT_DIR}/04-stop.sh" "$@"
    else
      exec bash "${SCRIPT_DIR}/04-stop.sh" all
    fi
    ;;
  health|healthcheck)
    exec bash "${SCRIPT_DIR}/05-healthcheck.sh" "$@"
    ;;
  logs|log)
    exec bash "${SCRIPT_DIR}/06-logs.sh" "$@"
    ;;
  restart)
    exec bash "${SCRIPT_DIR}/07-restart.sh" "$@"
    ;;
  update)
    SERVICE="${1:-boson}"; shift || true
    exec bash "${SCRIPT_DIR}/07-restart.sh" --service "${SERVICE}" --rebuild "$@"
    ;;
  status|ps)
    echo -e "${BLUE}=== MoveToData — État des containers ===${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
      | grep -E "movetodata|NAME" || echo "Aucun container MoveToData trouvé"
    echo ""
    echo -e "${BLUE}=== Volumes ===${NC}"
    docker volume ls --filter name=movetodata 2>/dev/null || true
    ;;
  help|--help|-h|"")
    usage
    ;;
  *)
    echo -e "${RED}Commande inconnue : ${CMD}${NC}"
    usage
    exit 1
    ;;
esac
