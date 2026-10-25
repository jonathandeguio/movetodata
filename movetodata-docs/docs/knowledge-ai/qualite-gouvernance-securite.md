# Qualité des données, Gouvernance et Sécurité

## Data Health — Vérifications de qualité

MoveToData intègre un système de surveillance de la qualité des données (Data Health) qui s'applique automatiquement aux datasets.

### Types de vérifications

**Fraîcheur (Freshness)**
Vérifie que le dataset a été mis à jour dans un délai acceptable.
- Configuration : âge maximum (ex. 24h, 48h, 7j)
- Statut KO si la dernière mise à jour dépasse le seuil
- Cas d'usage : détecter un pipeline silencieusement en panne

**Contenu (Content)**
Vérifie les valeurs des données selon des règles métier.
- Unicité d'une colonne clé (ex. ID client unique)
- Plage de valeurs (ex. prix > 0, âge entre 0 et 120)
- Valeurs non nulles sur les champs obligatoires
- Valeurs dans une liste prédéfinie (ex. statut ∈ {actif, inactif})

**Schéma (Schema)**
Vérifie que la structure du dataset correspond à la structure attendue.
- Présence et nom des colonnes
- Types de données (entier, texte, date, décimal)
- Contraintes (nullable ou non)

**Taille (Size)**
Vérifie que le nombre de lignes est dans une plage normale.
- Nombre de lignes minimum et maximum
- Détecte les ingestions vides (0 lignes) ou anormalement volumineuses

**Statut du job**
Vérifie que le dernier job (ingestion ou build) s'est terminé avec succès dans les délais.

### Alertes
Quand une vérification échoue, une alerte est générée et visible :
- Dans le Catalogue sur le dataset concerné (badge rouge)
- Dans la section Data Health de l'interface
- Dans les KPIs de la page d'accueil (compteur "Alertes ouvertes")

## Gouvernance — Catalogue et Documentation

### Documenter un dataset
Depuis le Catalogue, chaque dataset peut être enrichi avec :
- Une description métier (texte libre)
- Des tags (ex. "finance", "production", "sensible")
- Des propriétaires (utilisateurs responsables du dataset)
- Des glossaires métier (définitions des colonnes)
- Une classification de sensibilité (public, interne, confidentiel)

### Traçabilité (Data Lineage)
Le lineage trace automatiquement la chaîne de dépendances entre datasets :
- D'où viennent les données (source → ingestion → dataset)
- Quelles transformations ont été appliquées
- Quels datasets dépendent de ce dataset

Le graphe de lineage est visualisé sous forme de diagramme Bézier dans l'interface.

### Recherche dans le Catalogue
Le Catalogue permet de rechercher des datasets par :
- Nom (recherche textuelle)
- Tags
- Propriétaire
- Source d'origine
- Statut de santé (OK, alerte, erreur)

## Sécurité — Utilisateurs, Groupes, Permissions

### Gestion des utilisateurs
Les utilisateurs peuvent s'authentifier via :
- Compte local (email + mot de passe)
- OAuth2 (GitHub, Google)
- SAML2 (SSO d'entreprise)

Un administrateur peut créer, désactiver ou supprimer des comptes depuis `/portal/settings/users`.

### Groupes et rôles
Les utilisateurs sont organisés en groupes. Chaque groupe dispose de rôles définissant les permissions :

- **Admin** : Accès complet à tous les modules et à l'administration
- **Data Engineer** : Peut créer/modifier des sources, liens, builds, schedules
- **Data Analyst** : Peut lire les datasets, créer des graphiques et tableaux de bord
- **Viewer** : Accès en lecture seule au Catalogue et aux tableaux de bord

### Permissions sur les ressources
Les permissions peuvent être appliquées au niveau d'une ressource spécifique (dataset, source, pipeline) :
- **Lecture** : Peut voir et requêter le dataset
- **Écriture** : Peut modifier la configuration et déclencher des builds/ingestions
- **Administration** : Peut supprimer la ressource et gérer ses permissions

### Tokens API
Des tokens API peuvent être générés pour accéder programmatiquement à l'API REST de MoveToData. Gestion dans `/portal/settings/tokens`.

- Durée de vie configurable (ou illimitée)
- Scope limitable à certaines ressources
- Révocation immédiate possible

### Sécurité des données sensibles
- Les credentials des sources (mots de passe, clés) sont chiffrés en base
- Les données ne transitent jamais via le frontend (lecture directe depuis Spark)
- Tous les accès sont loggés à des fins d'audit
- La classification "confidentiel" restreint automatiquement l'accès aux groupes autorisés
