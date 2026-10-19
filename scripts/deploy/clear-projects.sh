#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — clear-projects.sh
#
# Supprime définitivement tous les projets de la plateforme via l'API Boson.
# Utile avant un re-seed complet pour repartir d'une base propre sans
# avoir à recréer les volumes Docker.
#
# ── Configuration rapide ──────────────────────────────────────────────────────
# Modifiez ces trois lignes pour ne plus avoir à passer d'options en ligne
# de commande. Laissez vide ("") pour forcer la saisie interactive.
# -----------------------------------------------------------------------------
DEFAULT_URL="http://localhost:8080"
DEFAULT_ADMIN="platform-administrator"
DEFAULT_PASSWORD=""          # ex: "MonMotDePasse" — laisser vide = saisie interactive
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}   $*"; }
success() { echo -e "${GREEN}[OK]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }

# ─── Valeurs initiales (config > variable d'env > défaut) ─────────────────────
BASE_URL="${MTD_URL:-${DEFAULT_URL}}"
ADMIN_USER="${MTD_ADMIN:-${DEFAULT_ADMIN}}"
ADMIN_PASSWORD="${MTD_ADMIN_PASSWORD:-${DEFAULT_PASSWORD}}"
YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)       BASE_URL="${2:-}";        shift 2 ;;
    --admin)     ADMIN_USER="${2:-}";      shift 2 ;;
    --password)  ADMIN_PASSWORD="${2:-}";  shift 2 ;;
    --yes|-y)    YES=true;                 shift ;;
    *) warn "Argument inconnu : $1"; shift ;;
  esac
done

[[ -z "${ADMIN_PASSWORD}" ]] && {
  read -r -s -p "Mot de passe admin (${ADMIN_USER}) : " ADMIN_PASSWORD
  echo ""
}
[[ -z "${ADMIN_PASSWORD}" ]] && error "Mot de passe admin requis (--password ou MTD_ADMIN_PASSWORD)"

# ─── Bannière ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║       MoveToData — Suppression de tous les projets       ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "URL   : ${BASE_URL}"
info "Admin : ${ADMIN_USER}"
echo ""

# ─── Vérification que jq est disponible ──────────────────────────────────────
command -v jq &>/dev/null || error "jq est requis : sudo apt-get install -y jq"

# ─── Confirmation ─────────────────────────────────────────────────────────────
if [[ "${YES}" == "false" ]]; then
  echo -e "${RED}${BOLD}⚠  Tous les projets seront supprimés définitivement.${NC}"
  echo -e "   Les sources, datasets et dashboards associés seront perdus."
  echo ""
  read -r -p "Confirmer la suppression ? [y/N] " CONFIRM
  [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]] && info "Annulé." && exit 0
fi

# ─── Authentification ─────────────────────────────────────────────────────────
info "Authentification..."
# Build JSON payload via jq to handle special characters in password safely.
LOGIN_PAYLOAD=$(jq -n \
  --arg u "${ADMIN_USER}" \
  --arg p "${ADMIN_PASSWORD}" \
  '{"username":$u,"password":$p,"loginType":"plain"}')

LOGIN_HTTP_STATUS=""
LOGIN_RESP=$(curl -s -o /tmp/_mtd_login_resp.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/passport/login" \
  -H "Content-Type: application/json" \
  -d "${LOGIN_PAYLOAD}" 2>/dev/null) || true
LOGIN_HTTP_STATUS="${LOGIN_RESP}"
LOGIN_RESP=$(cat /tmp/_mtd_login_resp.json 2>/dev/null || echo "")
rm -f /tmp/_mtd_login_resp.json

if [[ "${LOGIN_HTTP_STATUS}" == "000" ]] || [[ -z "${LOGIN_HTTP_STATUS}" ]]; then
  error "Connexion refusée — ${BASE_URL} est inaccessible (vérifiez que les conteneurs tournent ou utilisez --url)"
fi
if [[ "${LOGIN_HTTP_STATUS}" != 2* ]]; then
  error "Authentification échouée (HTTP ${LOGIN_HTTP_STATUS}) — réponse : ${LOGIN_RESP}"
fi

TOKEN=$(echo "${LOGIN_RESP}" | jq -r '.accessToken // .token // empty' 2>/dev/null)
[[ -z "${TOKEN}" ]] && error "Authentification échouée — pas de token dans la réponse : ${LOGIN_RESP}"
success "Connecté en tant que ${ADMIN_USER}"

# ─── Récupération de la liste des projets ─────────────────────────────────────
info "Récupération des projets..."
PROJECTS_HTTP_STATUS=""
PROJECTS_RESP=$(curl -s -o /tmp/_mtd_projects_resp.json -w "%{http_code}" \
  "${BASE_URL}/kitab/project/all" \
  -H "Authorization: Bearer ${TOKEN}" 2>/dev/null) || true
PROJECTS_HTTP_STATUS="${PROJECTS_RESP}"
PROJECTS_RESP=$(cat /tmp/_mtd_projects_resp.json 2>/dev/null || echo "")
rm -f /tmp/_mtd_projects_resp.json
[[ "${PROJECTS_HTTP_STATUS}" != 2* ]] && error "Impossible de lister les projets (HTTP ${PROJECTS_HTTP_STATUS}) — ${PROJECTS_RESP}"

PROJECT_IDS=$(echo "${PROJECTS_RESP}" | jq -r '.[].id // .[].uuid // .[].resourceId // empty' 2>/dev/null)

if [[ -z "${PROJECT_IDS}" ]]; then
  success "Aucun projet à supprimer."
  exit 0
fi

COUNT=$(echo "${PROJECT_IDS}" | wc -l | tr -d ' ')
info "${COUNT} projet(s) trouvé(s)"

# ─── Suppression définitive de chaque projet ──────────────────────────────────
DELETED=0
FAILED=0

while IFS= read -r id; do
  [[ -z "${id}" ]] && continue

  HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X DELETE \
    "${BASE_URL}/kitab/${id}/permanentDelete" \
    -H "Authorization: Bearer ${TOKEN}" \
    2>/dev/null) || HTTP_STATUS="000"

  if [[ "${HTTP_STATUS}" =~ ^2 ]]; then
    success "Supprimé : ${id}"
    DELETED=$(( DELETED + 1 ))
  else
    warn "Échec (HTTP ${HTTP_STATUS}) : ${id}"
    FAILED=$(( FAILED + 1 ))
  fi
done <<< "${PROJECT_IDS}"

# ─── Résumé ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║            Suppression terminée                          ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Supprimés : ${BOLD}${DELETED}${NC}"
[[ "${FAILED}" -gt 0 ]] && echo -e "  ${RED}Échoués  : ${FAILED}${NC}"
echo ""

[[ "${FAILED}" -gt 0 ]] && exit 1 || exit 0
