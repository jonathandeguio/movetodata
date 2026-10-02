#!/usr/bin/env bash
# =============================================================================
# MoveToData Demo — Script de création du projet démo "Performance Financière 2024"
#
# Crée :
#   - 1 Projet          : "Demo — Performance Financière"
#   - 2 Dossiers        : "Données Brutes" + "Analyses"
#   - 1 Dataset source  : transactions_financieres_2024 (CSV uploadé)
#   - 1 Dataset cible   : performance_par_trimestre (vide, cible du build)
#   - 1 Repository      : contient le script PySpark
#   - 1 Dashboard       : "Tableau de bord Financier 2024"
#
# Usage :
#   bash demo-setup.sh \
#     --url http://192.168.1.41 \
#     --user admin \
#     --password VOTRE_MOT_DE_PASSE \
#     --csv /chemin/vers/demo_transactions_financieres_2024.csv
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="http://192.168.1.41"
USERNAME="admin"
PASSWORD=""
CSV_FILE="${SCRIPT_DIR}/../demo_transactions_financieres_2024.csv"

# Parsing arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)      BASE_URL="$2"; shift 2 ;;
    --user)     USERNAME="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    --csv)      CSV_FILE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

API="${BASE_URL}/api"

# ─── Helpers ──────────────────────────────────────────────────────────────────
get_json() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null || \
  python3  -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

check_deps() {
  for cmd in curl python3; do
    command -v "$cmd" &>/dev/null || error "Commande manquante : $cmd"
  done
}

# ─── 1. Login ─────────────────────────────────────────────────────────────────
login() {
  info "Connexion en tant que ${USERNAME}..."
  [[ -z "${PASSWORD}" ]] && { read -r -s -p "Mot de passe : " PASSWORD; echo; }

  RESPONSE=$(curl -sf -X POST "${API}/passport/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\",\"loginType\":\"plain\"}")

  TOKEN=$(echo "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
  [[ -z "${TOKEN}" ]] && error "Login échoué — vérifiez les identifiants"
  success "Connecté. Token obtenu."
  AUTH="Authorization: Bearer ${TOKEN}"
}

# ─── 2. Création ressources ───────────────────────────────────────────────────
create_project() {
  info "Création du projet..."
  PROJ=$(curl -sf -X POST "${API}/kitab/project/create" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{
      "name": "Demo — Performance Financiere 2024",
      "description": "Projet demonstration : analyse financiere avec donnees reelles, transformation PySpark et data viz.",
      "groups": false,
      "folders": false,
      "userLanguage": "fr"
    }')
  PROJECT_ID=$(echo "$PROJ" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  success "Projet créé — ID : ${PROJECT_ID}"
}

create_folder() {
  local name="$1" parent="$2" varname="$3"
  info "Création du dossier '${name}'..."
  RESP=$(curl -sf -X POST "${API}/kitab/folder/create" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${name}\",
      \"parent\": \"${parent}\",
      \"type\": \"FOLDER\",
      \"description\": \"${name}\"
    }")
  local id
  id=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  eval "${varname}=${id}"
  success "Dossier '${name}' — ID : ${id}"
}

create_dataset_resource() {
  local name="$1" parent="$2" desc="$3" varname="$4"
  info "Création de la ressource dataset '${name}'..."
  RESP=$(curl -sf -X POST "${API}/kitab/folder/create" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${name}\",
      \"parent\": \"${parent}\",
      \"type\": \"DATASET\",
      \"description\": \"${desc}\"
    }")
  local id
  id=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  eval "${varname}=${id}"
  success "Dataset resource '${name}' — ID : ${id}"
}

create_repository() {
  local name="$1" parent="$2" varname="$3"
  info "Création du repository '${name}'..."
  RESP=$(curl -sf -X POST "${API}/kitab/folder/create" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${name}\",
      \"parent\": \"${parent}\",
      \"type\": \"REPOSITORY\",
      \"description\": \"Scripts de transformation PySpark\"
    }")
  local id
  id=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  eval "${varname}=${id}"
  success "Repository '${name}' — ID : ${id}"
}

# ─── 3. Upload CSV ────────────────────────────────────────────────────────────
upload_csv() {
  local dataset_id="$1"
  info "Upload du CSV (${CSV_FILE})..."
  [[ ! -f "${CSV_FILE}" ]] && error "Fichier CSV introuvable : ${CSV_FILE}"

  curl -sf -X POST "${API}/dataset/import/${dataset_id}/main" \
    -H "$AUTH" \
    -F "file=@${CSV_FILE};type=text/csv" \
    -F 'mode=overwrite' \
    -F 'csvPreprocessing={"delimiter":";","header":true,"encoding":"UTF-8"}' \
    > /dev/null

  success "CSV uploadé dans le dataset ${dataset_id}"
}

# ─── 4. Upload script PySpark ─────────────────────────────────────────────────
upload_pyspark() {
  local repo_id="$1"
  local script_file
  script_file="$(dirname "${SCRIPT_DIR}")/demo_analyse_performance.py"
  [[ ! -f "${script_file}" ]] && {
    warn "Script PySpark non trouvé : ${script_file}"
    warn "Placez demo_analyse_performance.py dans $(dirname "${SCRIPT_DIR}")"
    return 0
  }

  info "Upload du script PySpark..."
  curl -sf -X POST "${API}/kitab/repository/${repo_id}/main/upload" \
    -H "$AUTH" \
    -F "file=@${script_file}" \
    > /dev/null && success "Script PySpark uploadé" || warn "Upload script ignoré (API non trouvée)"
}

# ─── 5. Dashboard ─────────────────────────────────────────────────────────────
create_dashboard() {
  local parent="$1"
  info "Création du dashboard..."
  RESP=$(curl -sf -X POST "${API}/kepler/dashboards/new" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Tableau de bord — Performance Financiere 2024\",
      \"description\": \"Vue d'ensemble des KPIs financiers : CA, marges, evolution trimestrielle.\",
      \"parent\": \"${parent}\"
    }")
  DASHBOARD_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  success "Dashboard créé — ID : ${DASHBOARD_ID}"
}

# ─── 6. Charts ────────────────────────────────────────────────────────────────
create_chart() {
  local name="$1" chart_type="$2" x_axis="$3" series_col="$4" \
        dataset_id="$5" parent="$6" series_agg="${7:-SUM}"
  info "Création du chart '${name}' (${chart_type})..."

  SERIES_JSON="[{\"column\":\"${series_col}\",\"aggregateFunction\":\"${series_agg}\",\"label\":\"${series_col}\"}]"

  RESP=$(curl -sf -X POST "${API}/kepler/charts/new" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${name}\",
      \"description\": \"${name}\",
      \"parent\": \"${parent}\",
      \"datasetId\": \"${dataset_id}\",
      \"branch\": \"main\",
      \"userLocale\": \"fr\",
      \"chartConfig\": {
        \"datasetId\": \"${dataset_id}\",
        \"branch\": \"main\",
        \"chartType\": \"${chart_type}\",
        \"xAxis\": \"${x_axis}\",
        \"series\": ${SERIES_JSON},
        \"rowLimit\": 500,
        \"sortingMethod\": \"xaxis\",
        \"sortingDirection\": \"asc\",
        \"fetchCachedData\": false,
        \"saveInCache\": true,
        \"userLocale\": \"fr\"
      },
      \"chartCustomize\": {}
    }") 2>&1

  CHART_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
  if [[ -n "${CHART_ID}" ]]; then
    success "Chart '${name}' — ID : ${CHART_ID}"
    echo "${CHART_ID}"
  else
    warn "Chart '${name}' : création échouée (dataset non encore peuplé ?)"
    echo ""
  fi
}

# =============================================================================
# MAIN
# =============================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MoveToData Demo Setup — Performance Financière 2024  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

check_deps
login

# Structure du projet
create_project

create_folder "Donnees Brutes"    "${PROJECT_ID}" FOLDER_DATA_ID
create_folder "Analyses"          "${PROJECT_ID}" FOLDER_ANALYSIS_ID
create_folder "Visualisations"    "${PROJECT_ID}" FOLDER_VIZ_ID

# Dataset source (données brutes)
create_dataset_resource \
  "transactions_financieres_2024" \
  "${FOLDER_DATA_ID}" \
  "Transactions financieres brutes 2024 (250 lignes) : CA, marges, regions, produits." \
  DS_SOURCE_ID

# Upload du CSV
upload_csv "${DS_SOURCE_ID}"

# Dataset cible (résultat de la transformation)
create_dataset_resource \
  "performance_par_trimestre" \
  "${FOLDER_ANALYSIS_ID}" \
  "KPIs financiers agreges par trimestre, region et ligne de produit. Genere par transformation PySpark." \
  DS_TARGET_ID

# Repository + script PySpark
create_repository "analyse_performance" "${FOLDER_ANALYSIS_ID}" REPO_ID
upload_pyspark "${REPO_ID}"

# Dashboard
create_dashboard "${FOLDER_VIZ_ID}"

# Charts sur le dataset source (disponible immédiatement)
create_chart \
  "CA par Trimestre" "VerticalAxisChart" \
  "trimestre" "chiffre_affaires" \
  "${DS_SOURCE_ID}" "${FOLDER_VIZ_ID}" "SUM"

create_chart \
  "Repartition par Region" "PieChart" \
  "region" "chiffre_affaires" \
  "${DS_SOURCE_ID}" "${FOLDER_VIZ_ID}" "SUM"

create_chart \
  "Marge par Ligne de Produit" "VerticalAxisChart" \
  "ligne_produit" "marge_brute" \
  "${DS_SOURCE_ID}" "${FOLDER_VIZ_ID}" "SUM"

create_chart \
  "Satisfaction Client par Region" "VerticalAxisChart" \
  "region" "satisfaction_client" \
  "${DS_SOURCE_ID}" "${FOLDER_VIZ_ID}" "AVG"

create_chart \
  "Detail Transactions" "TableChart" \
  "date" "chiffre_affaires" \
  "${DS_SOURCE_ID}" "${FOLDER_VIZ_ID}" "SUM"

# ─── Résumé ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Demo MoveToData créé avec succès !            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Projet         : Demo — Performance Financiere 2024"
echo -e "  ID Projet       : ${PROJECT_ID}"
echo -e "  Dataset source  : transactions_financieres_2024 (${DS_SOURCE_ID})"
echo -e "  Dataset cible   : performance_par_trimestre (${DS_TARGET_ID})"
echo -e "  Repository      : analyse_performance (${REPO_ID})"
echo -e "  Dashboard       : ${DASHBOARD_ID}"
echo ""
echo -e "${YELLOW}Prochaines étapes :${NC}"
echo -e "  1. Dans l'éditeur, ouvrez le repo 'analyse_performance'"
echo -e "     → Choisissez source = transactions_financieres_2024 / main"
echo -e "     → Choisissez cible  = performance_par_trimestre / main"
echo -e "     → Lancez le build"
echo -e "  2. Ajoutez les charts au dashboard '${DASHBOARD_ID}'"
echo -e "     depuis ${BASE_URL}/portal/kepler"
echo ""
