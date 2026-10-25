# MoveToData — Vue d'ensemble de la plateforme

MoveToData est une plateforme de données souveraine tout-en-un. Elle couvre l'ingestion, la transformation, l'orchestration, l'analyse et la gouvernance des données. Toutes les inférences LLM sont exécutées en local via Ollama (modèle qwen2.5:14b), sans aucune donnée transmise à un cloud externe.

## Modules principaux

### Catalogue de données (Connecteurs / Ingestion)
Le Catalogue centralise tous les datasets de la plateforme. Un dataset est le résultat de l'exécution d'un lien (ingestion) ou d'un build (transformation). Le Catalogue permet de rechercher, documenter et partager les assets data de l'organisation.

### Orchestration (Schedules / Pipelines)
L'Orchestration permet de planifier l'exécution automatique des pipelines. Un pipeline peut être une ingestion (synchronisation de données depuis une source externe) ou un build (exécution de code de transformation). Les schedules définissent la fréquence d'exécution (cron, intervalle, déclencheur manuel).

### Transformation (Code / Builds)
Le module Transformation permet d'écrire et d'exécuter du code de transformation de données en Python/PySpark ou SQL. Le code est versionné dans un référentiel Git intégré. Un build est l'exécution de ce code sur un cluster Spark.

### Analyse (Visualisation / Dashboards)
L'Analyse offre des graphiques interactifs et des tableaux de bord configurables directement sur les datasets. Types de graphiques disponibles : barres, lignes, secteurs, aires, jauge, treemap, heatmap, scatter, wordcloud, carte géographique.

### Sécurité et Gouvernance
Gestion des utilisateurs, groupes, rôles, tokens API. Contrôle d'accès basé sur les rôles (RBAC). Classification des données. Traçabilité (data lineage) automatique entre sources, datasets et builds.

### Data Health (Qualité des données)
Vérifications automatiques de la qualité des datasets : fraîcheur (âge max configurable), contenu (règles métier), schéma (conformité des colonnes), taille (seuils min/max). Alertes configurables en cas d'échec.

## Navigation dans l'interface

- `/portal/home` — Page d'accueil avec KPIs, activité récente, statut des pipelines
- `/portal/projects` — Catalogue de données (datasets, sources)
- `/portal/schedules` — Orchestration (pipelines, schedules)
- `/portal/connect` — Connecteurs (agents, sources de données, liens)
- `/portal/builds` — Historique des builds de transformation
- `/portal/settings` — Administration (utilisateurs, groupes, tokens, configuration plateforme)

## Flux de données typique

1. **Ingestion** : Configurer un Agent → créer une Source (BDD, S3, fichier) → créer un Lien → exécuter le lien → dataset créé dans le Catalogue
2. **Transformation** : Écrire du code Python/SQL sur un dataset → créer un Build → dataset transformé dans le Catalogue
3. **Analyse** : Ouvrir un dataset dans le Catalogue → créer des graphiques → assembler un tableau de bord
4. **Orchestration** : Planifier ingestions et builds via des Schedules (cron) → surveiller dans l'Orchestration

## Terminologie clé

- **Dataset** : Table de données disponible dans la plateforme, issue d'une ingestion ou d'un build
- **Source** : Système externe (base de données, fichier, API) depuis lequel on ingère des données
- **Agent** : Composant logiciel installé dans le réseau client pour accéder aux sources internes
- **Lien** : Connexion entre une source et un dataset dans MoveToData (définit quelles données ingérer)
- **Build** : Exécution d'un script de transformation (PySpark ou SQL) sur Spark
- **Branch** : Version isolée du code de transformation (analogie Git)
- **Schedule** : Planification d'exécution automatique (ingestion ou build)
- **Pipeline** : Séquence d'étapes d'ingestion et/ou de transformation orchestrées
