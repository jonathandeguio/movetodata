# Specs fonctionnelles et techniques — Features IA MoveToData

> Document PO/Dev — MoveToData v2026-10
> Auteur : Product Owner (Claude Code) — basé sur `.claude/agents/ai.md` et l'architecture existante
> Public cible : développeurs backend/frontend et Product Owner

---

## Préambule technique

### Service IA : `movetodata-ai`

Service Python indépendant exposé en interne sur le port **8090**. Boson (Spring Boot) lui sert de proxy via `/api/ai/**` en propageant le JWT utilisateur. Le service IA doit démarrer et s'arrêter indépendamment de Boson — Boson ne doit jamais crasher si `movetodata-ai` est absent (**graceful degradation obligatoire**).

```
Stack :
  - FastAPI + uvicorn
  - LangChain / LlamaIndex (orchestration LLM)
  - Ollama client (HTTP local, port 11434)
  - sentence-transformers (nomic-embed-text)
  - scikit-learn, Prophet, PyOD, XGBoost
  - SQLAlchemy (accès sources via proxy JDBC ou direct)
  - Redis (cache réponses LLM et embeddings)
```

### Infrastructure GPU — srv-app01

- **GPU** : NVIDIA RTX 5070 Ti — 16 GB VRAM — CUDA 13.2
- **Ollama** : installé en service systemd sur `srv-app01`, port `11434`
- **Modèles pré-chargés** : `qwen2.5-coder:7b` et `qwen2.5:14b` (chargés au démarrage d'Ollama)
- **Charge simultanée** : un seul modèle actif à la fois (swap automatique Ollama) — `qwen2.5-coder:7b` (~4.5 GB VRAM) pour le SQL, `qwen2.5:14b` (~9 GB VRAM) pour le chat et les résumés.

### Contraintes souveraineté — non négociables

- Zéro appel runtime vers OpenAI, Anthropic API US, Google Vertex AI, AWS Bedrock.
- Les données utilisateur ne quittent jamais l'infrastructure MoveToData.
- Aucun SDK tiers ne doit transférer des données à un tiers sans consentement explicite.
- Fallback cloud autorisé uniquement : **Mistral AI API (FR)**, RGPD-OK, données traitées en UE.
- Toute dépendance LLM ou ML doit être Apache 2.0 / MIT / BSD.

### Modèles souverains retenus

| Usage | Modèle | Provider | VRAM | Licence |
|-------|--------|----------|------|---------|
| Text-to-SQL | `qwen2.5-coder:7b` | Ollama self-hosted | ~4.5 GB | Apache 2.0 |
| Chat général / Résumé | `qwen2.5:14b` | Ollama self-hosted | ~9 GB | Apache 2.0 |
| Embeddings | `nomic-embed-text` | Ollama self-hosted | <1 GB | Apache 2.0 |
| Forecasting | Prophet | Self-hosted Python | CPU | MIT |
| Anomaly detection | IsolationForest | scikit-learn self-hosted | CPU | BSD |
| Fallback cloud EU | `mistral-small` | Mistral AI (FR) | — | Commercial RGPD-OK |

> **Pourquoi Qwen2.5 ?** La famille Qwen2.5 (Alibaba, Apache 2.0) surpasse les modèles de taille équivalente sur les benchmarks SQL (Spider, BIRD) et sur le raisonnement multilingue FR/EN. `qwen2.5-coder:7b` est spécialisé génération de code/SQL ; `qwen2.5:14b` offre le meilleur ratio qualité/VRAM pour le chat sur une carte 16 GB.

---

## F1 — Text-to-SQL

**Priorité** : P1
**Effort estimé** : M
**Dépendances** : Au moins une source JDBC active (PostgreSQL, MySQL, Snowflake, etc.), `JdbcUtils.isValidDQLQuery` opérationnel, service `movetodata-ai` déployé, Ollama avec `qwen2.5-coder:7b` chargé.

### User story

En tant qu'analyste de données, je veux poser une question en langage naturel sur ma source connectée afin d'obtenir un graphique sans écrire de SQL.

### Parcours utilisateur (happy path)

1. L'utilisateur ouvre le module **Explorer** et sélectionne une source active.
2. Il clique sur le bouton "Demander à l'IA" (icône assistant, barre supérieure d'Explorer).
3. Une zone de saisie textuelle apparaît au-dessus de la grille de résultats.
4. Il tape : "Quel est le chiffre d'affaires par région ce mois-ci ?"
5. Un indicateur de chargement s'affiche pendant la génération SQL (max 10 s).
6. Le SQL généré est affiché dans un panneau repliable "SQL généré" (lecture seule par défaut).
7. La requête s'exécute automatiquement ; les résultats s'affichent dans la grille Explorer.
8. Un bouton "Visualiser dans Kepler" permet d'envoyer le résultat vers le module **Kepler** comme un graphique standard.
9. En cas de SQL invalide ou refusé par la whitelist DQL, un message d'erreur explicite s'affiche avec suggestion de reformuler.

### Critères d'acceptation

- [ ] La question est envoyée au endpoint `/api/ai/text-to-sql` avec `sourceId` et `question`.
- [ ] Le schéma de la source (nom des tables, colonnes, types) est injecté dans le prompt LLM sans envoyer de données réelles.
- [ ] Le SQL généré est systématiquement validé par `JdbcUtils.isValidDQLQuery` avant toute exécution ; toute requête non-DQL (INSERT, UPDATE, DROP…) est rejetée.
- [ ] La confiance (`confidence`) est affichée à l'utilisateur (ex : "Confiance : 92 %").
- [ ] Si `confidence < 0.6`, un avertissement "Vérifiez le SQL avant exécution" est affiché.
- [ ] L'utilisateur peut modifier le SQL dans le panneau dédié avant de relancer l'exécution.
- [ ] Le résultat peut être envoyé vers Kepler en un clic et s'affiche comme un graphique ECharts standard.
- [ ] La fonctionnalité est désactivée (bouton grisé + tooltip explicatif) si aucune source JDBC n'est active.
- [ ] Aucun contenu des tables (lignes de données) n'est envoyé au LLM — uniquement le schéma.
- [ ] Le modèle utilisé (`qwen2.5-coder:7b` via Ollama) est loggué côté `movetodata-ai` pour audit.
- [ ] Un test d'intégration couvre le endpoint avec un mock LLM (pas de dépendance Ollama en CI).

### Contraintes souveraineté

- Seul le **schéma** (DDL, noms de colonnes, types) est transmis au LLM — jamais les données ligne par ligne.
- Le modèle `qwen2.5-coder:7b` tourne en local via Ollama sur `srv-app01` ; si Ollama est indisponible, le fallback est `mistral-small` via Mistral AI FR (pas d'autre fallback autorisé).
- Le schéma est extrait côté Boson via `SourceService` et passé au service IA en payload — il ne transite pas par un tiers.

### Prompt système (référence)

```
You are an expert SQL assistant. Given the following database schema, generate a single valid SQL SELECT query that answers the user's question. Return ONLY the SQL query, nothing else.

Schema:
{schema_ddl}

Rules:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, CREATE)
- Use table and column names exactly as defined in the schema
- Prefer ANSI SQL compatible with PostgreSQL
- If the question cannot be answered with the schema, respond with: CANNOT_ANSWER
```

### Wireframe / comportement UI

**Module : Explorer**

- Barre supérieure d'Explorer : ajout d'un bouton "IA" à droite du sélecteur de source. Clic : affiche une zone `<textarea>` sur une ligne, placeholder "Posez votre question en français ou anglais…".
- Sous la zone de saisie : bouton "Générer le SQL" + indicateur spinner pendant l'appel.
- Panneau repliable "SQL généré" (accordéon, fermé par défaut) : affiche le SQL en monospace, bouton "Copier", bouton "Modifier" (active l'édition inline), bouton "Exécuter".
- Badge de confiance affiché à droite du titre du panneau (vert > 80 %, orange 60-80 %, rouge < 60 %).
- Résultats affichés dans la grille Explorer existante.
- Bouton "Ouvrir dans Kepler" dans la barre de résultats — comportement identique à l'envoi manuel d'une `KeplerQuery`.

### Interface API (résumé)

```
POST /api/ai/text-to-sql
Authorization: Bearer {jwt}

Payload :
{
  "sourceId": 42,
  "question": "Quel est le CA par région ce mois-ci ?"
}

Réponse 200 :
{
  "sql": "SELECT region, SUM(ca) FROM ventes WHERE date >= DATE_TRUNC('month', NOW()) GROUP BY region",
  "confidence": 0.92,
  "model": "qwen2.5-coder:7b",
  "tokensUsed": 312
}

Réponse 400 (SQL non-DQL ou requête refusée) :
{
  "error": "INVALID_DQL",
  "message": "La requête générée n'est pas une requête de lecture. Reformulez votre question.",
  "generatedSql": "DROP TABLE ventes"
}

Réponse 503 (Ollama indisponible, pas de fallback configuré) :
{
  "error": "LLM_UNAVAILABLE",
  "message": "Le service IA est temporairement indisponible."
}
```

Proxy Boson : `POST /api/ai/text-to-sql` → délègue à `movetodata-ai:8090/text-to-sql` avec le JWT propagé.

---

## F2 — Augmented Analytics

**Priorité** : P1
**Effort estimé** : L
**Dépendances** : Source active avec données tabulaires, service `movetodata-ai` déployé, Prophet + scikit-learn + PyOD installés, module Kepler opérationnel (affichage `InsightCard` et `AnomalyBadge`).

### User story

En tant qu'analyste, je veux que la plateforme détecte automatiquement des anomalies, génère des prévisions et segmente mes données afin de gagner du temps sur l'analyse exploratoire.

### Parcours utilisateur (happy path)

1. L'utilisateur ouvre un graphique existant dans **Kepler** ou sélectionne une colonne dans **Explorer**.
2. Un bouton "Analyser avec l'IA" (ou icône sparkle) est visible dans la barre d'outils du graphique.
3. Un panneau latéral s'ouvre avec 4 onglets : "Anomalies", "Prévision", "Segments", "Résumé".
4. L'utilisateur sélectionne l'onglet "Anomalies" et choisit les colonnes X (date) et Y (valeur).
5. Il clique "Lancer l'analyse" ; un spinner s'affiche pendant le calcul (max 30 s pour datasets < 100k lignes).
6. Les points anomaliques sont mis en évidence sur le graphique Kepler avec un `AnomalyBadge` (point rouge cerclé).
7. Une `InsightCard` apparaît sous le graphique : "3 anomalies détectées entre le 12 et le 15 mars 2026. Pic inhabituel de +230 % sur la métrique CA."
8. Pour l'onglet "Prévision" : l'utilisateur choisit l'horizon (7 / 30 / 90 jours) et la prévision s'ajoute au graphique en pointillés avec intervalle de confiance.
9. Pour "Segments" : le résultat du clustering s'affiche comme un scatter plot coloré par segment dans Kepler.
10. Pour "Résumé" : un texte généré par LLM décrit le dataset en 3-5 phrases.

### Critères d'acceptation

- [ ] Les 4 types d'analyse (`anomaly`, `forecast`, `cluster`, `summary`) sont implémentés et testés indépendamment.
- [ ] Détection d'anomalies : IsolationForest (scikit-learn) avec seuil de contamination configurable (défaut : 5 %) ; résultat : liste d'index de lignes anomaliques + score.
- [ ] Forecasting : Prophet avec intervalles de confiance (80 % et 95 %) ; les points futurs sont distingués visuellement (trait pointillé).
- [ ] Clustering : K-Means (k auto-détecté par elbow method, max k=10) ou DBSCAN si données non-convexes ; chaque cluster est coloré différemment dans Kepler.
- [ ] Résumé textuel généré par `qwen2.5:14b` à partir des statistiques descriptives du dataset — jamais à partir des données brutes ligne par ligne.
- [ ] Les résultats IA sont retournés comme des `KeplerQuery` standards et s'intègrent au pipeline de rendu ECharts existant.
- [ ] `AnomalyBadge` apparaît sur les graphiques de type line/bar quand des anomalies sont présentes.
- [ ] `InsightCard` est cliquable et affiche le détail de l'insight (valeur, date, écart).
- [ ] L'analyse est limitée à 100 000 lignes par appel (au-delà, message d'avertissement + échantillonnage automatique).
- [ ] Le temps de réponse est inférieur à 30 s pour < 10 000 lignes, inférieur à 90 s pour < 100 000 lignes.
- [ ] Aucune ligne de données brute n'est transmise au LLM pour le résumé — uniquement les statistiques descriptives (min, max, moyenne, écart-type, p25, p75, shape).
- [ ] Tests d'intégration avec datasets de fixtures pour chaque type d'analyse.

### Contraintes souveraineté

- Les calculs d'anomalies, forecasting et clustering sont réalisés **entièrement localement** (scikit-learn, Prophet, PyOD) — zéro appel LLM pour ces traitements.
- Le LLM (`qwen2.5:14b` via Ollama) est appelé uniquement pour le résumé textuel, et uniquement avec des statistiques agrégées (pas de données individuelles).
- Si le LLM est indisponible, les 3 autres analyses (anomaly, forecast, cluster) restent disponibles — le résumé affiche "Service IA indisponible" sans bloquer les autres fonctions.

### Wireframe / comportement UI

**Module : Kepler (graphiques existants) + Explorer**

- Barre d'outils graphique Kepler : icône "IA / sparkle" à côté des icônes d'export existantes.
- Clic : panneau latéral droit (drawer, 400 px) avec 4 onglets.
- Onglet Anomalies : sélecteurs colonne X / Y + bouton "Détecter" + affichage liste d'anomalies (date, valeur, score) + overlay sur le graphique principal.
- Onglet Prévision : sélecteur horizon + bouton "Prévoir" + ajout de la série "Prévision" au graphique Kepler (pointillés bleus, zone de confiance semi-transparente).
- Onglet Segments : sélecteurs colonnes X / Y + bouton "Segmenter" + nouveau graphique scatter dans Kepler coloré par cluster.
- Onglet Résumé : bouton "Générer le résumé" + affichage texte dans une card grisée.
- `AnomalyBadge` : pastille rouge avec nombre d'anomalies, affichée en haut à droite de chaque graphique concerné. Clic : ouvre le drawer sur l'onglet Anomalies.
- `InsightCard` : carte sous le graphique (fond bleu pâle), titre + corps texte + lien "Voir les détails".

### Interface API (résumé)

```
POST /api/ai/insights
Authorization: Bearer {jwt}

Payload :
{
  "sourceId": 42,
  "columnX": "date",
  "columnY": "ca",
  "type": "anomaly" | "forecast" | "cluster" | "summary",
  "options": {
    "forecastHorizon": 30,
    "clusterK": null,
    "anomalyContamination": 0.05
  }
}

Réponse 200 (anomaly) :
{
  "type": "anomaly",
  "insights": [
    { "rowIndex": 142, "date": "2026-03-12", "value": 48200, "score": 0.91 }
  ],
  "chartData": { /* KeplerQuery overlay */ },
  "model": "IsolationForest (scikit-learn 1.4)"
}

Réponse 200 (forecast) :
{
  "type": "forecast",
  "insights": [ { "date": "2026-08-01", "predicted": 52000, "lower": 44000, "upper": 61000 } ],
  "chartData": { /* série Kepler supplémentaire */ },
  "model": "Prophet 1.1.5"
}

Réponse 200 (summary) :
{
  "type": "summary",
  "text": "Ce jeu de données couvre 18 mois de ventes et contient 3 segments distincts...",
  "model": "qwen2.5:14b (Ollama)"
}
```

---

## F3 — Assistant IA conversationnel

**Priorité** : P2
**Effort estimé** : L
**Dépendances** : F1 (Text-to-SQL) opérationnel, PostgreSQL disponible pour persistance historique, service `movetodata-ai` déployé avec SSE activé, module Kepler opérationnel.

### User story

En tant qu'utilisateur de la plateforme, je veux pouvoir dialoguer avec un assistant IA dans une sidebar persistante afin d'explorer mes données, générer des graphiques et comprendre mes résultats sans changer d'outil.

### Parcours utilisateur (happy path)

1. L'utilisateur clique sur l'icône "Assistant IA" dans la navigation globale (disponible dans Kepler, Explorer, Connect).
2. Une sidebar de chat s'ouvre à droite (300-400 px, superposée ou push du contenu selon la résolution).
3. L'historique de la session courante est chargé depuis PostgreSQL (les 50 derniers messages max).
4. Le contexte actif (source ouverte + graphiques visibles) est affiché en header de la sidebar.
5. L'utilisateur tape "Montre-moi les ventes du mois dernier par produit sous forme de camembert."
6. La réponse arrive en streaming (SSE) — les tokens s'affichent progressivement.
7. L'assistant génère le SQL (F1), exécute la requête et insère un graphique en camembert directement dans la sidebar (miniature) avec un bouton "Ouvrir dans Kepler".
8. L'utilisateur demande "Pourquoi la région Nord sous-performe ?" — l'assistant répond avec une analyse textuelle et suggère un drill-down.
9. L'utilisateur peut effacer l'historique de la conversation avec un bouton "Nouvelle conversation".
10. La sidebar est fermable et rouvrira au même état (contexte + historique) lors de la prochaine ouverture.

### Critères d'acceptation

- [ ] La sidebar `AiAssistant` est accessible depuis Kepler, Explorer et Connect sans rechargement de page.
- [ ] L'historique de conversation est persisté par utilisateur dans PostgreSQL (table `ai_chat_messages`, soft-delete sur "Nouvelle conversation").
- [ ] Le contexte IA inclut : `sourceId` actif, liste des `chartId` ouverts dans Kepler, et le schéma de la source (pas les données).
- [ ] Les réponses sont streamées via Server-Sent Events (SSE) ; chaque token est affiché dès réception.
- [ ] L'assistant peut : générer un graphique (délègue à F1 + Kepler), décrire un résultat, suggérer des analyses (délègue à F2), répondre en langage naturel.
- [ ] Les graphiques générés dans la sidebar sont des miniatures cliquables qui ouvrent le graphique complet dans Kepler.
- [ ] Le bouton "Nouvelle conversation" efface l'affichage et crée une nouvelle session (soft-delete des messages précédents en base, non supprimés physiquement).
- [ ] L'historique est limité à 50 messages chargés ; les messages plus anciens sont archivés et accessibles via un bouton "Charger plus".
- [ ] Si `movetodata-ai` est indisponible, la sidebar affiche un message "Assistant temporairement indisponible" sans crasher la page.
- [ ] Le modèle utilisé est loggué pour chaque message (audit souveraineté).
- [ ] Tests : mock SSE en CI pour valider le streaming sans dépendance Ollama.

### Contraintes souveraineté

- Le contexte transmis au LLM contient le schéma de source et l'historique de conversation — jamais les données ligne par ligne.
- L'historique de conversation est stocké en PostgreSQL sur l'infrastructure MoveToData — pas de stockage côté provider LLM.
- Modèle principal : `qwen2.5:14b` via Ollama self-hosted. Fallback : `mistral-small` via Mistral AI FR.
- La sidebar n'intègre aucun SDK tiers de chat (pas de Intercom, Crisp, Drift ou équivalent US).

### Wireframe / comportement UI

**Disponible dans : Kepler, Explorer, Connect**

- Icône "bulle de chat + étoile" dans la barre de navigation globale (en haut à droite), persistante sur tous les modules.
- Clic : sidebar droite animée (slide-in, 380 px de large). Sur mobile / petit écran : overlay plein écran.
- Header sidebar : nom de la source active + indicateur "3 graphiques ouverts" (contextuel). Bouton "Fermer" (X) + bouton "Nouvelle conversation" (icône crayon).
- Zone de messages : scroll vertical, bulles utilisateur (droite, fond bleu) et bulles assistant (gauche, fond gris).
- Streaming : les tokens apparaissent progressivement ; un curseur clignotant indique la génération en cours.
- Graphiques inline : miniature ECharts 200×120 px dans la bulle assistant. Bouton "Ouvrir dans Kepler" sous la miniature.
- Zone de saisie : `<textarea>` auto-resize (1-4 lignes), bouton Envoyer, raccourci `Ctrl+Entrée`.
- État vide (nouvelle conversation) : 3 suggestions de questions prédéfinies selon la source active (ex : "Quelle est la tendance des 30 derniers jours ?").

### Interface API (résumé)

```
POST /api/ai/chat   (SSE streaming)
Authorization: Bearer {jwt}
Content-Type: application/json
Accept: text/event-stream

Payload :
{
  "sessionId": "uuid-v4",
  "message": "Montre-moi les ventes du mois dernier par produit sous forme de camembert.",
  "context": {
    "sourceId": 42,
    "openChartIds": [101, 102]
  }
}

Flux SSE (chunks) :
data: {"type": "token", "content": "Voici"}
data: {"type": "token", "content": " les ventes"}
data: {"type": "chart", "keplerQuery": { /* KeplerQuery standard */ }}
data: {"type": "done", "model": "qwen2.5:14b", "tokensUsed": 487}

Réponse erreur (non-streaming) :
HTTP 503 : { "error": "LLM_UNAVAILABLE" }

GET /api/ai/chat/history?sessionId={uuid}&limit=50
→ { "messages": [ { "role": "user"|"assistant", "content": "...", "createdAt": "..." } ] }

DELETE /api/ai/chat/session/{sessionId}  (soft-delete)
→ HTTP 204
```

---

## F4 — Smart Connector

**Priorité** : P2
**Effort estimé** : S
**Dépendances** : Module Connect opérationnel, au moins un connecteur JDBC actif, service `movetodata-ai` déployé, 25 types de graphiques Kepler disponibles.

### User story

En tant qu'administrateur ou analyste connectant une nouvelle source de données, je veux que la plateforme me suggère automatiquement les graphiques les plus pertinents et m'informe de la qualité des données afin de démarrer l'analyse immédiatement après la connexion.

### Parcours utilisateur (happy path)

1. L'utilisateur est dans le module **Connect** et vient de valider la connexion à une nouvelle source (ex : base PostgreSQL "ventes_2026").
2. Au lieu d'arriver sur une page vide, un écran "Analyse de votre source" s'affiche pendant 5-15 s avec une barre de progression.
3. La plateforme affiche 3 sections :
   - **Score qualité données** : jauge globale (0-100) avec détail par dimension (complétude, doublons, outliers).
   - **Types de données détectés** : badges colorés (time series, catégoriel, numérique, géographique).
   - **Graphiques suggérés** : 3 à 6 miniatures de graphiques Kepler pré-configurés, avec titre explicatif.
4. L'utilisateur clique sur "Ouvrir dans Kepler" sur l'une des suggestions.
5. Le graphique s'ouvre dans Kepler avec la configuration pré-remplie (colonnes, type de graphique).
6. L'utilisateur peut ignorer les suggestions et aller directement dans Explorer.

### Critères d'acceptation

- [ ] L'analyse Smart Connector est déclenchée automatiquement à chaque nouvelle connexion réussie dans Connect.
- [ ] Le score qualité est calculé sur un échantillon de 1 000 lignes maximum (pas de scan complet de la source).
- [ ] Dimensions du score qualité : complétude (% de valeurs non-nulles), unicité (% de doublons), cohérence des types, ratio d'outliers.
- [ ] La détection de type de données (time series, catégoriel, numérique, géographique) est basée sur les noms de colonnes + types SQL + distribution des valeurs sur l'échantillon.
- [ ] Les suggestions de graphiques sont choisies parmi les 25 types disponibles dans Kepler.
- [ ] Chaque suggestion contient : type de graphique, colonnes pré-sélectionnées, titre suggéré, raison de la suggestion (1 phrase).
- [ ] Les titres de graphiques suggérés peuvent être générés par `qwen2.5:14b` si Ollama est disponible (sinon titre heuristique).
- [ ] Le bouton "Ouvrir dans Kepler" crée un graphique Kepler pré-configuré avec les colonnes suggérées.
- [ ] L'analyse est rejouable manuellement depuis l'écran de détail d'une source dans Connect (bouton "Ré-analyser la source").
- [ ] Si l'analyse échoue (timeout, erreur), la connexion reste valide et l'utilisateur accède à Connect normalement.
- [ ] Le score qualité est affiché de façon permanente dans la liste des sources de Connect (badge coloré sur chaque source).
- [ ] Tests : fixture avec un dataset de qualité connue pour valider le scoring.

### Contraintes souveraineté

- L'analyse est entièrement locale (scikit-learn + règles heuristiques Python) — aucun LLM n'est appelé pour le scoring qualité et la détection de type.
- Le LLM (`qwen2.5:14b` via Ollama) peut être appelé optionnellement pour générer les titres de graphiques suggérés (uniquement avec les métadonnées schéma + types détectés, pas les données).
- L'échantillon de 1 000 lignes ne quitte jamais l'infrastructure MoveToData.

### Wireframe / comportement UI

**Module : Connect — écran post-connexion**

- Après validation d'une connexion dans Connect, redirection vers une page intermédiaire "Analyse de votre source [Nom source]" au lieu d'un retour immédiat à la liste.
- Barre de progression animée (3 étapes : "Lecture du schéma", "Analyse qualité", "Suggestions de graphiques").
- Section Score qualité : grande jauge circulaire centrale (score global 0-100, couleur : rouge < 40, orange 40-70, vert > 70) + 4 jauges linéaires en dessous (complétude, unicité, cohérence, outliers).
- Section Types détectés : badges horizontaux ("Séries temporelles", "Données catégorielles", "Valeurs géographiques"…) avec icône.
- Section Graphiques suggérés : grille 3 colonnes de cards. Chaque card : miniature de graphique (placeholder ECharts), titre, raison, bouton "Ouvrir dans Kepler".
- Bouton "Ignorer et aller dans Explorer" (lien secondaire en bas de page).
- Dans la liste des sources Connect : badge qualité (vert/orange/rouge) affiché sur chaque source. Tooltip au hover : détail des 4 dimensions.

### Interface API (résumé)

```
POST /api/ai/smart-connector/analyze
Authorization: Bearer {jwt}

Payload :
{
  "sourceId": 42,
  "sampleSize": 1000
}

Réponse 200 :
{
  "qualityScore": {
    "global": 78,
    "completeness": 92,
    "uniqueness": 85,
    "consistency": 71,
    "outlierRatio": 0.03
  },
  "detectedTypes": ["time_series", "categorical", "numeric"],
  "chartSuggestions": [
    {
      "chartType": "line",
      "columnX": "date",
      "columnY": "ca",
      "title": "Évolution du CA dans le temps",
      "reason": "Colonne 'date' détectée comme série temporelle (format ISO-8601, 365 valeurs distinctes)."
    },
    {
      "chartType": "bar",
      "columnX": "region",
      "columnY": "ca",
      "title": "CA par région",
      "reason": "Colonne 'region' catégorielle avec 8 modalités."
    }
  ],
  "analyzedAt": "2026-10-03T14:32:00Z",
  "model": "heuristic+scikit-learn (qwen2.5:14b pour titres)"
}

GET /api/ai/smart-connector/score/{sourceId}
→ { "qualityScore": { ... }, "analyzedAt": "..." }
```

---

---

## F5 — Import de fichiers & analyse IA

**Priorité** : P1
**Effort estimé** : M
**Dépendances** : Service `movetodata-ai` déployé, module `file` de stockage opérationnel (`${MOVETODATA_MOUNT_PATH}/file`), Boson endpoint upload multipart, module Kepler opérationnel, Flyway migration pour la table `uploaded_source`.

### User story

En tant qu'analyste, je veux glisser-déposer un fichier Excel, CSV ou PDF directement dans la plateforme afin d'obtenir immédiatement un rapport automatique, des recommandations et un dataset réutilisable — sans passer par un connecteur.

### Formats supportés

| Format | Extension | Parsing | Limite |
|--------|-----------|---------|--------|
| Excel | `.xlsx`, `.xls` | pandas / openpyxl | 50 MB, 500k lignes |
| CSV / TSV | `.csv`, `.tsv` | pandas | 100 MB, 1M lignes |
| JSON tabulaire | `.json`, `.jsonl` | pandas | 50 MB |
| Parquet | `.parquet` | pandas / pyarrow | 200 MB |
| PDF (tableaux) | `.pdf` | pdfplumber + pandas | 20 MB, 10 feuilles |

### Parcours utilisateur (happy path)

1. L'utilisateur glisse un fichier `.xlsx` sur la zone de drop (disponible dans Explorer, Connect, et l'Assistant F3).
2. Une modale "Import en cours" affiche la progression : "Lecture du fichier → Analyse de la structure → Génération du rapport".
3. En moins de 15 s pour un fichier < 10 MB, la plateforme affiche :
   - **Aperçu du tableau** : les 10 premières lignes avec types de colonnes détectés.
   - **Rapport automatique** : résumé textuel (LLM), statistiques clés (lignes, colonnes, valeurs manquantes, doublons), 3-5 graphiques générés automatiquement dans Kepler.
   - **Recommandations** : liste de 3 à 5 actions suggérées par le LLM ("Nettoyer 12 % de valeurs nulles dans 'CA'", "Créer un graphique de tendance sur la colonne 'date'", "Fusionner avec la source 'clients' via la clé 'id_client'").
4. L'utilisateur clique "Créer un dataset" → le fichier est persisté en base comme une nouvelle source de type `FILE`, accessible depuis Connect et Explorer.
5. Il peut aussi cliquer "Ouvrir dans Kepler" pour explorer les graphiques générés directement.
6. Le fichier importé reste disponible dans la liste des sources Connect avec le badge "Import fichier".

### Critères d'acceptation

- [ ] Zone de drop disponible dans Explorer (barre latérale), Connect (bouton "+ Importer un fichier"), et sidebar Assistant IA (F3).
- [ ] Formats acceptés : `.xlsx`, `.xls`, `.csv`, `.tsv`, `.json`, `.jsonl`, `.parquet`, `.pdf` — fichiers non reconnus affichent un message d'erreur clair.
- [ ] Le fichier est uploadé via `POST /api/files/upload` (multipart) vers Boson, stocké dans `${MOVETODATA_MOUNT_PATH}/file/{uuid}/`, jamais dans la RAM du service IA.
- [ ] L'analyse est déléguée à `movetodata-ai` via `POST /api/ai/analyze-file` avec le `fileId` — le service IA lit le fichier depuis le stockage partagé, sans retransmettre le fichier par HTTP.
- [ ] Le rapport contient : nb lignes, nb colonnes, % valeurs manquantes par colonne, nb doublons, types détectés, top-5 corrélations si numériques.
- [ ] Le résumé textuel (LLM `qwen2.5:14b`) est généré à partir des **statistiques** uniquement — jamais à partir du contenu brut des cellules.
- [ ] 3 à 5 graphiques Kepler sont auto-générés et ouverts dans un nouveau tableau de bord nommé "Import — {nom du fichier}".
- [ ] Les recommandations sont générées par `qwen2.5:14b` à partir des statistiques + noms de colonnes — format : liste JSON `[{"action": "...", "priority": "high|medium|low", "reason": "..."}]`.
- [ ] "Créer un dataset" crée une entrée `Source` de type `FILE` en base (Boson), visible dans Connect et Explorer avec icône dédiée.
- [ ] Pour les fichiers Excel multi-feuilles : sélecteur de feuille affiché avant l'analyse, avec aperçu du nombre de lignes par feuille.
- [ ] Limite de taille affichée dans la UI avant l'upload ; fichiers trop grands affichent une erreur explicite avec la limite.
- [ ] Le fichier est stocké chiffré au repos (AES-256 si `BACKING_FS=localfs` avec chiffrement activé).
- [ ] Un test d'intégration couvre l'upload + parsing d'un fixture `.xlsx` et `.csv` sans dépendance LLM.

### Contraintes souveraineté

- Le fichier ne quitte jamais l'infrastructure MoveToData — aucun envoi vers un service tiers pour parsing ou analyse.
- Le LLM (`qwen2.5:14b`) ne reçoit que des statistiques agrégées et les noms de colonnes — jamais le contenu des cellules.
- Les fichiers uploadés sont isolés par utilisateur (chemin `file/{userId}/{uuid}/`) et soumis aux droits d'accès Boson existants.

### Wireframe / comportement UI

**Zone de drop — Explorer et Connect**

- Rectangle en pointillés avec icône "nuage + flèche" et texte "Glissez un fichier ici ou cliquez pour parcourir". Formats supportés listés en sous-titre (xlsx, csv, pdf…).
- Progress bar 3 étapes : "Envoi du fichier" → "Analyse de la structure" → "Génération du rapport".
- Sur mobile : bouton "Importer un fichier" (pas de drag-and-drop).

**Modale de résultat (après analyse)**

- Onglet 1 "Aperçu" : tableau pageable (10 lignes), badges de type sur chaque colonne (date, texte, nombre, booléen), indicateur % de nulls sur chaque colonne.
- Onglet 2 "Rapport" : résumé textuel LLM (card grisée), métriques clés en grid (lignes, colonnes, doublons, nulls), mini-graphiques inline (sparklines ECharts).
- Onglet 3 "Recommandations" : liste de cards, chaque card avec titre action, raison, badge priorité (rouge/orange/vert). Checkbox pour sélectionner les recommandations à appliquer.
- Onglet 4 "Graphiques" : 3-5 miniatures ECharts 200×150 px, bouton "Ouvrir dans Kepler" sous chaque graphique.
- Footer modale : bouton primaire "Créer un dataset" + bouton secondaire "Fermer sans enregistrer".

**Feuilles Excel**

- Si le fichier contient plusieurs feuilles : étape intermédiaire "Sélectionner une feuille" avec liste des feuilles (nom + nb lignes estimé) avant de lancer l'analyse.

### Interface API (résumé)

```
POST /api/files/upload
Authorization: Bearer {jwt}
Content-Type: multipart/form-data

Body : fichier binaire (champ "file")

Réponse 201 :
{
  "fileId": "uuid-v4",
  "filename": "ventes_2026.xlsx",
  "sizeBytes": 4200000,
  "storagePath": "/opt/movetodata/data/file/{userId}/{uuid}/ventes_2026.xlsx",
  "uploadedAt": "2026-10-03T10:00:00Z"
}

---

POST /api/ai/analyze-file
Authorization: Bearer {jwt}

Payload :
{
  "fileId": "uuid-v4",
  "sheet": "Feuil1"   // optionnel, pour Excel multi-feuilles
}

Réponse 200 :
{
  "fileId": "uuid-v4",
  "filename": "ventes_2026.xlsx",
  "stats": {
    "rows": 12450,
    "columns": 8,
    "missingByColumn": { "ca": 0.03, "region": 0.0 },
    "duplicates": 12,
    "detectedTypes": { "date": "time_series", "ca": "numeric", "region": "categorical" },
    "topCorrelations": [{ "col1": "ca", "col2": "quantite", "r": 0.87 }]
  },
  "summary": "Ce fichier contient 12 450 lignes de données de ventes couvrant 3 régions...",
  "recommendations": [
    { "action": "Nettoyer les 373 valeurs nulles dans la colonne 'ca'", "priority": "high", "reason": "3 % de nulls peut fausser les agrégats." },
    { "action": "Créer un graphique de tendance mensuelle sur 'date' × 'ca'", "priority": "medium", "reason": "Colonne temporelle détectée avec fréquence mensuelle." }
  ],
  "chartSuggestions": [
    { "chartType": "line", "columnX": "date", "columnY": "ca", "title": "Évolution du CA" }
  ],
  "model": "qwen2.5:14b (Ollama)"
}

---

POST /api/sources/from-file
Authorization: Bearer {jwt}

Payload :
{
  "fileId": "uuid-v4",
  "sourceName": "Ventes 2026",
  "sheet": "Feuil1"
}

Réponse 201 :
{
  "sourceId": 99,
  "sourceName": "Ventes 2026",
  "type": "FILE",
  "createdAt": "2026-10-03T10:05:00Z"
}
```

---

## Tableau récapitulatif

| Feature | Priorité | Effort | Valeur métier | Modèle LLM |
|---------|----------|--------|---------------|------------|
| F1 — Text-to-SQL | P1 | M | Accès données sans SQL — différenciateur vs Metabase (absent) et argument Palantir (Apollo). | `qwen2.5-coder:7b` |
| F2 — Augmented Analytics | P1 | L | Insights proactifs sans configuration — valeur immédiate pour les analystes métier. | `qwen2.5:14b` (résumé seul) |
| F3 — Assistant conversationnel | P2 | L | Réduction du time-to-insight — interface unifiée pour toutes les analyses. | `qwen2.5:14b` |
| F4 — Smart Connector | P2 | S | Réduction du time-to-first-chart après connexion — améliore l'onboarding et réduit le churn. | `qwen2.5:14b` (titres, optionnel) |
| F5 — Import fichiers & analyse IA | P1 | M | Onboarding zéro-friction — analyse immédiate sans connecteur, création de dataset en 1 clic. | `qwen2.5:14b` |

---

## Recommandation de séquençage sprint

### Sprint 1 — Infrastructure IA + F4 + F5 upload (2 semaines)

Déployer le service `movetodata-ai` (FastAPI, Ollama client, Redis) et intégrer le proxy Boson `/api/ai/**`. Vérifier que Ollama sur `srv-app01` expose bien `qwen2.5-coder:7b` et `qwen2.5:14b` sur port 11434. Implémenter F4 en parallèle (effort S, aucune dépendance LLM forte). Démarrer F5 côté Boson : endpoint upload multipart + stockage fichier + parsing pandas (sans LLM) pour valider la pipeline d'ingestion.

### Sprint 2 — F1 Text-to-SQL + F5 rapport LLM (2 semaines)

F1 est la feature la plus visible pour démontrer Qwen2.5-coder. Elle réutilise `JdbcUtils` existant et valide le pattern LLM → KeplerQuery. En parallèle : compléter F5 avec le résumé LLM, les recommandations et la création de dataset — les deux features partagent le même pattern "statistiques → LLM → sortie structurée".

### Sprint 3 — F2 Augmented Analytics, partie locale (3 semaines)

Implémenter anomaly detection, forecasting et clustering (zéro LLM requis pour ces 3 types). Le résumé textuel avec `qwen2.5:14b` peut être livré en fin de sprint ou reporté.

### Sprint 4 — F3 Assistant conversationnel (3 semaines)

F3 dépend de F1, F2 et F5 (l'assistant peut accepter des fichiers glissés directement dans le chat). C'est la feature la plus complexe (SSE, persistance historique, gestion du contexte multi-module). À implémenter en dernier pour capitaliser sur les patterns validés en Sprint 2-3.

---

## Risques produit

### R1 — Hallucinations LLM (Text-to-SQL, Résumé)

**Description** : Qwen2.5-coder génère un SQL syntaxiquement valide mais sémantiquement incorrect, ou un résumé textuel inexact.
**Mitigation** : affichage systématique du SQL généré avant exécution, score de confiance visible, mode "édition manuelle" accessible, whitelist DQL obligatoire.
**Résiduel** : l'utilisateur reste responsable de la validation du SQL. Documenter dans la UI.

### R2 — Latence GPU et swap de modèles

**Description** : le RTX 5070 Ti (16 GB VRAM) peut charger `qwen2.5-coder:7b` (~4.5 GB) ou `qwen2.5:14b` (~9 GB) mais pas les deux simultanément à pleine vitesse. Ollama gère le swap, mais chaque chargement prend 5-15 s.
**Mitigation** : cache Redis sur les requêtes identiques, streaming SSE pour masquer la latence perçue, modèle par défaut `qwen2.5-coder:7b` pour F1 (léger et spécialisé), `qwen2.5:14b` réservé au chat et aux résumés. Timeout de 30 s avec message d'erreur explicite.
**Résiduel** : si F1 et F3 sont utilisés simultanément, le swap Ollama introduit une latence supplémentaire. File d'attente Redis recommandée.

### R3 — Souveraineté — dérive vers des providers non souverains

**Description** : un développeur intègre par inadvertance un SDK tiers (OpenAI, Langfuse cloud US, etc.) ou configure un fallback vers AWS Bedrock.
**Mitigation** : audit automatique des dépendances Python (`pip-audit` + liste noire CI), documentation explicite des providers interdits dans `.claude/agents/ai.md`, revue de code obligatoire sur tout changement de dépendance IA.
**Résiduel** : le fallback Mistral AI FR est souverain mais commercial. S'assurer que le DPA (Data Processing Agreement) Mistral est signé avant activation.

### R4 — Adoption utilisateur (Text-to-SQL, Assistant)

**Description** : les utilisateurs ne font pas confiance aux résultats générés par l'IA et n'adoptent pas les features.
**Mitigation** : transparence totale (SQL généré visible, modèle affiché, score de confiance), possibilité de modifier le SQL, feedback utilisateur sur chaque résultat (pouce haut/bas), onboarding avec exemples de questions pour chaque source.
**Résiduel** : courbe d'apprentissage sur la formulation des questions. Prévoir des suggestions de questions contextuelles (déjà inclus dans F3).

### R5 — Qualité du schéma source (Text-to-SQL)

**Description** : si la source connectée a des noms de tables/colonnes cryptiques (ex : `T_FACT_001`, `COL_A`), le LLM ne peut pas générer de SQL pertinent même avec Qwen2.5-coder.
**Mitigation** : permettre à l'utilisateur d'ajouter des descriptions de colonnes dans Connect (enrichissement métadonnées). Injecter ces descriptions dans le prompt.
**Résiduel** : feature de documentation de schéma non incluse dans ce sprint — à planifier en backlog post-F1.

### R7 — Fichiers malveillants ou données sensibles à l'upload

**Description** : un utilisateur uploade un fichier contenant des macros Excel malveillantes, du contenu chiffré non parseable, ou des données personnelles (RGPD — noms, emails, numéros de CB) qui transitent dans le rapport LLM.
**Mitigation** : parsing côté `movetodata-ai` en sandbox (pas d'exécution de macros — openpyxl ne les exécute pas), validation du type MIME avant stockage, le LLM ne reçoit que des statistiques agrégées et des noms de colonnes (pas les valeurs des cellules), avertissement UI si des colonnes ressemblent à des données personnelles (détection heuristique sur les noms : "email", "phone", "ssn", "nom"…).
**Résiduel** : l'administrateur est responsable de la politique d'upload (types autorisés configurables via variable d'environnement `ALLOWED_UPLOAD_EXTENSIONS`).

### R8 — Performance parsing de fichiers volumineux

**Description** : un fichier Excel de 50 MB / 500k lignes peut prendre 30-60 s à parser avec pandas sur CPU, et saturer la mémoire du service IA.
**Mitigation** : pandas chunked reading (`chunksize=10000`) pour les statistiques, échantillonnage à 10 000 lignes pour l'analyse LLM, limite stricte de taille en amont (rejetée par Boson avant transmission), progress bar UI avec polling.
**Résiduel** : les fichiers > 50 MB doivent être importés via un connecteur JDBC ou S3 — documenter cette limite dans la UI.

### R6 — Scalabilité du service IA en open source

**Description** : en mode freemium/open source, un seul Ollama servi localement peut être saturé par des requêtes concurrentes. Le swap de modèles `qwen2.5-coder:7b` ↔ `qwen2.5:14b` ajoute une latence en charge.
**Mitigation** : file d'attente Redis sur `movetodata-ai`, concurrence limitée à 2 requêtes LLM simultanées en open source, message "IA occupée, réessayez dans quelques secondes".
**Résiduel** : les limites de concurrence deviennent un levier de conversion Pro/Enterprise (pas de limite de concurrence en Pro, GPU dédié recommandé).
