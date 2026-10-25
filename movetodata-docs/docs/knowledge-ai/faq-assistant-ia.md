# FAQ — Questions fréquentes posées à l'assistant IA

Ce document liste les questions les plus fréquentes des utilisateurs de MoveToData et les réponses recommandées.

## Questions sur les pipelines

**Q : Pourquoi mon pipeline est-il en erreur ?**
R : Les causes les plus fréquentes sont : source de données inaccessible (agent déconnecté, credentials expirés), dataset source supprimé ou renommé, erreur Spark (mémoire, timeout), ou erreur de syntaxe dans le code de transformation. Consulter le journal de build du pipeline pour voir le message d'erreur exact.

**Q : Comment relancer un pipeline qui a échoué ?**
R : Dans Orchestration (`/portal/schedules`), sélectionner le pipeline → cliquer sur "Exécuter maintenant". Si c'est un build, il est aussi possible de cliquer sur l'icône Marteau depuis le Catalogue sur le dataset concerné.

**Q : Mon pipeline tourne depuis plus longtemps que d'habitude, est-ce normal ?**
R : Une dérive de durée signale souvent une augmentation du volume de données, une dégradation des performances de la source, ou un problème sur le cluster Spark. Vérifier le volume de données ingérées et comparer avec les runs précédents dans l'historique.

**Q : Comment planifier un pipeline pour qu'il s'exécute tous les jours à 6h ?**
R : Dans Orchestration → Schedules → créer ou modifier le schedule → saisir la cron `0 6 * * *`. Vérifier que le fuseau horaire de la plateforme correspond à votre fuseau local.

**Q : Comment faire pour qu'une transformation s'exécute après une ingestion ?**
R : Deux approches : (1) décaler le schedule du build de 30-60 minutes après le schedule de l'ingestion, ou (2) utiliser un trigger en cascade si disponible (le build se déclenche automatiquement à la fin de l'ingestion).

## Questions sur les datasets

**Q : Comment savoir si un dataset est à jour ?**
R : Dans le Catalogue, chaque dataset affiche la date et l'heure de sa dernière mise à jour. L'indicateur de fraîcheur (Data Health) est rouge si le dataset dépasse le seuil configuré.

**Q : Quelle est la différence entre un dataset d'ingestion et un dataset de transformation ?**
R : Un dataset d'ingestion est produit par l'exécution d'un lien — il contient les données brutes copiées depuis la source externe. Un dataset de transformation est produit par un build — il contient les données après traitement (nettoyage, agrégation, enrichissement).

**Q : Peut-on exporter un dataset ?**
R : Oui, depuis le Catalogue, ouvrir le dataset → utiliser l'export (CSV, Parquet) depuis le menu d'actions. Pour un export automatisé, utiliser l'API REST de MoveToData.

**Q : Pourquoi mon dataset affiche-t-il des données anciennes ?**
R : Le dataset affiche les données du dernier run réussi. Si le pipeline est en erreur ou n'a pas été exécuté récemment, les données ne sont pas rafraîchies. Vérifier le statut du pipeline associé.

## Questions sur l'ingestion

**Q : Comment connecter une base de données PostgreSQL à MoveToData ?**
R : 1) Vérifier que l'agent MoveToData est installé dans le réseau où se trouve PostgreSQL. 2) Créer une nouvelle Source de type PostgreSQL dans Connecteurs. 3) Renseigner hôte, port (5432 par défaut), base de données, identifiants. 4) Tester la connexion. 5) Créer un Lien pointant vers la table à ingérer. 6) Exécuter le lien.

**Q : Faut-il toujours un agent pour connecter une source ?**
R : Non. Un agent est nécessaire seulement si la source n'est pas accessible depuis internet (base de données interne au réseau de l'organisation). Pour les sources cloud (S3, BigQuery, Snowflake, etc.) accessibles publiquement, aucun agent n'est nécessaire.

**Q : Comment ingérer seulement les nouvelles données (ingestion incrémentale) ?**
R : Lors de la configuration du lien, sélectionner le mode "Incrémental" et spécifier la colonne de référence (généralement une colonne de date de mise à jour ou un identifiant auto-incrémenté). MoveToData ingèrera uniquement les lignes plus récentes que le dernier run.

## Questions sur la transformation

**Q : En quoi consiste un build dans MoveToData ?**
R : Un build est l'exécution d'un script Python/PySpark ou SQL sur le cluster Apache Spark. Il lit des datasets en entrée, effectue des transformations, et produit un dataset en sortie. Le résultat est automatiquement disponible dans le Catalogue.

**Q : Quelle est la différence entre Python et SQL pour la transformation ?**
R : SQL est plus adapté aux transformations simples (filtres, agrégations, jointures). Python/PySpark est recommandé pour les transformations complexes, le machine learning, le traitement de données non structurées, ou quand des bibliothèques spécifiques sont nécessaires (pandas, scikit-learn, etc.).

**Q : Mon build échoue avec une erreur "OutOfMemory". Comment résoudre ?**
R : Éviter les opérations qui chargent tout en mémoire (`collect()`, `toPandas()` sur de gros datasets). Préférer les opérations Spark natives (`.groupBy()`, `.agg()`, `.join()`). Si le dataset est vraiment trop volumineux, contacter l'administrateur pour augmenter la mémoire du cluster.

## Questions sur l'assistant IA

**Q : L'assistant IA accède-t-il à mes données réelles ?**
R : L'assistant IA n'accède pas directement aux données contenues dans les datasets. Il peut analyser les métadonnées (noms, schémas, statistiques) et répondre à des questions sur le fonctionnement de la plateforme. Pour l'analyse de données réelles, utiliser le module Analyse avec les graphiques et tableaux de bord.

**Q : Les questions posées à l'assistant sont-elles transmises à l'extérieur ?**
R : Non. L'assistant utilise un LLM auto-hébergé (qwen2.5:14b via Ollama). Aucune donnée ne quitte l'infrastructure MoveToData.

**Q : Comment obtenir de l'aide sur une erreur spécifique ?**
R : Copier le message d'erreur exact depuis le journal de build et le coller dans l'assistant IA. Il analysera l'erreur et proposera des actions correctives adaptées au contexte MoveToData.

## Questions sur la sécurité

**Q : Comment créer un token API ?**
R : Aller dans `/portal/settings/tokens` → "Créer un token" → donner un nom, optionnellement une date d'expiration → copier le token généré (il ne sera plus affiché après fermeture de la fenêtre).

**Q : Comment donner accès à un nouveau collaborateur ?**
R : Aller dans `/portal/settings/users` → "Inviter un utilisateur" → renseigner l'email → sélectionner le groupe approprié (Data Engineer, Data Analyst, Viewer). L'utilisateur reçoit un email d'invitation.

**Q : Comment restreindre l'accès à un dataset sensible ?**
R : Dans le Catalogue, ouvrir le dataset → onglet "Sécurité" → configurer les permissions par groupe ou par utilisateur. Retirer les permissions de lecture pour les groupes non autorisés.
