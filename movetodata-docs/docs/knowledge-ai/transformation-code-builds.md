# Transformation de données — Code, Builds, Branches

## Principe de la transformation

La transformation permet de nettoyer, enrichir, agréger ou restructurer des datasets existants pour en produire de nouveaux. Le code de transformation est écrit en Python/PySpark ou SQL, versionné dans un référentiel Git intégré, et exécuté sur un cluster Apache Spark.

## Langages supportés

### Python / PySpark
PySpark est l'interface Python d'Apache Spark. Il permet de traiter des données volumineuses de manière distribuée.

```python
# Exemple : agrégation simple
df = spark.table("ventes_brutes")
result = df.groupBy("region").agg(
    F.sum("montant").alias("total_ventes"),
    F.count("*").alias("nb_transactions")
)
result.write.saveAsTable("ventes_par_region")
```

### SQL
Le SQL est disponible pour les transformations moins complexes. Il s'exécute sur Spark SQL et supporte la plupart des fonctions SQL standard.

```sql
-- Exemple : vue agrégée
CREATE OR REPLACE TABLE ventes_par_region AS
SELECT
    region,
    SUM(montant) AS total_ventes,
    COUNT(*) AS nb_transactions
FROM ventes_brutes
GROUP BY region;
```

## Référentiel de code (Branches)

Le code de transformation est organisé en **branches**, analogues aux branches Git. Chaque branche correspond à un environnement de travail isolé.

### Branches standards
- **main** : Branche de production. Les builds déployés en production s'exécutent depuis main.
- **develop** : Branche de développement. Pour les nouveaux scripts avant intégration.
- Branches personnalisées : créées par les développeurs pour travailler en isolation.

### Workflow recommandé
1. Créer une branche depuis `develop`
2. Écrire ou modifier le code de transformation
3. Tester avec un build manuel sur la branche
4. Fusionner (merge) vers `develop` puis `main` après validation
5. Planifier le build de production depuis `main`

## Builds

### Qu'est-ce qu'un build ?
Un build est l'exécution d'un script de transformation sur le cluster Spark. Il prend un ou plusieurs datasets en entrée et produit un dataset en sortie.

### Lancer un build
- **Depuis le Catalogue** : Ouvrir le dataset → cliquer sur l'icône Marteau (Build)
- **Depuis l'Orchestration** : Exécuter manuellement le schedule du build
- **Automatiquement** : Via un schedule planifié (cron)

### Journal de build
Le journal de build (`Build Log`) affiche en temps réel :
- Les commandes exécutées par Spark
- Les messages d'information et warnings
- Les erreurs avec le traceback complet
- La durée d'exécution et le statut final

### Historique des builds
L'historique (`/portal/builds`) permet de voir tous les builds passés avec :
- L'identifiant de build
- Le dépôt et la branche
- L'auteur du déclenchement
- L'horodatage et la durée
- Le statut (succès / erreur)

## Erreurs courantes de build et solutions

### AnalysisException: Table not found
**Cause** : Le dataset en entrée a été supprimé ou renommé.
**Solution** : Vérifier le nom du dataset dans le Catalogue et mettre à jour la référence dans le code.

### OutOfMemoryError / GC overhead limit exceeded
**Cause** : Le script traite trop de données en mémoire (collect(), toPandas() sur de gros volumes).
**Solution** : Remplacer `df.collect()` par des opérations Spark natives, augmenter la mémoire executor dans la config.

### ParseException: Syntax error
**Cause** : Erreur de syntaxe dans le code Python ou SQL.
**Solution** : Lire le message d'erreur (ligne et colonne indiquées) et corriger la syntaxe.

### ConnectionError vers la base de données
**Cause** : Le script essaie de se connecter à une source externe non accessible depuis Spark.
**Solution** : Utiliser les datasets déjà ingérés dans MoveToData plutôt que des connexions directes.

### PermissionError sur le dataset de sortie
**Cause** : L'utilisateur qui lance le build n'a pas les droits d'écriture sur le dataset cible.
**Solution** : Vérifier les permissions dans la Sécurité → Ressources.

## Traçabilité (Data Lineage)

MoveToData génère automatiquement le graphe de traçabilité de chaque dataset. Il montre :
- Les sources qui ont alimenté le dataset (via ingestion ou transformation)
- Les datasets qui dépendent de ce dataset (builds en aval)
- Les transformations appliquées à chaque étape

La traçabilité est accessible depuis le Catalogue en cliquant sur "Lineage" sur un dataset.
