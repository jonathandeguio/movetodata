# Analyse et Visualisation — Graphiques et Tableaux de bord

## Principe

Le module Analyse de MoveToData permet de créer des graphiques interactifs et des tableaux de bord directement sur les datasets disponibles dans le Catalogue. Aucune exportation de données n'est nécessaire.

## Créer un graphique

1. Ouvrir un dataset dans le Catalogue
2. Cliquer sur "Visualiser" ou "Nouveau graphique"
3. Sélectionner le type de graphique
4. Configurer les axes, dimensions et mesures
5. Personnaliser le style (couleurs, titres, légendes)
6. Sauvegarder et optionnellement ajouter à un tableau de bord

## Types de graphiques disponibles

### Graphiques de comparaison
- **Barres (Bar Chart)** : Comparaison de valeurs par catégorie. Supports horizontal et vertical.
- **Barres empilées** : Comparaison de composition par catégorie
- **Radar (Radar Chart)** : Comparaison multi-dimensions pour un petit nombre de catégories

### Graphiques temporels
- **Lignes (Line Chart)** : Évolution d'une mesure dans le temps
- **Aires (Area Chart)** : Évolution avec mise en valeur du volume
- **Waterfall** : Visualisation des contributions positives/négatives à une variation totale

### Graphiques de distribution
- **Scatter (Nuage de points)** : Corrélation entre deux mesures
- **Treemap** : Distribution hiérarchique par surface
- **Sunburst** : Distribution hiérarchique en anneaux concentriques

### Indicateurs
- **Big Number** : Affichage d'une KPI unique avec variation
- **Jauge (Gauge)** : Progression vers un objectif (0% à 100%)
- **Table** : Affichage tabulaire avec tri et filtres

### Autres
- **Carte géographique (Map)** : Données géolocalisées sur fond de carte
- **Wordcloud** : Fréquence des termes dans des données textuelles
- **Pie / Donut** : Répartition proportionnelle (usage limité — préférer les barres)

## Statistiques de colonnes

Pour chaque colonne d'un dataset, MoveToData calcule automatiquement des statistiques :
- **Numériques** : min, max, moyenne, médiane, écart-type, percentiles (25e, 75e, 95e)
- **Textuelles** : nombre de valeurs distinctes, valeur la plus fréquente, taux de nulls
- **Dates** : première date, dernière date, étendue temporelle

Ces statistiques sont accessibles depuis le Catalogue → dataset → onglet "Statistiques".

## Tableaux de bord

Un tableau de bord est une collection de graphiques organisés sur une grille. Il peut combiner des graphiques provenant de plusieurs datasets.

### Créer un tableau de bord
1. Analyse → Tableaux de bord → "Nouveau tableau de bord"
2. Glisser-déposer des graphiques existants
3. Redimensionner et organiser les graphiques
4. Ajouter des filtres globaux (un filtre s'applique à tous les graphiques compatibles)
5. Configurer le rafraîchissement automatique si nécessaire

### Partager un tableau de bord
Les tableaux de bord sont partagés selon les permissions de groupe. Un viewer peut consulter les tableaux de bord auxquels il a accès sans pouvoir les modifier.

### Filtres interactifs
Les tableaux de bord supportent des filtres qui s'appliquent en temps réel :
- Filtre par plage de dates
- Filtre par valeur de dimension (liste déroulante)
- Filtre par saisie libre (recherche)

## Intégration avec l'assistant IA

L'assistant IA peut analyser les graphiques ouverts dans l'interface :
- "Explique les tendances visibles dans ce graphique"
- "Y a-t-il des anomalies dans ces données ?"
- "Quelle est la corrélation entre ces deux métriques ?"

L'assistant utilise le contexte des graphiques actifs pour enrichir ses réponses.
