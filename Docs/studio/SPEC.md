# Studio de Webapps Transactionnelles assistées par IA — Spécification MVP

> Document de référence pour Claude Code. À lire en entier avant toute implémentation.
> Prototype visuel : `docs/studio/prototype/studio-prototype.dc.html` (référence de layout, couleurs, libellés et comportements — **pas** du code à copier : c'est un format de maquette, pas du React).

---

## 1. Objectif

Ajouter au portail MoveToData (`/portal/applications`) une brique permettant à un utilisateur métier de **construire, à partir des tables de la Data Platform, des webapps transactionnelles** (lire, filtrer, modifier des données) :

- en assemblant des composants sur un canvas (low-code),
- ou en décrivant l'écran en langage naturel à un **assistant IA** qui génère composants et requêtes SQL,
- puis en **publiant** l'application pour ses utilisateurs finaux.

L'écran actuel `/portal/applications` (liste de cartes avec Ouvrir / Configurer / Champs / Supprimer et bouton « Nouvelle application ») est conservé dans son principe et modernisé.

## 2. Périmètre

### Dans le MVP
1. Écran **Applications** : liste, recherche, création, suppression, statut (Brouillon / Publiée).
2. **Création assistée** : modale (nom, description en langage naturel, table principale, modèles suggérés) → génération IA d'une première version.
3. **Studio** (éditeur) en 3 panneaux :
   - gauche : bibliothèque de composants + explorateur de données (connexions, tables, colonnes, types) ;
   - centre : canvas (pile verticale de composants, sélection, réordonnancement) ;
   - droite : onglets **Assistant IA** (chat, suggestions, SQL proposé) et **Propriétés** (titre, source, requête, champs, actions).
4. Mode **Édition / Aperçu**, **Annuler / Rétablir**.
5. 5 composants : `table`, `form`, `kpis`, `chart` (barres), `button` (action), plus le conteneur `stack`.
6. **Exécution réelle des requêtes** côté serveur (lecture + écriture contrôlée).
7. **Publication** : version figée, servie à une URL runtime `/portal/apps/:appId`.

### Hors MVP (ne pas implémenter, mais ne pas bloquer)
Multi-pages, drag & drop libre (grille 2D), composants custom, workflows multi-étapes, DELETE SQL, collaboration temps réel, gestion fine des droits par composant, thèmes par application.

## 3. Parcours utilisateur

| # | Parcours | Résultat attendu |
|---|----------|------------------|
| P1 | L'utilisateur tape une description dans la barre IA de l'écran Applications puis « Générer » | La modale s'ouvre pré-remplie |
| P2 | Dans la modale, il choisit une table et clique « Générer avec l'IA » | Une app brouillon est créée avec 3–5 composants liés à de vraies requêtes ; le Studio s'ouvre, l'assistant résume ce qui a été fait et affiche le SQL |
| P3 | Il clique sur un composant du canvas | Composant sélectionné (bordure + halo bleu), onglet Propriétés affiché |
| P4 | Il demande à l'IA « ajoute un graphique des montants par client » | L'IA propose un patch (explication + SQL) ; il est appliqué, visible dans l'historique, annulable |
| P5 | Il passe en Aperçu, clique une ligne du tableau, modifie le formulaire, Enregistrer | La requête d'écriture s'exécute réellement, le tableau se rafraîchit, un toast confirme |
| P6 | Il publie | Statut « Publiée », version figée ; l'URL runtime affiche l'app sans éditeur |
| P7 | Depuis la liste : Configurer → Studio onglet Propriétés ; Champs → Studio onglet Données ; Supprimer → confirmation puis suppression |

## 4. Modèle de données

Une application est un **document JSON versionné** (`AppDefinition`). L'IA, la bibliothèque et le panneau Propriétés modifient ce document **exclusivement via des `PatchOp`**.

```ts
// src/features/studio/model/types.ts
export type NodeType = 'stack' | 'table' | 'form' | 'kpis' | 'chart' | 'button';

export interface AppDefinition {
  schemaVersion: 1;
  id: string;
  name: string;
  datasourceId: string;               // connexion Data Platform
  queries: Record<string, QueryDef>;
  state: Record<string, unknown>;     // état runtime initial (ex. selected_id)
  pages: [{ id: string; name: string; root: AppNode }]; // 1 page au MVP
}

export interface QueryDef {
  id: string;
  kind: 'read' | 'write';
  sql: string;                        // paramètres nommés :param uniquement
  params: string[];
  onSuccess?: Action[];               // ex. refetch d'une requête read
}

export interface AppNode {
  id: string;
  type: NodeType;
  props: Record<string, unknown>;     // validées par un schéma zod PAR type
  bind?: { query: string };
  events?: Partial<Record<'onClick' | 'onRowClick' | 'onSubmit', Action[]>>;
  visibleIf?: string;                 // expression {{ }} restreinte (voir §7.4)
  children?: AppNode[];
}

export type Action =
  | { action: 'runQuery'; query: string; params?: Record<string, string> }
  | { action: 'refetch'; query: string }
  | { action: 'setState'; key: string; value: string }
  | { action: 'toast'; message: string };

export type PatchOp =
  | { op: 'addNode'; parentId: string; index?: number; node: AppNode }
  | { op: 'updateNode'; nodeId: string; props?: Record<string, unknown>; bind?: AppNode['bind']; events?: AppNode['events'] }
  | { op: 'removeNode'; nodeId: string }
  | { op: 'moveNode'; nodeId: string; parentId: string; index: number }
  | { op: 'upsertQuery'; query: QueryDef }
  | { op: 'removeQuery'; queryId: string };
```

Props par type (schémas zod à écrire) :

| Type | Props principales |
|------|-------------------|
| `table` | `title`, `columns?: {key,label,format?}[]`, `pageSize` (déf. 50), `selectable` |
| `form` | `title`, `fields: {name,label,widget:'text'|'number'|'select'|'date', options?, required?}[]`, `submitLabel` |
| `kpis` | `title`, `items: {key,label,format?:'number'|'currency'|'percent'}[]` |
| `chart` | `title`, `x`, `y`, `kind:'bar'` |
| `button` | `title`, `label`, `variant:'primary'|'secondary'|'danger'`, `confirm?: string` |

Exemple complet : voir l'état JSON fourni avec le prototype (§ annexe A).

### Persistance (backend)

```
studio_app          (id, name, datasource_id, status, created_by, created_at, updated_at, deleted_at)
studio_app_version  (id, app_id, version, definition JSONB, created_by, created_at, published BOOLEAN)
studio_ai_message   (id, app_id, role, text, patch JSONB NULL, applied BOOLEAN, created_at)
studio_query_audit  (id, app_id, version, query_id, user_id, params JSONB, row_count, duration_ms, error, created_at)
```
- Le brouillon = dernière version non publiée. Publier = marquer une version `published=true` (immutable).
- Suppression logique (`deleted_at`).

## 5. Architecture

### Front (dans le repo React existant)
```
src/features/studio/
  model/        types.ts, schemas.ts (zod), applyPatch.ts, ids.ts
  store/        studioStore.ts (état éditeur + historique undo/redo)
  api/          client.ts (+ hooks TanStack Query si déjà présent dans le repo)
  runtime/      NodeRenderer.tsx, widgets/{Table,Form,Kpis,Chart,Button}Widget.tsx, useAppQuery.ts, expressions.ts
  editor/       StudioPage.tsx, StudioHeader.tsx, LibraryPanel.tsx, DataExplorer.tsx,
                CanvasView.tsx, PropertiesPanel.tsx, AiAssistant.tsx
  apps/         ApplicationsPage.tsx, AppCard.tsx, NewAppDialog.tsx
```
Règles :
- **Un seul `NodeRenderer`** partagé éditeur / aperçu / runtime publié ; seule la prop `mode` change.
- **S'aligner sur les conventions du repo** (routing, state management, client HTTP, composants UI, i18n, tests). Ne pas introduire de nouvelle lib si un équivalent est déjà présent ; sinon proposer (Tailwind, lucide-react, zod, immer) avant d'ajouter.

### Back — contrat d'API
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/studio/apps?q=` | liste (id, name, status, datasource, nb composants, updated_at) |
| POST | `/api/studio/apps` | crée (`{name, datasourceId, definition?}`) |
| GET / PUT | `/api/studio/apps/:id/draft` | lit / sauvegarde le brouillon (`definition`, avec `expectedVersion` pour verrou optimiste) |
| DELETE | `/api/studio/apps/:id` | suppression logique |
| POST | `/api/studio/apps/:id/publish` | fige la version courante |
| GET | `/api/studio/apps/:id/published` | définition publiée (runtime) |
| GET | `/api/studio/datasources/:id/schema` | tables, colonnes, types, PK (introspection, mise en cache) |
| POST | `/api/studio/apps/:id/queries/:queryId/run` | exécute une requête (`{params, mode:'draft'|'published'}`) |
| POST | `/api/studio/apps/:id/ai` | `{prompt, selectedNodeId?}` → `{explanation, patch: PatchOp[]}` |
| POST | `/api/studio/apps/generate` | `{name, description, datasourceId, table}` → `AppDefinition` |

Adapter les chemins au style d'API existant de la plateforme (à découvrir en phase 0).

## 6. Exécution des requêtes (sécurité — non négociable)

1. Le front n'envoie **jamais de SQL** à exécuter : seulement `queryId` + `params`. Le serveur relit le SQL dans la définition stockée (brouillon ou version publiée).
2. **Validation du SQL à l'enregistrement ET à l'exécution** via un parseur (ex. `node-sql-parser` / `pgsql-ast-parser`, ou l'équivalent du langage backend) :
   - `read` : une seule instruction `SELECT` (CTE autorisées), pas de fonction dangereuse ;
   - `write` : une seule instruction `INSERT` ou `UPDATE` ; `UPDATE` **doit** avoir un `WHERE` ; `DELETE`, DDL, `GRANT`, multi-instructions **interdits** ;
   - tables référencées ∈ liste autorisée de la datasource.
3. Paramètres **nommés liés** par le driver (jamais de concaténation).
4. Lecture : `LIMIT` imposé (max 1000), timeout (ex. 10 s), connexion en lecture seule si la plateforme le permet.
5. Écriture : exécutée sous l'identité / le rôle de l'utilisateur courant si la plateforme le supporte ; sinon compte technique + contrôle d'autorisation applicatif. Transaction, timeout.
6. Chaque exécution est **journalisée** dans `studio_query_audit`.

## 7. Assistant IA

### 7.1 Appel LLM (côté serveur uniquement)
- API Anthropic (SDK officiel du langage backend), clé dans les secrets serveur, modèle via variable d'env `STUDIO_AI_MODEL`.
- **Sortie structurée obligatoire** : utiliser le *tool use* avec un outil `apply_patch` dont l'`input_schema` est le JSON Schema de `{explanation: string, patch: PatchOp[]}` (générer le JSON Schema depuis zod ou l'équivalent backend).
- Contexte envoyé : schéma de la datasource (tables/colonnes/types/PK, **pas de données**), arbre courant, requêtes existantes, nœud sélectionné, 10 derniers messages.
- Prompt système versionné dans `server/.../studio/prompts/system.md` : rôle, contraintes SQL (§6), catalogue des composants et de leurs props, conventions d'ids, langue de réponse = langue de l'utilisateur.

### 7.2 Pipeline
`prompt → LLM (tool apply_patch) → validation zod du patch → validation SQL (§6) de chaque upsertQuery → application à blanc sur la définition → si erreur : 1 retry avec l'erreur renvoyée au modèle → réponse {explanation, patch}`.

### 7.3 Côté UI
- Messages utilisateur / assistant, indicateur « Analyse du schéma… », suggestions contextuelles (dépendent du nœud sélectionné), SQL affiché en bloc monospace.
- Le patch est appliqué automatiquement et apparaît dans l'historique (un undo annule tout le patch). Bouton « Annuler cette modification » sur le message.
- Génération initiale (`/apps/generate`) : même pipeline avec un prompt dédié, renvoie une définition complète.

### 7.4 Expressions `{{ }}`
Pas d'`eval`. Mini-évaluateur restreint : accès `state.x`, `row.x`, `form.x`, comparaisons `== != > <`, `&&`, `||`, littéraux. Tout le reste est rejeté.

## 8. Design / UI

Reprendre le prototype :
- Thème sombre type shadcn/Vercel. Tokens : fond `#09090B`, panneaux `#0C0C0E`/`#0F0F12`, surfaces `#16161A`, bordures `#1F1F23`/`#26262B`, texte `#FAFAFA`, secondaire `#A1A1AA`, accent `#2563EB` (hover `#1D4ED8`, texte lien `#60A5FA`), IA `#A78BFA`, succès `#4ADE80`, danger `#F87171`. Si le portail a déjà un système de design/tokens : **utiliser le sien**, ne pas en créer un parallèle.
- Typo Geist / Geist Mono (ou celle du portail), icônes lucide-react.
- Rail de navigation gauche existant conservé.
- Layout Studio en `flex-wrap` : panneaux latéraux `flex: 1 1 240px` / `1 1 300px`, canvas `flex: 999 1 480px` → empilement automatique sur petit écran.
- Accessibilité : vrais `<button>`/`<label>`, `aria-label` sur boutons-icônes, `role="tablist"` sur onglets, focus visible, contraste ≥ 4.5:1, modale avec focus trap et Échap.
- Libellés en français (via le système i18n du repo s'il existe).

## 9. Critères d'acceptation MVP
- [ ] Les parcours P1 → P7 fonctionnent de bout en bout sur une vraie datasource de dev.
- [ ] Aucune requête non conforme au §6 ne peut être enregistrée ni exécutée (tests dédiés, y compris injection via params et via prompt IA).
- [ ] Undo/redo couvre manipulations manuelles et patchs IA.
- [ ] Rechargement de page : le brouillon est intact ; conflit de version détecté.
- [ ] Version publiée inchangée tant qu'on modifie le brouillon.
- [ ] Tests : unitaires (`applyPatch`, schémas, évaluateur d'expressions, validateur SQL), intégration API, 1 e2e (P2 + P5 + P6) avec LLM mocké.
- [ ] Lint, typecheck et tests verts.

## Annexe A — Exemple de définition
Voir `docs/studio/example-app.json`.
