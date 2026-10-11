#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — wipe.sh
#
# Réinitialise complètement la plateforme en conservant uniquement le compte
# "platform-administrator" (recréé automatiquement par l'application au
# premier démarrage via Flyway + logique d'initialisation Boson).
#
# Ce script supprime :
#   - Tous les volumes Docker (base PostgreSQL, Redis, artefacts Snap/Tycho)
#   - Tous les utilisateurs de démo (admin, dataops, dataviz, etc.)
#   - Tous les projets, sources, dashboards et fichiers uploadés
#
# Il conserve / recrée :
#   - Le compte "platform-administrator" avec le mot de passe existant
#   - La structure de la base (schéma Flyway)
#   - Les conteneurs Docker (reconstruits à partir des images)
#
# Usage :
#   bash wipe.sh --password <pwd>
#   bash wipe.sh --password <pwd> --stack core --url https://movetodata.io
#   bash wipe.sh --password <pwd> --yes
#
# Options :
#   --password   Mot de passe du compte platform-administrator (requis)
#   --url        URL de la plateforme pour le healthcheck (défaut : http://localhost:8081)
#   --admin      Username admin (défaut : platform-administrator)
#   --stack      core|snap|tycho|all (défaut : all)
#   --yes        Passer la confirmation interactive
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}   $*"; }
success() { echo -e "${GREEN}[OK]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }
section() { echo -e "\n${CYAN}${BOLD}═══ $* ═══${NC}"; }
step()    { echo -e "\n${CYAN}─── $* ───${NC}"; }

# ─── Valeurs par défaut ───────────────────────────────────────────────────────
BASE_URL="${MTD_URL:-http://localhost:8081}"
ADMIN_USER="${MTD_ADMIN:-platform-administrator}"
ADMIN_PASSWORD="${MTD_ADMIN_PASSWORD:-}"
STACK="all"
YES=false

# ─── Parsing des arguments ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --password) ADMIN_PASSWORD="${2:-}"; shift 2 ;;
    --url)      BASE_URL="${2:-}";       shift 2 ;;
    --admin)    ADMIN_USER="${2:-}";     shift 2 ;;
    --stack)    STACK="${2:-}";          shift 2 ;;
    --yes|-y)   YES=true;            shift ;;
    *) warn "Argument inconnu : $1"; shift ;;
  esac
done

# ─── Mot de passe obligatoire ─────────────────────────────────────────────────
[[ -z "${ADMIN_PASSWORD}" ]] && {
  read -r -s -p "Mot de passe platform-administrator : " ADMIN_PASSWORD
  echo ""
}
[[ -z "${ADMIN_PASSWORD}" ]] && error "Mot de passe requis (--password ou MTD_ADMIN_PASSWORD)"

# ─── Bannière ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║     MoveToData — WIPE COMPLET (platform-admin conservé) ║${NC}"
echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "URL    : ${BASE_URL}"
info "Admin  : ${ADMIN_USER}"
info "Stack  : ${STACK}"
echo ""
echo -e "${RED}${BOLD}⚠  ATTENTION — Données supprimées définitivement :${NC}"
echo -e "   • Base PostgreSQL complète (utilisateurs, projets, sources, dashboards)"
echo -e "   • Volumes Redis"
echo -e "   • Artefacts Snap/Tycho"
echo -e "   • Fichiers uploadés (stockage)"
echo ""
echo -e "${GREEN}   Conservé / recréé automatiquement :${NC}"
echo -e "   • Compte platform-administrator (${ADMIN_USER})"
echo -e "   • Schéma de base (migrations Flyway)"
echo ""

# ─── Confirmation ─────────────────────────────────────────────────────────────
if [[ "${YES}" == "false" ]]; then
  read -r -p "Confirmer le wipe complet ? [y/N] " CONFIRM
  [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]] && info "Annulé." && exit 0
fi

# =============================================================================
# ÉTAPE 1 — ARRÊT + SUPPRESSION DES VOLUMES
# =============================================================================
section "Étape 1/3 — Wipe Docker (stack : ${STACK})"

if [[ ! -f "${DEPLOY_DIR}/04-stop.sh" ]]; then
  error "Script 04-stop.sh introuvable : ${DEPLOY_DIR}/04-stop.sh"
fi

step "Arrêt et suppression des volumes..."
bash "${DEPLOY_DIR}/04-stop.sh" --stack "${STACK}" --volumes <<< "y"
success "Volumes supprimés — base de données effacée"

step "Nettoyage des images orphelines..."
docker image prune -f 2>/dev/null || true
success "Images nettoyées"

# =============================================================================
# ÉTAPE 2 — REDÉMARRAGE
# =============================================================================
section "Étape 2/3 — Redémarrage de la plateforme"

if [[ ! -f "${DEPLOY_DIR}/03-start.sh" ]]; then
  error "Script 03-start.sh introuvable : ${DEPLOY_DIR}/03-start.sh"
fi

bash "${DEPLOY_DIR}/03-start.sh" --stack "${STACK}"
success "Plateforme redémarrée"

# =============================================================================
# ÉTAPE 3 — ATTENTE HEALTHCHECK
# =============================================================================
section "Étape 3/3 — Attente que la plateforme soit prête"

step "Healthcheck API Boson (max 5 min)..."
attempt=0
until curl -sf "${BASE_URL}/api/endpoints/health" 2>/dev/null | grep -q "UP\|OK\|healthy" || \
      curl -sf "${BASE_URL}/api/endpoints/health" &>/dev/null; do
  attempt=$(( attempt + 1 ))
  if [[ ${attempt} -ge 60 ]]; then
    warn "API Boson pas encore prête après 5 min"
    warn "  Vérifiez les logs : docker logs movetodata-boson --tail 50"
    break
  fi
  printf "."
  sleep 5
done
echo ""

# Vérification que platform-administrator est opérationnel
step "Vérification du compte platform-administrator..."
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/api/passport/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASSWORD}\",\"loginType\":\"plain\"}" \
  2>/dev/null || echo "000")

if [[ "${HTTP_CODE}" == "200" ]]; then
  success "Compte ${ADMIN_USER} opérationnel (login OK)"
else
  warn "Login ${ADMIN_USER} : HTTP ${HTTP_CODE}"
  warn "  Si l'application initialise le compte admin au 1er démarrage,"
  warn "  attendez quelques secondes et relancez :"
  warn "    curl -X POST ${BASE_URL}/api/passport/login \\"
  warn "      -H 'Content-Type: application/json' \\"
  warn "      -d '{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASSWORD}\",\"loginType\":\"plain\"}'"
fi

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║          MoveToData — Plateforme réinitialisée ✓         ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  URL            : ${BASE_URL}"
echo -e "  Compte actif   : ${BOLD}${ADMIN_USER}${NC} / <votre mot de passe>"
echo ""
echo -e "  ${BOLD}Plateforme vierge — aucun utilisateur de démo, aucun projet.${NC}"
echo ""
echo -e "  ${BOLD}Pour reseed les utilisateurs et scénarios :${NC}"
echo -e "    bash ${SCRIPT_DIR}/reset.sh --soft --password <pwd>   # depuis scripts/deploy/"
echo ""
echo -e "  ${BOLD}Commandes utiles :${NC}"
echo -e "    Healthcheck : bash ${DEPLOY_DIR}/05-healthcheck.sh"
echo -e "    Logs Boson  : docker logs movetodata-boson --tail 100 -f"
echo ""
