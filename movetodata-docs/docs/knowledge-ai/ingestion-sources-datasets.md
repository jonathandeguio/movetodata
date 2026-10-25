# Ingestion de données — Agents, Sources, Liens, Datasets

## Architecture d'ingestion

L'ingestion de données dans MoveToData suit le schéma : **Agent → Source → Lien → Dataset**.

Chaque composant a un rôle distinct :
- L'**Agent** gère la connectivité réseau vers les systèmes internes
- La **Source** décrit le système de données externe (connexion, credentials)
- Le **Lien** définit quelles données extraire de la source (table, fichier, requête)
- Le **Dataset** est le résultat stocké dans MoveToData après exécution du lien

## Agents

### Qu'est-ce qu'un agent ?
Un agent est un processus logiciel déployé dans le réseau de l'organisation, qui sert d'intermédiaire sécurisé entre les sources de données et MoveToData. Il est nécessaire pour les sources non accessibles directement depuis internet (bases de données internes, fichiers sur serveur, etc.).

### Un agent peut-il gérer plusieurs sources ?
Oui. Un seul agent peut prendre en charge plusieurs sources de données et plusieurs liens simultanément.

### Statuts d'un agent
- **Connecté** : L'agent est actif et joignable
- **Déconnecté** : L'agent ne répond plus (processus arrêté, réseau coupé)
- **Non configuré** : L'agent est installé mais pas encore associé à la plateforme

### Installer un agent
L'agent MoveToData s'installe via un script fourni dans la section Connecteurs de l'interface. Il tourne comme un service système (Linux) ou un service Windows. Voir la documentation "Installer un agent" pour les étapes détaillées.

## Sources de données

### Types de sources supportés
- **Bases de données relationnelles** : PostgreSQL, MySQL, SQL Server, Oracle, MariaDB
- **Stockage objet** : Amazon S3, Azure Blob Storage, Google Cloud Storage, MinIO
- **Fichiers** : CSV, Parquet, JSON, Excel (XLSX) sur serveur Linux/Windows
- **APIs REST** : Endpoints HTTP avec authentification (Basic, Token, OAuth2)
- **Entrepôts de données** : Snowflake, BigQuery, Redshift
- **Systèmes ERP/CRM** : SAP (via connecteur dédié)

### Configurer une source
1. Aller dans Connecteurs → Sources → "Nouvelle source"
2. Sélectionner le type de source
3. Renseigner les informations de connexion (hôte, port, base de données, credentials)
4. Tester la connexion
5. Assigner un agent si la source est dans un réseau privé

## Liens

### Qu'est-ce qu'un lien ?
Un lien est la configuration qui définit exactement quelles données extraire d'une source et comment les stocker dans MoveToData. Par exemple, un lien sur une source PostgreSQL peut cibler une table spécifique, une vue, ou le résultat d'une requête SQL personnalisée.

### Une source peut-elle avoir plusieurs liens ?
Oui. Une source PostgreSQL avec 50 tables peut avoir 50 liens distincts, chacun ciblant une table différente.

### Modes d'ingestion d'un lien
- **Complet (full)** : Réingère la totalité des données à chaque exécution
- **Incrémental** : N'ingère que les nouvelles données (basé sur un champ date ou un identifiant croissant)
- **Upsert** : Met à jour les lignes existantes et insère les nouvelles (basé sur une clé primaire)

### Exécuter un lien manuellement
1. Connecteurs → Liens → sélectionner le lien
2. Cliquer sur "Exécuter" (icône Play)
3. Suivre l'avancement dans les logs en temps réel

## Datasets

### Qu'est-ce qu'un dataset dans MoveToData ?
Un dataset est une table de données disponible dans la plateforme. Il est créé soit par l'exécution d'un lien (ingestion), soit par l'exécution d'un build (transformation). Un dataset peut être utilisé comme source dans d'autres transformations, dans des analyses, ou exposé via l'API.

### Propriétés d'un dataset
- **Nom** : Identifiant unique dans la plateforme
- **Source** : Lien ou build qui l'a produit
- **Schéma** : Structure des colonnes (nom, type, nullable)
- **Taille** : Nombre de lignes et de colonnes
- **Dernière mise à jour** : Horodatage du dernier run réussi
- **Fraîcheur** : Indicateur de qualité basé sur l'âge des données

### Accéder à un dataset
Les datasets sont accessibles depuis :
- Le Catalogue (`/portal/projects`) — vue liste avec filtres
- La page d'un pipeline — lien direct vers le dataset produit
- L'assistant IA — via une requête en langage naturel

### Dataset en erreur
Un dataset "en erreur" signifie que son dernier run (ingestion ou build) a échoué. Les données affichées sont celles du dernier run réussi. Pour résoudre l'erreur, consulter le pipeline associé et son journal de build.
