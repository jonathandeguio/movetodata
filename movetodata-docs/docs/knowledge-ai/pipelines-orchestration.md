# Pipelines et Orchestration — Guide complet

## Qu'est-ce qu'un pipeline dans MoveToData ?

Un pipeline dans MoveToData est une séquence d'étapes de traitement de données planifiées automatiquement. Il peut combiner des ingestions (synchronisation depuis des sources externes) et des builds (transformations de code). Les pipelines sont visibles dans le module Orchestration (`/portal/schedules`).

## Statuts d'un pipeline

- **OK** : Le pipeline s'est exécuté avec succès lors du dernier run
- **Running** : Le pipeline est en cours d'exécution
- **Erreur** : Le dernier run a échoué — une action corrective est nécessaire
- **En attente** : Planifié mais pas encore déclenché
- **Désactivé** : Schedule suspendu manuellement

## Causes fréquentes d'erreur pipeline

### Erreurs d'ingestion (lien)
- **Source inaccessible** : L'agent qui se connecte à la source est arrêté ou le réseau est bloqué. Vérifier l'état de l'agent dans les Connecteurs.
- **Identifiants expirés** : Le mot de passe ou token de la source de données a changé. Mettre à jour les credentials dans la configuration de la source.
- **Table ou fichier introuvable** : La table cible a été renommée ou supprimée dans la source. Vérifier la configuration du lien.
- **Quota de stockage dépassé** : Le dataset de destination est trop volumineux. Vérifier l'espace disque disponible.
- **Timeout de connexion** : La source met trop de temps à répondre. Augmenter le timeout ou vérifier la charge de la source.

### Erreurs de build (transformation)
- **Erreur de compilation** : Le code Python/SQL contient une erreur de syntaxe. Consulter le journal de build pour identifier la ligne en erreur.
- **Dataset source introuvable** : Le dataset en entrée du build a été supprimé ou renommé. Vérifier les dépendances dans le code.
- **Erreur Spark** : Problème d'exécution sur le cluster (mémoire insuffisante, nœud indisponible). Consulter les logs Spark dans le journal de build.
- **Erreur de schéma** : Le schéma du dataset source a changé depuis le dernier build réussi. Adapter le code de transformation.
- **Timeout de build** : Le build dépasse la durée maximale configurée. Optimiser le code ou augmenter le timeout.

## Comment diagnostiquer une erreur pipeline

1. Aller dans Orchestration (`/portal/schedules`) → sélectionner le pipeline en erreur
2. Cliquer sur "Historique" pour voir les derniers runs
3. Cliquer sur le run en erreur → consulter le **journal de build**
4. Le journal affiche les commandes exécutées, les warnings et le message d'erreur exact
5. Utiliser l'assistant IA avec le message d'erreur pour obtenir une analyse et des actions correctives

## Comment relancer un pipeline manuellement

1. Dans Orchestration, sélectionner le pipeline
2. Cliquer sur le bouton "Exécuter maintenant" (icône Play)
3. Ou cliquer sur "Build" (icône marteau) depuis le dataset concerné dans le Catalogue

## Planification (Schedules)

Un schedule définit quand et comment un pipeline s'exécute automatiquement.

### Syntaxe cron
Les schedules utilisent la syntaxe cron standard :
- `0 6 * * *` — Tous les jours à 6h
- `0 */4 * * *` — Toutes les 4 heures
- `0 6 * * 1` — Tous les lundis à 6h
- `30 8 1 * *` — Le 1er de chaque mois à 8h30

### Bonnes pratiques de planification
- Décaler les schedules de 15-30 minutes pour éviter les pics de charge simultanés
- Planifier les transformations APRÈS les ingestions dont elles dépendent
- Utiliser des dépendances explicites entre pipelines quand possible
- Surveiller les durées d'exécution pour détecter les dérives de performance

## Dépendances entre pipelines

Un build peut dépendre d'un dataset produit par une ingestion. Dans ce cas :
1. Le schedule du build doit être déclenché APRÈS le schedule de l'ingestion
2. Ou utiliser la fonctionnalité de déclenchement en cascade (trigger on completion)

## Surveillance des pipelines

Le tableau de bord Orchestration affiche :
- Le statut en temps réel de tous les pipelines
- L'heure du dernier run et sa durée
- Le nombre de runs en erreur sur les 7 derniers jours
- Un indicateur visuel (point animé) pour les pipelines en cours d'exécution

La page d'accueil (`/portal/home`) affiche un résumé des pipelines récents avec leur statut.
