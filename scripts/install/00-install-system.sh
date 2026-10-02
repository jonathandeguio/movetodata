#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Script 00 : Installation système Ubuntu 22.04 / 24.04 LTS
# Cible : VM Ubuntu propre, exécuté en tant que root ou sudo
# Usage : sudo bash 00-install-system.sh
#
# Chemins :
#   Application : /opt/movetodata      (code source / scripts)
#   Données     : /opt/movetodata/data (volumes Docker : postgres, redis, frontend…)
#   Config      : /etc/movetodata      (saml.yml, certificats…)
# =============================================================================
set -euo pipefail

MOVETODATA_INSTALL_DIR="/opt/movetodata"
MOVETODATA_DATA="${MOVETODATA_INSTALL_DIR}/data"
MOVETODATA_USER="movetodata"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}    $*"; }
success() { echo -e "${GREEN}[OK]${NC}      $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC}   $*"; exit 1; }
section() { echo -e "\n${CYAN}─── $* ───${NC}"; }

[[ $EUID -ne 0 ]] && error "Ce script doit être exécuté en root : sudo bash $0"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   MoveToData Platform — Installation Ubuntu      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
section "1/7 — Mise à jour du système"
# =============================================================================
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip tar \
  build-essential libssl-dev \
  ca-certificates gnupg lsb-release \
  apt-transport-https software-properties-common \
  fuse openssl jq net-tools \
  python3-pip \
  vim htop

success "Paquets système installés"

# =============================================================================
section "2/7 — Installation de Docker Engine"
# =============================================================================
if command -v docker &>/dev/null; then
  warn "Docker déjà installé : $(docker --version)"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io docker-compose-plugin

  systemctl enable docker
  systemctl start docker
  success "Docker $(docker --version) installé"
fi

# =============================================================================
section "3/7 — Création de l'utilisateur movetodata"
# =============================================================================
if id "${MOVETODATA_USER}" &>/dev/null; then
  warn "Utilisateur ${MOVETODATA_USER} existe déjà"
else
  useradd -m -s /bin/bash "${MOVETODATA_USER}"
  success "Utilisateur ${MOVETODATA_USER} créé"
fi

usermod -aG docker "${MOVETODATA_USER}"
success "Utilisateur ${MOVETODATA_USER} ajouté au groupe docker"

# =============================================================================
section "4/7 — Création de l'arborescence dans /opt/movetodata"
# =============================================================================
# Répertoire d'installation principal
mkdir -p "${MOVETODATA_INSTALL_DIR}"

# Répertoires de données (volumes Docker)
mkdir -p \
  "${MOVETODATA_DATA}/postgres/boson" \
  "${MOVETODATA_DATA}/postgres/tycho" \
  "${MOVETODATA_DATA}/redis" \
  "${MOVETODATA_DATA}/boson/logs/accessLogs" \
  "${MOVETODATA_DATA}/boson/data" \
  "${MOVETODATA_DATA}/dataset" \
  "${MOVETODATA_DATA}/file" \
  "${MOVETODATA_DATA}/repositories" \
  "${MOVETODATA_DATA}/spark-streaming" \
  "${MOVETODATA_DATA}/snap/artifactory" \
  "${MOVETODATA_DATA}/snap/logs" \
  "${MOVETODATA_DATA}/snap/db/data" \
  "${MOVETODATA_DATA}/snap/db/dbscripts" \
  "${MOVETODATA_DATA}/tycho/superset_home" \
  "${MOVETODATA_DATA}/frontend/build" \
  "${MOVETODATA_DATA}/ssl/certs" \
  "${MOVETODATA_DATA}/ssl/keys" \
  /etc/movetodata

chown -R "${MOVETODATA_USER}:${MOVETODATA_USER}" "${MOVETODATA_INSTALL_DIR}"
chown -R "${MOVETODATA_USER}:${MOVETODATA_USER}" /etc/movetodata
chmod -R 755 "${MOVETODATA_INSTALL_DIR}"

success "Arborescence ${MOVETODATA_INSTALL_DIR} créée"

# =============================================================================
section "5/7 — Configuration du module FUSE (requis par Snap)"
# =============================================================================
modprobe fuse 2>/dev/null || warn "Module FUSE déjà chargé ou non disponible"
if ! grep -q "^fuse$" /etc/modules 2>/dev/null; then
  echo "fuse" >> /etc/modules
fi
success "FUSE configuré"

# =============================================================================
section "6/7 — Optimisation kernel et limites système"
# =============================================================================
cat > /etc/sysctl.d/99-movetodata.conf << 'EOF'
# MoveToData platform — kernel tuning
vm.max_map_count=262144
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
fs.file-max=1048576
EOF
sysctl --system -q
success "Paramètres kernel appliqués (vm.max_map_count, fs.file-max)"

cat > /etc/security/limits.d/movetodata.conf << 'EOF'
movetodata soft nofile 65536
movetodata hard nofile 65536
movetodata soft nproc  65536
movetodata hard nproc  65536
root   soft nofile 65536
root   hard nofile 65536
EOF
success "Limites ulimit configurées"

# =============================================================================
section "7/7 — Fichier SAML minimal + résumé"
# =============================================================================
if [[ ! -f /etc/movetodata/saml.yml ]]; then
  cat > /etc/movetodata/saml.yml << 'EOF'
# =============================================================================
# MoveToData Platform — Configuration SAML SSO
# platform-default-login : password | saml2
#   - password : authentification locale (par défaut)
#   - saml2    : authentification via un IdP SAML (Azure AD, Okta…)
# Si vous n'utilisez pas le SSO SAML, conservez platform-default-login: password
# =============================================================================
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
              entity-id: http://movetodata.io
            entity-id: http://movetodata.io
            acs:
              location: ${BASE_URL}/api/sso/callback
EOF
  success "Fichier /etc/movetodata/saml.yml créé"
fi

# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Installation système MoveToData terminée       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "Répertoires créés :"
echo "  Application : ${MOVETODATA_INSTALL_DIR}/"
echo "  Données     : ${MOVETODATA_DATA}/"
echo "  Config      : /etc/movetodata/"
echo ""
info "Prochaines étapes :"
echo "  1. Cloner le repo dans ${MOVETODATA_INSTALL_DIR} (si pas déjà fait) :"
echo "     git clone <repo_url> ${MOVETODATA_INSTALL_DIR}"
echo ""
echo "  2. Configurer l'environnement :"
echo "     cd ${MOVETODATA_INSTALL_DIR}/scripts && bash 01-setup-env.sh"
echo ""
warn "Ports à ouvrir si UFW est actif :"
echo "  ufw allow 80/tcp    # Frontend"
echo "  ufw allow 8080/tcp  # API Boson"
echo "  ufw allow 8082/tcp  # Snap (optionnel)"
echo "  ufw allow 8088/tcp  # Tycho/Superset (optionnel)"
echo ""
