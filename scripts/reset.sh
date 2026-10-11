#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — reset.sh
#
# Réinitialise complètement la plateforme puis reseed les données de démo.
#
# Usage :
#   bash reset.sh --hard   --url https://movetodata.io --password <pwd>
#   bash reset.sh --soft   --url https://movetodata.io --password <pwd>
#
# Modes :
#   --hard   Wipe Docker complet (volumes supprimés) + redémarrage + seed
#            → État neuf, aucune donnée conservée
#   --soft   Seed uniquement (ne touche pas aux conteneurs ni aux volumes)
#            → Recharge utilisateurs et cas d'usage sans interruption de service
#
# Options :
#   --url       URL de la plateforme  (défaut : http://localhost:8081)
#   --password  Mot de passe admin    (ou variable MTD_ADMIN_PASSWORD)
#   --admin     Username admin        (défaut : platform-administrator)
#   --stack     Stacks à redémarrer   (défaut : all, valeurs : core|snap|tycho|all)
#   --skip-scenarios   Ne pas lancer les scénarios Playwright
#   --skip-demo        Ne pas lancer demo-setup.sh
#   --yes       Passer toutes les confirmations (mode non-interactif)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/deploy"
SEED_DIR="${SCRIPT_DIR}/seed"
E2E_DIR="${REPO_ROOT}/Docs/tests/playwright"

# ─── Couleurs ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}   $*"; }
success() { echo -e "${GREEN}[OK]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }
section() { echo -e "\n${CYAN}${BOLD}═══ $* ═══${NC}"; }
step()    { echo -e "\n${CYAN}─── $* ───${NC}"; }

# ─── Valeurs par défaut ───────────────────────────────────────────────────────
MODE=""
BASE_URL="${MTD_URL:-http://localhost:8081}"
ADMIN_USER="${MTD_ADMIN:-platform-administrator}"
ADMIN_PASSWORD="${MTD_ADMIN_PASSWORD:-}"
STACK="all"
SKIP_SCENARIOS=false
SKIP_DEMO=false
YES=false

# ─── Parsing des arguments ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --hard)            MODE="hard";           shift ;;
    --soft)            MODE="soft";           shift ;;
    --url)             BASE_URL="$2";         shift 2 ;;
    --password)        ADMIN_PASSWORD="$2";   shift 2 ;;
    --admin)           ADMIN_USER="$2";       shift 2 ;;
    --stack)           STACK="$2";            shift 2 ;;
    --skip-scenarios)  SKIP_SCENARIOS=true;   shift ;;
    --skip-demo)       SKIP_DEMO=true;        shift ;;
    --yes|-y)          YES=true;              shift ;;
    *) warn "Argument inconnu : $1"; shift ;;
  esac
done

# ─── Validation ───────────────────────────────────────────────────────────────
[[ -z "${MODE}" ]] && {
  echo ""
  echo -e "${BOLD}Usage :${NC}"
  echo "  bash reset.sh --hard   --url <url> --password <pwd>   # wipe complet + redémarrage + seed"
  echo "  bash reset.sh --soft   --url <url> --password <pwd>   # seed uniquement (sans interruption)"
  echo ""
  echo -e "${BOLD}Options :${NC}"
  echo "  --admin <user>         Username admin (défaut: platform-administrator)"
  echo "  --stack <stack>        core|snap|tycho|all (défaut: all, hard uniquement)"
  echo "  --skip-scenarios       Ne pas lancer les scénarios Playwright"
  echo "  --skip-demo            Ne pas lancer demo-setup.sh"
  echo "  --yes                  Passer les confirmations (non-interactif)"
  echo ""
  exit 1
}

[[ -z "${ADMIN_PASSWORD}" ]] && {
  read -r -s -p "Mot de passe admin (${ADMIN_USER}) : " ADMIN_PASSWORD
  echo ""
}
[[ -z "${ADMIN_PASSWORD}" ]] && error "Mot de passe admin requis (--password ou MTD_ADMIN_PASSWORD)"

# ─── Bannière ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
if [[ "${MODE}" == "hard" ]]; then
  echo -e "${CYAN}${BOLD}║       MoveToData — Reset HARD (wipe complet)             ║${NC}"
else
  echo -e "${CYAN}${BOLD}║       MoveToData — Reset SOFT (seed uniquement)          ║${NC}"
fi
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Mode       : ${BOLD}${MODE}${NC}"
info "URL        : ${BASE_URL}"
info "Admin      : ${ADMIN_USER}"
[[ "${MODE}" == "hard" ]] && info "Stack      : ${STACK}"
info "Scénarios  : $(${SKIP_SCENARIOS} && echo 'ignorés' || echo 'activés')"
info "Demo setup : $(${SKIP_DEMO} && echo 'ignoré' || echo 'activé')"
echo ""

# ─── Confirmation ─────────────────────────────────────────────────────────────
if [[ "${MODE}" == "hard" ]] && [[ "${YES}" == "false" ]]; then
  echo -e "${RED}${BOLD}⚠  MODE HARD — Toutes les données Docker seront supprimées.${NC}"
  echo -e "   Volumes supprimés : bases PostgreSQL, Redis, artefacts Snap, Superset."
  echo ""
  read -r -p "Confirmer le wipe complet ? [y/N] " CONFIRM
  [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]] && info "Annulé." && exit 0
fi

# =============================================================================
# ÉTAPE 1 — WIPE (mode hard uniquement)
# =============================================================================
if [[ "${MODE}" == "hard" ]]; then
  section "Étape 1/5 — Wipe Docker"

  step "Arrêt et suppression des volumes (stack: ${STACK})"
  bash "${DEPLOY_DIR}/04-stop.sh" --stack "${STACK}" --volumes <<< "y"
  success "Volumes Docker supprimés"

  step "Nettoyage des images orphelines"
  docker image prune -f 2>/dev/null || true
  success "Images orphelines supprimées"
fi

# =============================================================================
# ÉTAPE 2 — REDÉMARRAGE (mode hard uniquement)
# =============================================================================
if [[ "${MODE}" == "hard" ]]; then
  section "Étape 2/5 — Redémarrage de la plateforme"

  bash "${DEPLOY_DIR}/03-start.sh" --stack "${STACK}"
  success "Plateforme redémarrée"

  step "Attente que l'API Boson soit prête (max 3 min)..."
  local_attempt=0
  until curl -sf "${BASE_URL}/api/endpoints/health" 2>/dev/null | grep -q "UP\|OK\|healthy" || \
        curl -sf "${BASE_URL}/api/endpoints/health" &>/dev/null; do
    local_attempt=$(( local_attempt + 1 ))
    if [[ ${local_attempt} -ge 36 ]]; then
      warn "API Boson pas encore prête après 3 min — la suite peut échouer"
      break
    fi
    printf "."
    sleep 5
  done
  echo ""
  success "API Boson accessible"
fi

# Pour le mode soft : vérifier que la plateforme est bien accessible
if [[ "${MODE}" == "soft" ]]; then
  section "Étape 1/3 — Vérification de la plateforme"
  if curl -sf "${BASE_URL}/api/endpoints/health" &>/dev/null; then
    success "Plateforme accessible : ${BASE_URL}"
  else
    error "Plateforme inaccessible : ${BASE_URL}\n  Démarrez-la d'abord : bash ${DEPLOY_DIR}/03-start.sh"
  fi
fi

# =============================================================================
# ÉTAPE 3 — SEED UTILISATEURS
# =============================================================================
if [[ "${MODE}" == "hard" ]]; then
  section "Étape 3/5 — Seed utilisateurs"
else
  section "Étape 2/3 — Seed utilisateurs"
fi

SEED_USERS_SCRIPT="${SEED_DIR}/seed-users.ts"
if [[ -f "${SEED_USERS_SCRIPT}" ]]; then
  if command -v npx &>/dev/null; then
    npx ts-node "${SEED_USERS_SCRIPT}" \
      --url "${BASE_URL}" \
      --admin "${ADMIN_USER}" \
      --password "${ADMIN_PASSWORD}"
    success "Utilisateurs seedés"
  else
    warn "npx introuvable — seed utilisateurs ignoré"
    warn "  Installez Node.js puis : npx ts-node ${SEED_USERS_SCRIPT} --url ${BASE_URL} --admin ${ADMIN_USER} --password <pwd>"
  fi
else
  warn "seed-users.ts introuvable : ${SEED_USERS_SCRIPT}"
fi

# =============================================================================
# ÉTAPE 4 — DEMO SETUP (projet Performance Financière)
# =============================================================================
if [[ "${MODE}" == "hard" ]]; then
  section "Étape 4/5 — Démo Performance Financière 2024"
else
  section "Étape 3/3 — Démo Performance Financière 2024"
fi

if [[ "${SKIP_DEMO}" == "false" ]]; then
  DEMO_SCRIPT="${SEED_DIR}/demo-setup.sh"
  CSV_DEMO="${SCRIPT_DIR}/demo_transactions_financieres_2024.csv"

  if [[ -f "${DEMO_SCRIPT}" ]]; then
    DEMO_ARGS=(--url "${BASE_URL}" --user "${ADMIN_USER}" --password "${ADMIN_PASSWORD}")
    [[ -f "${CSV_DEMO}" ]] && DEMO_ARGS+=(--csv "${CSV_DEMO}")

    bash "${DEMO_SCRIPT}" "${DEMO_ARGS[@]}" && success "Démo Performance Financière créée" \
      || warn "demo-setup.sh a rencontré des erreurs (données peut-être déjà présentes)"
  else
    warn "demo-setup.sh introuvable : ${DEMO_SCRIPT}"
  fi
else
  info "demo-setup.sh ignoré (--skip-demo)"
fi

# =============================================================================
# ÉTAPE 5 — CAS D'USAGE SECTORIELS (Playwright F-SCENARIOS)
# =============================================================================
if [[ "${MODE}" == "hard" ]]; then
  STEP_LABEL="Étape 5/5"
fi

if [[ "${SKIP_SCENARIOS}" == "false" ]]; then
  [[ "${MODE}" == "hard" ]] && section "${STEP_LABEL} — Utilisateurs, groupes et cas d'usage (Playwright)"

  if [[ -d "${E2E_DIR}" ]] && [[ -f "${E2E_DIR}/package.json" ]]; then
    if command -v npm &>/dev/null; then
      step "Installation des dépendances Playwright si nécessaire..."
      ( cd "${E2E_DIR}" && npm install --silent 2>/dev/null ) || true

      # ── Sous-étape A : créer utilisateurs et groupes ────────────────────────
      step "Création des utilisateurs et groupes (F-ADMIN)..."
      (
        cd "${E2E_DIR}"
        BASE_URL="${BASE_URL}" \
        TEST_USER="${ADMIN_USER}" \
        TEST_PASSWORD="${ADMIN_PASSWORD}" \
        npm run test:admin 2>&1
      ) && success "Utilisateurs et groupes créés/vérifiés" \
        || warn "F-ADMIN : certains tests ont échoué — vérifiez les logs ci-dessus"

      # ── Sous-étape B : créer les cas d'usage sectoriels ─────────────────────
      step "Lancement des scénarios sectoriels (F-SCENARIOS)..."
      (
        cd "${E2E_DIR}"
        BASE_URL="${BASE_URL}" \
        TEST_USER="${ADMIN_USER}" \
        TEST_PASSWORD="${ADMIN_PASSWORD}" \
        npm run test:scenarios 2>&1
      ) && success "Scénarios sectoriels créés (Retail, Tech, Manufacturing, Finance)" \
        || warn "F-SCENARIOS : certains scénarios ont échoué — la plateforme reste opérationnelle"
    else
      warn "npm introuvable — étapes Playwright ignorées"
      warn "  Installez Node.js puis :"
      warn "    cd ${E2E_DIR} && npm run test:admin && npm run test:scenarios"
    fi
  else
    warn "Dossier Playwright introuvable : ${E2E_DIR}"
  fi
else
  info "Étapes Playwright ignorées (--skip-scenarios)"
fi

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║          Plateforme MoveToData réinitialisée ✓           ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Mode        : ${BOLD}${MODE}${NC}"
echo -e "  URL         : ${BASE_URL}"
echo ""
echo -e "  ${BOLD}Comptes disponibles :${NC}"
echo -e "    platform-administrator / <votre mot de passe>"
echo -e "    admin          / Admin2024!"
echo -e "    dataops        / Dataops2024!"
echo -e "    dataviz        / Dataviz2024!"
echo -e "    expl.marseille / Marseille2024!"
echo -e "    expl.rennes    / Rennes2024!"
echo -e "    codir          / Codir2024!"
echo -e "    svc.bi         / SvcBI2024!"
echo ""
echo -e "  ${BOLD}Cas d'usage sectoriels :${NC}"
${SKIP_SCENARIOS} && echo -e "    (ignorés -- relancer sans --skip-scenarios)" || {
  echo -e "    ✓ Retail & Commerce       (CA, Marge, Panier Moyen)"
  echo -e "    ✓ Tech & SaaS             (MRR, Churn, NPS)"
  echo -e "    ✓ Industrie & Manufacturing (OEE, Défauts, Temps d'Arrêt)"
  echo -e "    ✓ Finance & Gestion       (EBITDA, Burn Rate, Runway)"
}
echo ""
echo -e "  ${BOLD}Commandes utiles :${NC}"
echo -e "    Healthcheck   : bash ${DEPLOY_DIR}/05-healthcheck.sh"
echo -e "    Logs Boson    : docker logs movetodata-boson --tail 100 -f"
echo -e "    Tests E2E     : cd ${E2E_DIR} && npm test"
if [[ "${MODE}" == "hard" ]]; then
  echo -e "    Arrêt propre  : bash ${DEPLOY_DIR}/04-stop.sh"
fi
echo ""
