# MoveToData — Plateforme de données souveraine européenne

MoveToData est une plateforme BI et data souveraine, self-hostée, conçue pour les entreprises européennes. Elle couvre l'ingestion de données (25+ connecteurs), la transformation (Spark), la visualisation (25 types de graphiques ECharts) et la gouvernance, sans aucune dépendance vers un cloud US.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        MOVETODATA PLATFORM                           │
│                                                                      │
│  ┌─────────────────┐   ┌────────────────────────────────────────┐   │
│  │    Frontend      │   │              Boson API                 │   │
│  │  React 18 · TS   │   │  Java 11 · Spring Boot · Spark 3.4.3  │   │
│  │  Ant Design      │   │  Port :8080                            │   │
│  │  ECharts 5.4.3   │   │                                        │   │
│  │  Nginx :80       │   │  Connect · Explorer · Kepler           │   │
│  └─────────────────┘   └───────────────┬────────────────────────┘   │
│                                         │                            │
│  ┌──────────────────────────────────────┼────────────────────────┐  │
│  │              Infrastructure          │                         │  │
│  │  PostgreSQL :5432        Redis :6379 │                         │  │
│  └──────────────────────────────────────┴────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────┐   ┌────────────────────────────────┐    │
│  │      SNAP (optionnel)  │   │       TYCHO (optionnel)        │    │
│  │  Artifact Manager      │   │  Apache Superset BI · :8088    │    │
│  │  Java · Nginx · :8082  │   │  Python · Celery · Redis       │    │
│  └────────────────────────┘   └────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Modules

| Module | Description | Stack |
|--------|-------------|-------|
| `boson` | Backend API principal | Java 11, Spring Boot 2.7, Gradle, Apache Spark 3.4 |
| `frontend` | Interface utilisateur | React 18, TypeScript, Ant Design, ECharts 5.4 |
| `snap` | Gestionnaire d'artefacts Spark | Java, Spring Boot |
| `snap-ui` | Interface Snap | React, TypeScript |
| `tycho` | Intégration Apache Superset | Docker, Python |
| `scripts` | Scripts d'installation et de déploiement | Bash, Docker Compose, systemd |
| `specs` | Specs fonctionnelles et techniques | Markdown |

---

## Connecteurs disponibles (25+)

### SQL & Data Warehouses
PostgreSQL · MySQL · Oracle · Microsoft SQL Server · MariaDB · Snowflake · Amazon Redshift · Vertica · IBM DB2 · SAP HANA · Google AlloyDB · SQLite · DuckDB

### Cloud & Distributed SQL
ClickHouse · Databricks · Trino · Starburst · SparkSQL · Amazon Athena

### NoSQL
MongoDB

### Fichiers & APIs
File/Folder Upload (CSV, Excel, JSON) · REST API / Webhook · SharePoint (Microsoft 365)

### Générique
ODBC Bridge (SQL Server legacy, Sybase, Progress, IBM AS/400…)

---

## Visualisation — 25 types de graphiques

Pie · Bar · Line · Area · Scatter · Horizontal Bar · Gauge · Radar · Sunburst · Waterfall · Treemap · Word Cloud · Map · Parameter · Funnel · Heatmap · Sankey · Tree · Effect Scatter · Graph/Network · Boxplot · Candlestick · Parallel · Theme River · Pictorial Bar

---

## Démarrage rapide

### Prérequis

- Ubuntu 22.04 LTS (ou CentOS Stream 9)
- Docker Engine 24+ et Docker Compose v2
- 8 vCPU / 16 Go RAM minimum (16 vCPU / 32 Go recommandés)
- 100 Go disque minimum

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/jonathandeguio/movetodata.git
cd movetodata

# 2. Installer Docker et les dépendances système (une seule fois, en root)
sudo bash scripts/00-install-system.sh

# 3. Générer le fichier d'environnement (secrets, URLs)
bash scripts/01-setup-env.sh

# 4. Builder les images Docker (15–40 min selon la machine)
bash scripts/02-build.sh

# 5. Démarrer la plateforme
bash scripts/03-start.sh

# 6. Vérifier l'état
bash scripts/05-healthcheck.sh
```

### Via le point d'entrée unifié

```bash
sudo bash scripts/movetodata.sh install   # Installation système
bash scripts/movetodata.sh env            # Configuration des secrets
bash scripts/movetodata.sh build all      # Build des images
bash scripts/movetodata.sh start all      # Démarrage
bash scripts/movetodata.sh status         # État des services
bash scripts/movetodata.sh logs boson -f  # Logs en temps réel
bash scripts/movetodata.sh stop all       # Arrêt propre
```

---

## Ports exposés

| Port | Service | Description |
|------|---------|-------------|
| 80 | Frontend | SPA React (Nginx) |
| 8080 | Boson API | Spring Boot + Spark |
| 8082 | Snap | Gestionnaire d'artefacts |
| 8088 | Tycho | Apache Superset BI |

---

## Variables d'environnement

Le fichier `scripts/.env.movetodata` est généré par `01-setup-env.sh`. Variables obligatoires :

| Variable | Description |
|----------|-------------|
| `BASE_URL` | URL interne de la plateforme (ex: `http://192.168.1.41`) |
| `EXTERNAL_URL` | URL publique externe (si différente) |
| `BOSON_DB_PASSWORD` | Mot de passe PostgreSQL Boson (généré automatiquement) |
| `TOKEN_SECRET` | Secret JWT — 128 caractères hex (généré automatiquement) |
| `GITHUB_OAUTH_CLIENT_ID` | OAuth2 GitHub (optionnel) |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth2 Google (optionnel) |

---

## Démarrage automatique via systemd

```bash
# Copier les fichiers service
sudo cp scripts/movetodata-platform.service /etc/systemd/system/
sudo cp scripts/movetodata-snap.service /etc/systemd/system/

# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable movetodata-platform movetodata-snap
sudo systemctl start movetodata-platform

# Statut
sudo systemctl status movetodata-platform
sudo journalctl -u movetodata-platform -f
```

---

## CentOS / RHEL

Des scripts et fichiers service dédiés CentOS sont disponibles :

```bash
sudo bash scripts/00-install-system-centos.sh
sudo bash scripts/install-components-centos.sh
bash scripts/movetodata-centos.sh start all
```

Fichiers service systemd CentOS : `movetodata-platform-centos.service`, `movetodata-snap-centos.service`.

---

## Souveraineté européenne

- **Aucune dépendance runtime** vers AWS, GCP, Azure ou tout cloud US pour l'hébergement de la plateforme
- **Polices auto-hébergées** — Poppins servi depuis `/public/`, zéro appel CDN externe
- **Pas de télémétrie** vers des services tiers
- Les connecteurs vers des sources externes US (Redshift, Athena…) fonctionnent en lecture seule — les données ne quittent pas l'infrastructure EU
- Licences : Apache 2.0 / MIT / LGPL pour toutes les dépendances core

---

## Structure du dépôt

```
movetodata/
├── boson/               # Backend Spring Boot + Spark
├── frontend/            # SPA React + ECharts
├── snap/                # Artifact Manager (backend)
├── snap-ui/             # Artifact Manager (frontend)
├── tycho/               # Apache Superset integration
├── scripts/             # Installation, déploiement, docker-compose
│   ├── movetodata.sh            # Point d'entrée unifié (Ubuntu)
│   ├── movetodata-centos.sh     # Point d'entrée unifié (CentOS)
│   ├── docker-compose.core.yml  # Stack principale
│   ├── docker-compose.snap.yml  # Stack Snap
│   ├── docker-compose.tycho.yml # Stack Tycho/Superset
│   └── *.service                # Services systemd
├── specs/               # Specs techniques et fonctionnelles
│   ├── connectors-gap-analysis.md
│   ├── dataviz-echarts-gap-analysis.md
│   └── ai-features-spec.md
└── .claude/agents/      # Agents IA de développement
    ├── dev.md           # Développeur full-stack
    ├── devops.md        # DevOps / infra
    ├── qa.md            # QA / tests automatisés
    ├── architect.md     # Architecte technique
    ├── ai.md            # Ingénieur IA/ML
    ├── po.md            # Product Owner / specs
    └── content.md       # Copywriting produit
```

---

## Licence

Propriétaire — © MoveToData. Tous droits réservés.
