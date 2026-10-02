#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 01 : Génération du fichier d'environnement
# Usage : bash 01-setup-env.sh
# Génère : scripts/.env.movetodata (à protéger — contient des secrets)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
ask()     { echo -e "${YELLOW}[INPUT]${NC} $*"; }

# -----------------------------------------------------------------------------
info "=== Génération du fichier d'environnement MoveToData ==="
# -----------------------------------------------------------------------------

if [[ -f "${ENV_FILE}" ]]; then
  warn "Le fichier ${ENV_FILE} existe déjà."
  ask "Voulez-vous le régénérer ? [y/N]"
  read -r CONFIRM
  [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]] && info "Abandon." && exit 0
fi

# --- Génération des secrets cryptographiques ---
info "Génération des secrets JWT..."
TOKEN_SECRET=$(openssl rand -hex 64)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 64)

# --- Demande des paramètres obligatoires ---
echo ""
ask "URL publique de la plateforme MoveToData — IP/domaine interne (ex: http://192.168.1.41) :"
read -r BASE_URL
[[ -z "${BASE_URL}" ]] && BASE_URL="http://localhost:8080"

ask "URL externe de la plateforme (ex: http://88.168.x.x:21000) — laisser vide si identique ou pas d'accès externe :"
read -r EXTERNAL_URL

ask "Mot de passe PostgreSQL pour Boson [défaut: généré aléatoirement] :"
read -r -s BOSON_DB_PASSWORD
[[ -z "${BOSON_DB_PASSWORD}" ]] && BOSON_DB_PASSWORD=$(openssl rand -base64 24)

ask "Mot de passe PostgreSQL pour Snap [défaut: généré aléatoirement] :"
read -r -s SNAP_DB_PASSWORD
[[ -z "${SNAP_DB_PASSWORD}" ]] && SNAP_DB_PASSWORD=$(openssl rand -base64 24)

ask "Mot de passe PostgreSQL pour Tycho/Superset [défaut: généré aléatoirement] :"
read -r -s TYCHO_DB_PASSWORD
[[ -z "${TYCHO_DB_PASSWORD}" ]] && TYCHO_DB_PASSWORD=$(openssl rand -base64 24)

ask "GitHub Personal Access Token (PAT) pour Snap [optionnel, appuyer Entrée pour ignorer] :"
read -r -s GITHUB_PAT
[[ -z "${GITHUB_PAT}" ]] && GITHUB_PAT="CHANGEME_github_pat"

SUPERSET_SECRET_KEY=$(openssl rand -base64 42)
FRONTEND_DOMAIN="${BASE_URL}"

# Construit la liste des origines autorisées (interne + externe si fournie)
if [[ -n "${EXTERNAL_URL}" ]]; then
  ALLOWED_ORIGINS_VALUE="${FRONTEND_DOMAIN},${EXTERNAL_URL},http://localhost:3000,http://localhost:8080"
else
  ALLOWED_ORIGINS_VALUE="${FRONTEND_DOMAIN},http://localhost:3000,http://localhost:8080"
fi

# --- Écriture du fichier d'environnement ---
cat > "${ENV_FILE}" << EOF
# =============================================================================
# MoveToData Platform — Variables d'environnement
# Généré le : $(date '+%Y-%m-%d %H:%M:%S')
# ATTENTION : ce fichier contient des secrets — ne pas committer dans git
# =============================================================================

# --- Général ---
MOVETODATA_MOUNT_PATH=/opt/movetodata/data
BASE_URL=${BASE_URL}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS_VALUE}

# --- JWT / Auth Boson ---
TOKEN_SECRET=${TOKEN_SECRET}
TOKEN_EXPIRATION=604800000
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}

# --- Base de données Boson ---
BOSON_DB_HOST=boson-db
BOSON_DB_PORT=5432
BOSON_DB_NAME=boson
BOSON_DB_USERNAME=movetodata
BOSON_DB_PASSWORD=${BOSON_DB_PASSWORD}

# --- Base de données Snap ---
SNAP_DB_HOST=snap-db
SNAP_DB_PORT=5432
SNAP_DB_NAME=postgres
SNAP_DB_USERNAME=postgres
SNAP_DB_PASSWORD=${SNAP_DB_PASSWORD}

# --- Base de données Tycho (Superset) ---
TYCHO_DB_HOST=tycho-db
TYCHO_DB_PORT=5432
TYCHO_DB_NAME=superset
TYCHO_DB_USERNAME=superset
TYCHO_DB_PASSWORD=${TYCHO_DB_PASSWORD}

# --- Redis ---
REDIS_HOST=movetodata-redis
REDIS_PORT=6379

# --- Tycho / Superset ---
SUPERSET_SECRET_KEY=${SUPERSET_SECRET_KEY}
SUPERSET_PORT=8088
FLASK_ENV=production
SUPERSET_ENV=production
SUPERSET_LOAD_EXAMPLES=no

# --- Snap ---
ARTIFACT_STORE=/movetodata/snap/artifactory
SNAP_LOG_FILE_PATH=/movetodata/snap/logs
SNAP_TOKEN_SECRET=${TOKEN_SECRET}
SNAP_TOKEN_EXPIRATION=604800000
GITHUB_PAT=${GITHUB_PAT}

# --- SAML SSO ---
SAML2_SSO_CONFIG=file:/etc/movetodata/saml.yml

# --- Swagger (désactiver en prod) ---
SWAGGER_UI=false

# --- OAuth2 (à remplacer avec les vrais credentials MoveToData) ---
GITHUB_OAUTH_CLIENT_ID=CHANGEME_github_oauth_client_id
GITHUB_OAUTH_CLIENT_SECRET=CHANGEME_github_oauth_client_secret
GOOGLE_OAUTH_CLIENT_ID=CHANGEME_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=CHANGEME_google_oauth_client_secret
EOF

chmod 600 "${ENV_FILE}"

success "Fichier d'environnement généré : ${ENV_FILE}"
warn "Ce fichier est confidentiel — vérifiez que .env.movetodata est dans .gitignore"

# Vérifier .gitignore
GITIGNORE="${SCRIPT_DIR}/../../.gitignore"
if [[ -f "${GITIGNORE}" ]]; then
  if ! grep -q "\.env\.movetodata" "${GITIGNORE}"; then
    echo "scripts/.env.movetodata" >> "${GITIGNORE}"
    success ".env.movetodata ajouté au .gitignore"
  fi
fi

echo ""
info "Variables à compléter manuellement dans ${ENV_FILE} :"
echo "  - GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET"
echo "  - GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET"
echo "  - GITHUB_PAT (si Snap utilisé)"
echo "  - /etc/movetodata/saml.yml (si SAML SSO activé)"
echo ""
info "Prochaine étape : bash 02-build.sh"
