#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 00 : Création des répertoires de stockage
# Usage : sudo bash 00-setup-storage.sh
#
# À exécuter UNE SEULE FOIS avant le premier démarrage, après 01-setup-env.sh.
# Crée l'arborescence des volumes Docker et les fichiers de config système.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}   $*"; }
success() { echo -e "${GREEN}[OK]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }
section() { echo -e "\n${BLUE}─── $* ───${NC}"; }

[[ "$(id -u)" -ne 0 ]] && error "Ce script doit être exécuté avec sudo."

[[ ! -f "${ENV_FILE}" ]] && \
  error "Fichier .env.movetodata manquant.\n  Exécutez d'abord : bash 01-setup-env.sh"

set -a; source "${ENV_FILE}"; set +a

MOUNT="${MOVETODATA_MOUNT_PATH:-/opt/movetodata/data}"

# DEG-07 : BASE_URL est interpolé dans saml.yml à l'exécution de ce script.
# Sa valeur est gravée en dur dans /etc/movetodata/saml.yml.
# Si BASE_URL change ultérieurement, relancer ce script pour mettre à jour saml.yml.
if [[ -z "${BASE_URL:-}" ]]; then
  error "BASE_URL n'est pas défini dans ${ENV_FILE}.\n  Exécutez d'abord : bash 01-setup-env.sh"
fi
BASE_URL="${BASE_URL}"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MoveToData — Initialisation du stockage        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "Répertoire de stockage : ${MOUNT}"
echo ""

# =============================================================================
# 1. Arborescence des volumes Docker
# =============================================================================
section "Volumes Docker"

mkdir -p \
  "${MOUNT}/postgres/boson" \
  "${MOUNT}/postgres/tycho" \
  "${MOUNT}/redis" \
  "${MOUNT}/boson/logs/accessLogs" \
  "${MOUNT}/boson/data" \
  "${MOUNT}/dataset" \
  "${MOUNT}/file" \
  "${MOUNT}/repositories" \
  "${MOUNT}/spark-streaming" \
  "${MOUNT}/frontend/build" \
  "${MOUNT}/snap/artifactory" \
  "${MOUNT}/snap/logs" \
  "${MOUNT}/snap/db/data" \
  "${MOUNT}/snap/db/dbscripts" \
  "${MOUNT}/tycho/superset_home"

success "Arborescence créée dans ${MOUNT}"

# =============================================================================
# 2. Fichier nginx.conf (doit exister comme fichier AVANT le montage Docker)
# =============================================================================
section "nginx.conf"

NGINX_CONF="${MOUNT}/frontend/nginx.conf"
if [[ ! -f "${NGINX_CONF}" ]]; then
  touch "${NGINX_CONF}"
  success "Fichier nginx.conf créé (sera rempli par 03-start.sh) : ${NGINX_CONF}"
else
  info "nginx.conf déjà présent : ${NGINX_CONF}"
fi

# =============================================================================
# 3. Configuration SAML (/etc/movetodata/saml.yml)
# =============================================================================
section "Configuration SAML"

if [[ ! -f /etc/movetodata/saml.yml ]] || ! grep -q "relyingparty" /etc/movetodata/saml.yml 2>/dev/null; then
  mkdir -p /etc/movetodata
  cat > /etc/movetodata/saml.yml << SAML_EOF
platform-default-login: password
spring:
  security:
    saml2:
      relyingparty:
        registration:
          MoveToData-SSO:
            assertingparty:
              singlesignon:
                sign-request: false
                url: https://login.microsoftonline.com/CHANGEME_TENANT_ID/saml2
              entity-id: ${BASE_URL}
            entity-id: ${BASE_URL}
            acs:
              location: ${BASE_URL}/api/sso/callback
SAML_EOF
  chmod 640 /etc/movetodata/saml.yml
  success "/etc/movetodata/saml.yml créé"
  warn "Pensez à remplacer CHANGEME_TENANT_ID si vous utilisez Azure AD SSO"
else
  info "/etc/movetodata/saml.yml déjà présent"
fi

# =============================================================================
# 4. Permissions
# =============================================================================
section "Permissions"

chmod -R 755 "${MOUNT}"
# PostgreSQL tourne en UID 999 dans l'image officielle
chown -R 999:999 "${MOUNT}/postgres" 2>/dev/null || \
  warn "chown postgres ignoré (peut nécessiter un ajustement selon votre config)"

success "Permissions appliquées"

# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Stockage initialisé avec succès                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "Arborescence créée :"
find "${MOUNT}" -maxdepth 2 -type d | sort | sed "s|${MOUNT}|  ${MOUNT}|"
echo ""
info "Prochaine étape : bash 02-build.sh"
