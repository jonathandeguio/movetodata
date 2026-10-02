#!/usr/bin/env bash
# =============================================================================
# MoveToData Platform — Installation des composants techniques (CentOS / RHEL)
# Cible   : CentOS Stream 9 / RHEL 9 / AlmaLinux 9 / Rocky 9
# Usage   : sudo bash install-components-centos.sh [--skip java|node|python|pg|redis|nginx|kubectl]
#
# Ce script installe les runtimes et outils nécessaires à la plateforme MoveToData :
#   [1]  OpenJDK 11          — Build Boson (Spring Boot + Spark)
#   [2]  Gradle 7.6.4        — Build Java local (via SDKMAN)
#   [3]  Node.js 18 LTS      — Build Frontend React / Snap-UI
#   [4]  Yarn 3.5+           — Gestionnaire de paquets Frontend
#   [5]  Python 3.8 / 3.9    — Tycho (Superset), Callisto, scripts
#   [6]  PostgreSQL 16        — Base Snap (optionnel hors Docker)
#   [7]  Redis 7              — Cache Celery / WebSocket (optionnel hors Docker)
#   [8]  Nginx               — Reverse proxy / SPA (optionnel hors Docker)
#   [9]  Outils build        — gcc, make, libpq-devel, openssl-devel
#   [10] kubectl + Helm       — Déploiement Kubernetes (mode production)
#
# Prérequis : 00-install-system-centos.sh doit avoir été exécuté en premier.
# =============================================================================
set -euo pipefail

# --- Couleurs ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}   $*"; }
success() { echo -e "${GREEN}[OK]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }
skip()    { echo -e "${CYAN}[SKIP]${NC}   $*"; }
section() {
  echo ""
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $*${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
}

MOVETODATA_USER="${MOVETODATA_USER:-movetodata}"

# =============================================================================
# Pré-requis : root
# =============================================================================
[[ $EUID -ne 0 ]] && error "Ce script doit être exécuté en root : sudo bash $0"

# =============================================================================
# Détection OS
# =============================================================================
if [[ ! -f /etc/os-release ]]; then
  error "/etc/os-release introuvable — OS non supporté"
fi
source /etc/os-release
OS_MAJOR="${VERSION_ID%%.*}"
OS_ID="${ID:-centos}"
OS_NAME="${NAME:-CentOS}"

if [[ "${OS_MAJOR}" == "7" ]]; then
  PKG_MGR="yum"
else
  PKG_MGR="dnf"
fi

info "Système : ${OS_NAME} ${VERSION_ID} — gestionnaire : ${PKG_MGR}"

# =============================================================================
# Parsing des options --skip
# =============================================================================
SKIP_JAVA=false
SKIP_GRADLE=false
SKIP_NODE=false
SKIP_PYTHON=false
SKIP_PG=false
SKIP_REDIS=false
SKIP_NGINX=false
SKIP_KUBECTL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip)
      case "$2" in
        java)    SKIP_JAVA=true    ;;
        gradle)  SKIP_GRADLE=true  ;;
        node)    SKIP_NODE=true    ;;
        python)  SKIP_PYTHON=true  ;;
        pg|postgresql) SKIP_PG=true ;;
        redis)   SKIP_REDIS=true   ;;
        nginx)   SKIP_NGINX=true   ;;
        kubectl|helm|k8s) SKIP_KUBECTL=true ;;
        *) warn "Option --skip inconnue : $2" ;;
      esac
      shift 2
      ;;
    *) shift ;;
  esac
done

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    MoveToData — Installation des composants techniques         ║${NC}"
echo -e "${CYAN}║    CentOS / RHEL ${OS_MAJOR}                                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# [1] OpenJDK 11 — Build Boson (Spring Boot + Spark 3.4.3)
# =============================================================================
section "[1/10] OpenJDK 11"

if ${SKIP_JAVA}; then
  skip "OpenJDK 11 ignoré (--skip java)"
elif java -version 2>&1 | grep -q "11\."; then
  success "OpenJDK 11 déjà installé : $(java -version 2>&1 | head -1)"
else
  info "Installation OpenJDK 11..."
  ${PKG_MGR} install -y java-11-openjdk java-11-openjdk-devel

  # Définir Java 11 comme version par défaut
  if update-alternatives --list java 2>/dev/null | grep -q "java-11"; then
    update-alternatives --set java \
      "$(update-alternatives --list java | grep "java-11" | head -1)" 2>/dev/null || true
  fi

  # Variable d'environnement JAVA_HOME
  JAVA_HOME_PATH=$(dirname $(dirname $(readlink -f $(which java))))
  if [[ ! -f /etc/profile.d/java.sh ]]; then
    cat > /etc/profile.d/java.sh << JEOF
# Java 11 — installé par MoveToData
export JAVA_HOME=${JAVA_HOME_PATH}
export PATH=\$JAVA_HOME/bin:\$PATH
JEOF
    success "JAVA_HOME configuré : ${JAVA_HOME_PATH}"
  fi

  success "OpenJDK 11 installé : $(java -version 2>&1 | head -1)"
fi

# =============================================================================
# [2] Gradle 7.6.4 — Build Java local (via SDKMAN)
# =============================================================================
section "[2/10] Gradle 7.6.4 (via SDKMAN)"

if ${SKIP_GRADLE}; then
  skip "Gradle ignoré (--skip gradle)"
elif command -v gradle &>/dev/null && gradle --version 2>/dev/null | grep -q "7\."; then
  success "Gradle 7.x déjà installé : $(gradle --version | grep Gradle)"
else
  info "Installation SDKMAN + Gradle 7.6.4 pour l'utilisateur ${MOVETODATA_USER}..."

  # SDKMAN nécessite curl, unzip, zip
  ${PKG_MGR} install -y curl unzip zip 2>/dev/null || true

  # Installer SDKMAN pour l'utilisateur movetodata
  if [[ ! -d "/home/${MOVETODATA_USER}/.sdkman" ]]; then
    sudo -u "${MOVETODATA_USER}" bash -c \
      'curl -s "https://get.sdkman.io" | bash' || \
      warn "Téléchargement SDKMAN échoué — vérifiez la connexion Internet"
  fi

  # Installer Gradle 7.6.4 via SDKMAN
  if [[ -d "/home/${MOVETODATA_USER}/.sdkman" ]]; then
    sudo -u "${MOVETODATA_USER}" bash -c \
      'source "$HOME/.sdkman/bin/sdkman-init.sh" && sdk install gradle 7.6.4 && sdk default gradle 7.6.4' \
      2>/dev/null && success "Gradle 7.6.4 installé via SDKMAN" || \
      warn "SDKMAN Gradle installation échouée — installation manuelle:"

    # Créer un lien symbolique dans /usr/local/bin
    GRADLE_BIN="/home/${MOVETODATA_USER}/.sdkman/candidates/gradle/current/bin/gradle"
    if [[ -f "${GRADLE_BIN}" ]]; then
      ln -sf "${GRADLE_BIN}" /usr/local/bin/gradle
      success "Lien symbolique /usr/local/bin/gradle créé"
    fi
  else
    # Fallback : installation manuelle
    warn "SDKMAN non disponible — installation manuelle de Gradle 7.6.4..."
    GRADLE_VERSION="7.6.4"
    GRADLE_URL="https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip"
    GRADLE_DIR="/opt/gradle-${GRADLE_VERSION}"

    if [[ ! -d "${GRADLE_DIR}" ]]; then
      curl -fsSL "${GRADLE_URL}" -o "/tmp/gradle-${GRADLE_VERSION}.zip"
      unzip -q "/tmp/gradle-${GRADLE_VERSION}.zip" -d /opt
      rm -f "/tmp/gradle-${GRADLE_VERSION}.zip"
    fi

    ln -sf "${GRADLE_DIR}/bin/gradle" /usr/local/bin/gradle

    cat > /etc/profile.d/gradle.sh << 'GEOF'
# Gradle — installé par MoveToData
export GRADLE_HOME=/opt/gradle-7.6.4
export PATH=$GRADLE_HOME/bin:$PATH
GEOF
    success "Gradle ${GRADLE_VERSION} installé dans /opt"
  fi

  command -v gradle &>/dev/null && \
    success "Gradle disponible : $(gradle --version 2>/dev/null | grep Gradle | head -1)" || \
    warn "Gradle non disponible dans \$PATH — redémarrez la session ou sourcez /etc/profile.d/gradle.sh"
fi

# =============================================================================
# [3] Node.js 18 LTS — Build Frontend React + Snap-UI
# =============================================================================
section "[3/10] Node.js 18 LTS"

if ${SKIP_NODE}; then
  skip "Node.js ignoré (--skip node)"
elif node --version 2>/dev/null | grep -q "^v18\."; then
  success "Node.js 18 déjà installé : $(node --version)"
else
  info "Ajout du dépôt NodeSource pour Node.js 18 LTS..."

  # Supprimer les anciennes versions Node si présentes
  ${PKG_MGR} remove -y nodejs npm 2>/dev/null || true

  # Dépôt NodeSource RPM
  if curl -fsSL https://rpm.nodesource.com/setup_18.x -o /tmp/nodesource_setup.sh; then
    bash /tmp/nodesource_setup.sh
    rm -f /tmp/nodesource_setup.sh
    ${PKG_MGR} install -y nodejs
    success "Node.js $(node --version) installé via NodeSource"
  else
    warn "NodeSource non accessible — tentative via EPEL/base..."
    ${PKG_MGR} install -y nodejs npm 2>/dev/null && \
      warn "Node.js installé depuis les dépôts système (version peut différer de 18)" || \
      error "Impossible d'installer Node.js — vérifiez la connexion Internet"
  fi

  info "Node.js : $(node --version)"
  info "npm    : $(npm --version)"
fi

# =============================================================================
# [4] Yarn 3.5+ — Gestionnaire de paquets Frontend
# =============================================================================
section "[4/10] Yarn 3.5+"

if ${SKIP_NODE}; then
  skip "Yarn ignoré (Node.js ignoré)"
elif yarn --version 2>/dev/null | grep -qE "^[3-9]\."; then
  success "Yarn 3+ déjà installé : $(yarn --version)"
else
  if ! command -v node &>/dev/null; then
    warn "Node.js non disponible — Yarn ne peut pas être installé"
  else
    info "Activation de Corepack + Yarn stable..."

    # Corepack est inclus avec Node.js 18
    if command -v corepack &>/dev/null; then
      corepack enable
      corepack prepare yarn@stable --activate 2>/dev/null || \
        npm install -g yarn 2>/dev/null || true
    else
      npm install -g corepack 2>/dev/null || true
      corepack enable  2>/dev/null || true
      corepack prepare yarn@stable --activate 2>/dev/null || true
    fi

    # Vérification
    if yarn --version 2>/dev/null | grep -qE "^[3-9]\."; then
      success "Yarn $(yarn --version) installé"
    else
      # Fallback : Yarn 1.x via npm (compatible avec le projet si Yarn Berry non requis)
      npm install -g yarn
      warn "Yarn $(yarn --version) installé (version 1.x — Yarn Berry non disponible)"
      warn "Si le projet exige Yarn >=3.5, exécutez : corepack prepare yarn@3.5.1 --activate"
    fi
  fi
fi

# =============================================================================
# [5] Python 3.8 / 3.9 — Tycho (Apache Superset), Callisto, scripts
# =============================================================================
section "[5/10] Python 3.8 / 3.9"

if ${SKIP_PYTHON}; then
  skip "Python ignoré (--skip python)"
else
  info "Vérification Python 3.8..."

  # Sur CentOS Stream 9 / RHEL 9, Python 3.9 est la version par défaut.
  # Python 3.8 peut être disponible selon le miroir EPEL.
  # Tycho s'exécute dans Docker (Python 3.8 dans le container), donc le host
  # peut utiliser Python 3.9 pour les scripts de gestion.

  PYTHON38_INSTALLED=false
  PYTHON39_INSTALLED=false

  # Tenter Python 3.8
  if python3.8 --version &>/dev/null 2>&1; then
    success "Python 3.8 déjà disponible : $(python3.8 --version)"
    PYTHON38_INSTALLED=true
  else
    # Tenter l'installation depuis les dépôts
    if ${PKG_MGR} install -y python3.8 python3.8-devel 2>/dev/null; then
      success "Python 3.8 installé depuis les dépôts"
      PYTHON38_INSTALLED=true
    else
      warn "python3.8 non disponible dans les dépôts configurés sur ${OS_NAME} ${OS_MAJOR}"
    fi
  fi

  # Python 3.9 (défaut sur Stream 9)
  if python3.9 --version &>/dev/null 2>&1 || python3 --version 2>/dev/null | grep -q "3\.9"; then
    success "Python 3.9 disponible : $(python3.9 --version 2>/dev/null || python3 --version)"
    PYTHON39_INSTALLED=true
  else
    ${PKG_MGR} install -y python3.9 python3.9-devel 2>/dev/null && \
      PYTHON39_INSTALLED=true || true
  fi

  # Installation de pip et outils communs
  info "Installation des outils Python (pip, virtualenv, setuptools)..."
  ${PKG_MGR} install -y \
    python3 python3-pip python3-devel \
    python3-setuptools python3-virtualenv 2>/dev/null || true

  # pip upgrade
  python3 -m pip install --upgrade pip setuptools wheel 2>/dev/null || true

  # Dépendances de compilation Python (pour psycopg2, cryptography, etc.)
  ${PKG_MGR} install -y \
    gcc gcc-c++ make \
    libpq-devel openssl-devel \
    libffi-devel bzip2-devel \
    readline-devel sqlite-devel \
    zlib-devel xz-devel 2>/dev/null || true

  if ${PYTHON38_INSTALLED}; then
    success "Python 3.8 opérationnel (requis par Callisto et scripts Tycho)"
  elif ${PYTHON39_INSTALLED}; then
    warn "Python 3.8 non disponible — Python 3.9 utilisé pour les scripts hôte"
    warn "Tycho/Superset utilise Python 3.8 dans son container Docker (pas d'impact)"
    info "Pour Python 3.8 strict : utilisez pyenv"
    info "  curl https://pyenv.run | bash"
    info "  pyenv install 3.8.18 && pyenv global 3.8.18"
  fi

  info "Python disponible :"
  python3 --version 2>/dev/null && echo "  python3  : $(python3 --version)" || true
  python3.8 --version 2>/dev/null && echo "  python3.8: $(python3.8 --version)" || true
  python3.9 --version 2>/dev/null && echo "  python3.9: $(python3.9 --version)" || true
  pip3 --version 2>/dev/null && echo "  pip3     : $(pip3 --version)" || true
fi

# =============================================================================
# [6] PostgreSQL 16 — Base Snap (optionnel hors Docker)
# =============================================================================
section "[6/10] PostgreSQL 16 (client + serveur)"

if ${SKIP_PG}; then
  skip "PostgreSQL ignoré (--skip pg)"
elif psql --version 2>/dev/null | grep -q " 16\."; then
  success "PostgreSQL 16 déjà installé : $(psql --version)"
else
  info "Ajout du dépôt PostgreSQL Global Development Group (PGDG)..."

  # Désactiver le module postgresql intégré (CentOS 8/9)
  if [[ "${OS_MAJOR}" != "7" ]]; then
    ${PKG_MGR} -qy module disable postgresql 2>/dev/null || true
  fi

  # Ajout du repo PGDG
  PGDG_RPM="https://download.postgresql.org/pub/repos/yum/reporpms/EL-${OS_MAJOR}-x86_64/pgdg-redhat-repo-latest.noarch.rpm"

  if ${PKG_MGR} install -y "${PGDG_RPM}" 2>/dev/null; then
    success "Dépôt PGDG ajouté"
  else
    warn "Impossible d'ajouter le dépôt PGDG — tentative depuis les dépôts système"
    ${PKG_MGR} install -y postgresql postgresql-server postgresql-devel 2>/dev/null || \
      warn "PostgreSQL non disponible depuis les dépôts système"
  fi

  # Installation PostgreSQL 16
  if ${PKG_MGR} install -y postgresql16 postgresql16-server postgresql16-devel 2>/dev/null; then
    success "PostgreSQL 16 installé"

    # Initialisation de la base (pour usage hors Docker)
    if [[ ! -f /var/lib/pgsql/16/data/PG_VERSION ]]; then
      info "Initialisation de la base PostgreSQL 16..."
      /usr/pgsql-16/bin/postgresql-16-setup initdb
      success "Base PostgreSQL 16 initialisée"
    fi

    # Activation (sans démarrer — Snap utilise Docker par défaut)
    systemctl enable postgresql-16 2>/dev/null || true
    warn "PostgreSQL 16 installé mais NON démarré — Snap utilise le container Docker par défaut"
    warn "Pour démarrer le serveur local : sudo systemctl start postgresql-16"

    # Installation du client uniquement pour l'accès depuis le host
    success "Client psql disponible : $(psql --version 2>/dev/null || /usr/pgsql-16/bin/psql --version)"
  else
    # Fallback : client PostgreSQL uniquement
    ${PKG_MGR} install -y postgresql 2>/dev/null && \
      warn "PostgreSQL 16 non disponible — client basique installé" || true
  fi

  # Lien symbolique pour psql dans le PATH
  if [[ -f /usr/pgsql-16/bin/psql ]] && [[ ! -f /usr/bin/psql ]]; then
    ln -sf /usr/pgsql-16/bin/psql /usr/local/bin/psql
    success "psql disponible dans \$PATH"
  fi
fi

# =============================================================================
# [7] Redis 7 — Cache Celery Superset / WebSocket Boson
# =============================================================================
section "[7/10] Redis 7"

if ${SKIP_REDIS}; then
  skip "Redis ignoré (--skip redis)"
elif command -v redis-cli &>/dev/null && redis-cli --version 2>/dev/null | grep -qE "redis-cli [7]\."; then
  success "Redis 7 déjà installé : $(redis-cli --version)"
else
  info "Installation Redis..."

  # Redis 7 est disponible dans les dépôts EPEL ou Remi pour CentOS/RHEL 9
  if ${PKG_MGR} install -y redis 2>/dev/null; then
    REDIS_VERSION=$(redis-server --version 2>/dev/null | grep -oP 'v=\K[0-9]+\.[0-9]+' | head -1 || echo "?")
    success "Redis ${REDIS_VERSION} installé"
  else
    # Tentative via dépôt Remi (Redis 7)
    info "Tentative via dépôt Remi pour Redis 7..."
    if [[ "${OS_MAJOR}" == "9" ]]; then
      REMI_RPM="https://rpms.remirepo.net/enterprise/remi-release-9.rpm"
    elif [[ "${OS_MAJOR}" == "8" ]]; then
      REMI_RPM="https://rpms.remirepo.net/enterprise/remi-release-8.rpm"
    else
      REMI_RPM="https://rpms.remirepo.net/enterprise/remi-release-7.rpm"
    fi

    ${PKG_MGR} install -y "${REMI_RPM}" 2>/dev/null && \
    ${PKG_MGR} module reset redis 2>/dev/null && \
    ${PKG_MGR} module enable redis:remi-7.0 2>/dev/null && \
    ${PKG_MGR} install -y redis 2>/dev/null && \
      success "Redis 7 installé via dépôt Remi" || \
      warn "Redis non installé — utilisez le container Docker (docker-compose.core.yml)"
  fi

  # Activation (sans démarrer — Redis utilise Docker par défaut)
  systemctl enable redis 2>/dev/null || true
  warn "Redis installé mais NON démarré — la plateforme utilise le container Docker par défaut"
  warn "Pour démarrer le serveur local : sudo systemctl start redis"
fi

# =============================================================================
# [8] Nginx — Reverse proxy / serveur SPA Frontend
# =============================================================================
section "[8/10] Nginx"

if ${SKIP_NGINX}; then
  skip "Nginx ignoré (--skip nginx)"
elif command -v nginx &>/dev/null; then
  success "Nginx déjà installé : $(nginx -v 2>&1)"
else
  info "Installation Nginx..."

  if ${PKG_MGR} install -y nginx 2>/dev/null; then
    success "Nginx installé : $(nginx -v 2>&1)"

    # Ne pas démarrer — la plateforme utilise le container Docker pour le frontend
    systemctl enable nginx 2>/dev/null || true
    warn "Nginx installé mais NON démarré — le Frontend utilise le container Docker (port 80)"
    warn "Pour démarrer Nginx natif : sudo systemctl start nginx"

    # Création d'un répertoire de config MoveToData
    mkdir -p /etc/nginx/conf.d/movetodata.d
    cat > /etc/nginx/conf.d/movetodata.conf << 'NGEOF'
# =============================================================
# MoveToData Platform — Configuration Nginx (mode hôte natif)
# Utiliser uniquement si le frontend ne tourne PAS en container
# =============================================================
# Inclure cette configuration uniquement si besoin de proxy natif
# server {
#   listen 80;
#   server_name _;
#   location /api/ {
#     proxy_pass http://localhost:8080/;
#   }
#   location / {
#     root /opt/movetodata/frontend/build;
#     try_files $uri /index.html;
#   }
# }
NGEOF
    success "Configuration Nginx MoveToData créée dans /etc/nginx/conf.d/"
  else
    warn "Nginx non installé — le Frontend utilise le container Docker"
  fi
fi

# =============================================================================
# [9] Outils de build système — gcc, make, libpq-devel, openssl-devel
# =============================================================================
section "[9/10] Outils de build système"

info "Installation / vérification des outils de build..."

BUILD_PKGS=(
  gcc gcc-c++ make
  libpq-devel
  openssl openssl-devel
  libffi-devel
  bzip2 bzip2-devel
  readline-devel
  sqlite-devel
  zlib-devel
  xz xz-devel
  unzip zip tar
  ncurses-devel
  tk-devel
  gdbm-devel
  expat-devel
)

${PKG_MGR} install -y -q "${BUILD_PKGS[@]}" 2>/dev/null && \
  success "Outils de build installés" || \
  warn "Certains paquets de build non disponibles — les builds Docker ne sont pas impactés"

info "Versions des outils de compilation :"
echo "  gcc    : $(gcc --version 2>/dev/null | head -1 || echo 'non installé')"
echo "  make   : $(make --version 2>/dev/null | head -1 || echo 'non installé')"
echo "  openssl: $(openssl version 2>/dev/null || echo 'non installé')"

# =============================================================================
# [10] kubectl + Helm — Déploiement Kubernetes (mode production)
# =============================================================================
section "[10/10] kubectl + Helm (Kubernetes)"

if ${SKIP_KUBECTL}; then
  skip "kubectl + Helm ignorés (--skip kubectl)"
else
  # ---- kubectl ----
  if command -v kubectl &>/dev/null; then
    success "kubectl déjà installé : $(kubectl version --client 2>/dev/null | head -1)"
  else
    info "Installation kubectl (version stable)..."

    KUBECTL_VERSION=$(curl -fsSL "https://dl.k8s.io/release/stable.txt" 2>/dev/null || echo "v1.29.0")

    if curl -fsSL \
        "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
        -o /tmp/kubectl 2>/dev/null; then

      # Vérifier le checksum
      KUBECTL_SHA=$(curl -fsSL \
        "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256" \
        2>/dev/null || echo "")

      if [[ -n "${KUBECTL_SHA}" ]]; then
        echo "${KUBECTL_SHA}  /tmp/kubectl" | sha256sum --check --status 2>/dev/null && \
          info "Checksum kubectl vérifié" || warn "Checksum kubectl non vérifié"
      fi

      install -o root -g root -m 0755 /tmp/kubectl /usr/local/bin/kubectl
      rm -f /tmp/kubectl
      success "kubectl ${KUBECTL_VERSION} installé"

    else
      # Fallback : dépôt Kubernetes
      warn "Téléchargement direct échoué — tentative via dépôt Kubernetes..."
      cat > /etc/yum.repos.d/kubernetes.repo << 'K8EOF'
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.29/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.29/rpm/repodata/repomd.xml.key
K8EOF
      ${PKG_MGR} install -y kubectl 2>/dev/null && \
        success "kubectl installé via dépôt Kubernetes" || \
        warn "kubectl non installé — consultez : https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/"
    fi
  fi

  # ---- Helm ----
  if command -v helm &>/dev/null; then
    success "Helm déjà installé : $(helm version --short 2>/dev/null)"
  else
    info "Installation Helm (version stable)..."

    if curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
        -o /tmp/get_helm.sh 2>/dev/null; then

      chmod +x /tmp/get_helm.sh
      VERIFY_CHECKSUM=false bash /tmp/get_helm.sh 2>/dev/null && \
        success "Helm $(helm version --short 2>/dev/null) installé" || \
        warn "Script Helm échoué"
      rm -f /tmp/get_helm.sh

    else
      # Fallback : téléchargement direct du binaire
      warn "Script Helm non accessible — téléchargement du binaire..."
      HELM_VERSION="v3.14.0"
      HELM_URL="https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz"

      if curl -fsSL "${HELM_URL}" -o /tmp/helm.tar.gz 2>/dev/null; then
        tar -zxf /tmp/helm.tar.gz -C /tmp
        install -o root -g root -m 0755 /tmp/linux-amd64/helm /usr/local/bin/helm
        rm -rf /tmp/helm.tar.gz /tmp/linux-amd64
        success "Helm ${HELM_VERSION} installé"
      else
        warn "Helm non installé — consultez : https://helm.sh/docs/intro/install/"
      fi
    fi
  fi

  # Auto-complétion kubectl et Helm (optionnel)
  if command -v kubectl &>/dev/null; then
    kubectl completion bash > /etc/bash_completion.d/kubectl 2>/dev/null || true
  fi
  if command -v helm &>/dev/null; then
    helm completion bash > /etc/bash_completion.d/helm 2>/dev/null || true
  fi
fi

# =============================================================================
# Vérifications finales
# =============================================================================
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Récapitulatif des composants installés${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo ""

check_component() {
  local label="$1"
  local cmd="$2"
  local version_cmd="${3:-}"

  if eval "${cmd}" &>/dev/null 2>&1; then
    local ver=""
    [[ -n "${version_cmd}" ]] && ver=" — $(eval "${version_cmd}" 2>/dev/null | head -1 || echo '?')"
    success "${label}${ver}"
  else
    warn "${label} — non disponible (voir les messages ci-dessus)"
  fi
}

check_component "Java 11"        "java -version 2>&1 | grep -q '11\.'"  \
                                  "java -version 2>&1 | head -1"
check_component "Gradle"         "command -v gradle"                     \
                                  "gradle --version 2>/dev/null | grep 'Gradle' | head -1"
check_component "Node.js"        "command -v node"                       \
                                  "node --version"
check_component "npm"            "command -v npm"                        \
                                  "npm --version"
check_component "Yarn"           "command -v yarn"                       \
                                  "yarn --version"
check_component "Python 3"       "command -v python3"                    \
                                  "python3 --version"
check_component "Python 3.8"     "command -v python3.8"                  \
                                  "python3.8 --version"
check_component "pip3"           "command -v pip3"                       \
                                  "pip3 --version"
check_component "PostgreSQL"     "command -v psql || command -v /usr/pgsql-16/bin/psql" \
                                  "psql --version 2>/dev/null || /usr/pgsql-16/bin/psql --version 2>/dev/null"
check_component "Redis"          "command -v redis-cli"                  \
                                  "redis-cli --version"
check_component "Nginx"          "command -v nginx"                      \
                                  "nginx -v 2>&1"
check_component "gcc"            "command -v gcc"                        \
                                  "gcc --version | head -1"
check_component "Docker"         "command -v docker"                     \
                                  "docker --version"
check_component "Docker Compose" "docker compose version"                \
                                  "docker compose version"
check_component "kubectl"        "command -v kubectl"                    \
                                  "kubectl version --client --output=yaml 2>/dev/null | grep gitVersion | head -1"
check_component "Helm"           "command -v helm"                       \
                                  "helm version --short"
check_component "Git"            "command -v git"                        \
                                  "git --version"
check_component "curl"           "command -v curl"                       \
                                  "curl --version | head -1"
check_component "FUSE"           "test -c /dev/fuse"                     \
                                  "echo '/dev/fuse présent'"

REPO_DIR="/opt/movetodata/repo"
MOVETODATA_USER="${MOVETODATA_USER:-movetodata}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Composants techniques MoveToData installés                 ║${NC}"
echo -e "${GREEN}║   Système : ${OS_NAME} ${OS_MAJOR}                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
warn "IMPORTANT : Rechargez le profil shell pour activer Java, Gradle et Node :"
echo "    source /etc/profile.d/*.sh"
echo "    # ou fermez et rouvrez votre session SSH"
echo ""
warn "PostgreSQL 16, Redis et Nginx sont installés mais NON démarrés."
warn "La plateforme utilise ces services via Docker Compose (containers)."
warn "Les binaires natifs servent uniquement de fallback ou de client CLI."
echo ""
info "Prochaines étapes — dans l'ordre :"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────────┐"
echo "  │  ÉTAPE 3 — Configurer les variables d'environnement (secrets)       │"
echo "  └─────────────────────────────────────────────────────────────────────┘"
echo "    sudo -u ${MOVETODATA_USER} bash ${REPO_DIR}/scripts/01-setup-env.sh"
echo "    # Génère : ${REPO_DIR}/scripts/.env.movetodata"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────────┐"
echo "  │  ÉTAPE 4 — Builder les images Docker (15–40 min)                    │"
echo "  └─────────────────────────────────────────────────────────────────────┘"
echo "    sudo -u ${MOVETODATA_USER} bash ${REPO_DIR}/scripts/02-build.sh all"
echo "    # ou : sudo -u ${MOVETODATA_USER} bash ${REPO_DIR}/scripts/movetodata-centos.sh build all"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────────┐"
echo "  │  ÉTAPE 5 — Démarrer la plateforme                                   │"
echo "  └─────────────────────────────────────────────────────────────────────┘"
echo "    sudo -u ${MOVETODATA_USER} bash ${REPO_DIR}/scripts/03-start-centos.sh all"
echo "    # ou : sudo -u ${MOVETODATA_USER} bash ${REPO_DIR}/scripts/movetodata-centos.sh start all"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────────┐"
echo "  │  ÉTAPE 6 — Vérifier la santé de la plateforme                       │"
echo "  └─────────────────────────────────────────────────────────────────────┘"
echo "    bash ${REPO_DIR}/scripts/05-healthcheck.sh"
echo "    # ou : bash ${REPO_DIR}/scripts/movetodata-centos.sh health"
echo ""
