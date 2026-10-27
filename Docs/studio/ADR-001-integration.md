# ADR-001 — Intégration Studio de Webapps IA dans le repo MoveToData

> Phase 0 — Exploration & plan d'intégration. Aucun code applicatif.
> Date : 2026-10-27

---

## 1. Stack détectée

### Frontend (`frontend/`)

| Aspect | Technologie |
|--------|-------------|
| Framework | React 18.2 + TypeScript 5.3 (CRA via craco) |
| Routing | react-router-dom 6.22 — `createBrowserRouter` dans `src/App/routes.tsx` |
| State management | Redux Toolkit 1.9 + Redux Thunk (`src/redux/store.ts`) ; **TanStack Query absent** |
| Client HTTP | axios 1.6.7, interceptor global dans `src/utils/axiosInterceptors.ts` (baseURL = `REACT_APP_BASE_URL_API`, Bearer token automatique) |
| UI / Design system | Ant Design 5.19.3 + icônes `@ant-design/icons` 5.3.7 ; pas de Tailwind ni de shadcn |
| Polices | Poppins (via `@fontsource/poppins`) définie dans `index.css` + `--movetodata-*` CSS tokens dans `App.scss` |
| Icônes (hors Ant) | aucune lib générique (lucide-react **absent**) |
| Design tokens | `--movetodata-*` CSS custom properties (light + `.dark` class) définis dans `App.scss` ; thème sombre via classe `.dark` sur le body |
| i18n | Pas de lib i18n dédiée (`react-i18next`, `i18next` absents). Textes en dur en français dans les composants. |
| Tests | Jest/JSDOM via craco (`@testing-library/react` 14), **0 fichier `.test.` existant dans `src/`** ; Playwright pour les e2e (`frontend/e2e/`) |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` 6/8 — déjà présent |
| Immer | `immer` 10.0.3 — déjà présent |
| Zod | **absent** — à ajouter |

### Backend (`boson/`)

| Aspect | Technologie |
|--------|-------------|
| Langage / framework | Java 11+ / Spring Boot 2.7.2 |
| ORM | Spring Data JPA + Hibernate (`javax.persistence.*`) |
| Migrations | Flyway 8.4.2, fichiers `V{date}__*.sql` dans `boson/src/main/resources/db/migration/` |
| Auth | JWT custom + Spring Security ; `@PreAuthorize(Auth.CONNECT_ADMIN)` (ou PLATFORM_ADMIN) ; principal = `AuthUser` (injecté via `@AuthenticationPrincipal`) |
| Lombok | 1.18.24 (`@Builder`, `@RequiredArgsConstructor`, `@Slf4j`, etc.) |
| JSON store | pas de JSONB natif — texte brut (voir `fields_json TEXT` dans `app_definition`) ; `hibernate-types-52` (vladmihalcea) présent mais non utilisé dans Apps |
| Accès datasources | `JDBCService` (connexion JDBC directe via `DatabaseSourceConfig`) + `JdbcTemplate` maison (`executeStatement(sql)`) ; **aucun support natif des paramètres nommés** dans la couche existante |
| Tests backend | **aucun test** dans `boson/src/test/` |
| Validation SDK Anthropic | **absent** — le repo utilise Ollama (`qwen2.5:14b`) via httpx dans le service Python `movetodata-ai/` |

### Service IA (`movetodata-ai/`)

| Aspect | Technologie |
|--------|-------------|
| Langage / framework | Python / FastAPI + uvicorn |
| LLM | Ollama self-hosted (`CHAT_MODEL` = `qwen2.5:14b`, `TEXT_TO_SQL_MODEL` = `qwen2.5-coder:7b`) via httpx |
| Anthropic SDK | **absent** |
| Proxy Boson | `AiProxyController` (Spring) retransmet vers `/api/ai/**` ; les endpoints Python sont donc accessibles via `/api/ai/...` depuis le front |

---

## 2. Écran `/portal/applications` actuel

| Élément | Localisation |
|---------|--------------|
| Route frontend | `routes.tsx` L127 : `<Route path="applications" element={<Applications />} />` |
| Composant réexporté | `src/pages/Portal/Applications.tsx` → `export { default } from 'Apps/AppBuilder/AppsList'` |
| Écran liste | `src/Apps/AppBuilder/AppsList.tsx` — cartes Ant Design ; actions : Ouvrir, Configurer, Champs, Supprimer |
| Éditeur de champs | `src/Apps/AppBuilder/AppBuilderView.tsx` — route `:uuid/builder` |
| Vue runtime | `src/Apps/AppBuilder/AppRendererView.tsx` — route `:uuid` |
| API client | `src/Apps/AppBuilder/AppBuilder.api.ts` — axios vers `/api/apps` |
| Backend controller | `boson/.../apps/controllers/AppDefinitionController.java` — `@RequestMapping("/api/apps")` |
| Entité existante | `app_definition` (id, uuid, name, description, fields_json TEXT, icon, created_by, created_at, updated_at) |

**Constat** : le modèle `AppDefinition` actuel (champs clés-valeur, `fields_json`, `resourceUrl`) est **orthogonal** au nouveau modèle JSON versionné de la SPEC. Les deux peuvent coexister en base si les nouvelles tables sont préfixées `studio_*`.

---

## 3. Mapping SPEC §5 → repo

### Frontend

```
SPEC §5                              → Repo réel
─────────────────────────────────────────────────────────────────────────
src/features/studio/                 → src/Apps/Studio/
  model/types.ts                     → src/Apps/Studio/model/types.ts
  model/schemas.ts (zod)             → src/Apps/Studio/model/schemas.ts
  model/applyPatch.ts                → src/Apps/Studio/model/applyPatch.ts
  model/ids.ts                       → src/Apps/Studio/model/ids.ts
  store/studioStore.ts               → src/Apps/Studio/store/studioStore.ts  (Redux slice ou useState local)
  api/client.ts                      → src/Apps/Studio/api/studioApi.ts  (axios, même pattern que AppBuilder.api.ts)
  runtime/NodeRenderer.tsx           → src/Apps/Studio/runtime/NodeRenderer.tsx
  runtime/widgets/                   → src/Apps/Studio/runtime/widgets/
  runtime/useAppQuery.ts             → src/Apps/Studio/runtime/useAppQuery.ts
  runtime/expressions.ts             → src/Apps/Studio/runtime/expressions.ts
  editor/StudioPage.tsx              → src/Apps/Studio/editor/StudioPage.tsx
  editor/StudioHeader.tsx            → src/Apps/Studio/editor/StudioHeader.tsx
  editor/LibraryPanel.tsx            → src/Apps/Studio/editor/LibraryPanel.tsx
  editor/DataExplorer.tsx            → src/Apps/Studio/editor/DataExplorer.tsx
  editor/CanvasView.tsx              → src/Apps/Studio/editor/CanvasView.tsx
  editor/PropertiesPanel.tsx         → src/Apps/Studio/editor/PropertiesPanel.tsx
  editor/AiAssistant.tsx             → src/Apps/Studio/editor/AiAssistant.tsx
  apps/ApplicationsPage.tsx          → src/Apps/Studio/apps/ApplicationsPage.tsx  (remplace AppsList)
  apps/AppCard.tsx                   → src/Apps/Studio/apps/AppCard.tsx
  apps/NewAppDialog.tsx              → src/Apps/Studio/apps/NewAppDialog.tsx
```

Routes à ajouter dans `routes.tsx` :
```
/portal/applications                → <ApplicationsPage />  (remplace AppsList)
/portal/applications/:id/studio     → <StudioPage />
/portal/apps/:id                    → <AppRuntimePage />    (runtime publié)
```

### Backend

```
SPEC §5 (Back)                       → Repo réel
─────────────────────────────────────────────────────────────────────────
/api/studio/apps                     → boson/.../studio/controllers/StudioController.java
/api/studio/datasources/:id/schema   → boson/.../studio/controllers/StudioController.java
/api/studio/apps/:id/queries/.../run → boson/.../studio/controllers/StudioQueryController.java
/api/studio/apps/:id/ai              → movetodata-ai → boson proxy (AiProxyController ++)
/api/studio/apps/generate            → idem
```

Structure back suggérée (même pattern que catalog/) :
```
boson/.../studio/
  controllers/   StudioController.java, StudioQueryController.java
  library/
    models/      StudioApp.java, StudioAppVersion.java, StudioAiMessage.java, StudioQueryAudit.java
    repository/  StudioAppRepository.java, StudioAppVersionRepository.java, ...
    services/    StudioQueryService.java (validation SQL + exécution)
    dto/         DraftSaveRequest.java, QueryRunRequest.java, ...
```

---

## 4. Dépendances à réutiliser ou à ajouter

### Réutilisables (déjà présents)

| Lib | Usage Studio |
|-----|-------------|
| `antd` 5.19 | Tous les composants UI (Table, Form, Input, Modal, Tabs, Tag, etc.) |
| `axios` | Client HTTP — même pattern que `AppBuilder.api.ts` |
| `immer` 10 | Mutation immuable dans `applyPatch.ts` et le store undo/redo |
| `@dnd-kit/sortable` | Réordonnancement des nœuds dans le canvas |
| `redux-toolkit` | Slice pour le store éditeur (undo/redo, sélection, mode) |
| `@ant-design/icons` | Icônes dans les panels et la bibliothèque de composants |
| `dayjs` | Formatage des dates dans les widgets |
| `@tanstack/react-table` | Déjà présent : base pour le widget `table` |
| Spring Data JPA / Flyway / Lombok | Back — même pattern que catalog/ |
| `JDBCService` / `JdbcTemplate` | Exécution des requêtes SQL (à encapsuler dans `StudioQueryService`) |
| `hibernate-types-52` | Mapping JSONB pour la colonne `definition` |
| Playwright | e2e Phase 7 |

### À ajouter (frontend)

| Lib | Raison | Décision |
|-----|--------|----------|
| `zod` | Validation des schémas `AppDefinition`, `PatchOp`, props par type | **À ajouter** — requis par la SPEC, aucun équivalent présent |
| `lucide-react` | Icônes Studio (SPEC §8) | **À discuter** : `@ant-design/icons` couvre beaucoup de cas. Si les maquettes en ont besoin, ajouter ; sinon rester sur `@ant-design/icons` |

### À ajouter (backend / IA)

| Lib | Raison | Décision |
|-----|--------|----------|
| `net.sf.jsqlparser:jsqlparser` ou équivalent | Validation SQL §6 (parse SELECT/INSERT/UPDATE, détecter DELETE/DDL/multi-statements) | **À ajouter côté Boson** ; JSqlParser (Maven Central) est le plus complet pour Java |
| SDK Anthropic Python | SPEC §7.1 exige Anthropic API ; le repo n'utilise qu'Ollama | **Question ouverte #1 ci-dessous** |

---

## 5. Écarts avec la SPEC

| # | Écart | Impact |
|---|-------|--------|
| E1 | SPEC §5 place les fichiers dans `src/features/studio/` ; la convention du repo est `src/Apps/<Feature>/` | Faible — utiliser `src/Apps/Studio/` |
| E2 | SPEC §4 (Persistance) suppose `definition JSONB` ; la table `app_definition` actuelle utilise `TEXT` pour `fields_json` | Les nouvelles tables `studio_app_version` utiliseront `TEXT` stockant du JSON valide (Hibernate `@Column(columnDefinition="TEXT")` + `@Convert` ou `@Type(JsonType)` via `hibernate-types-52`) sauf si la DB cible supporte JSONB (PostgreSQL uniquement) |
| E3 | TanStack Query (React Query) n'est **pas installé** ; la SPEC suggère "hooks TanStack Query si déjà présent" | Utiliser `useState`/`useEffect` + axios (même pattern que AppBuilder) pour les fetch ; le hook `useAppQuery` (runtime) est du code custom de toute façon |
| E4 | `lucide-react` absent ; la SPEC préconise ces icônes | Utiliser `@ant-design/icons` par défaut ; demander avant d'ajouter lucide-react |
| E5 | i18n : pas de système en place ; SPEC dit "via le système i18n s'il existe" | Textes directement en français, comme tout le portail existant |
| E6 | Prompt système SPEC §7.1 dit `server/.../studio/prompts/system.md` ; il n'y a pas de dossier `server/` — le back Java est `boson/` | Placer le prompt dans `boson/src/main/resources/studio/prompts/system.md` |
| E7 | SPEC §6 : paramètres nommés liés par le driver (`:param`) — le `JdbcTemplate` maison utilise `executeStatement(rawSql)` sans liaison de paramètres | `StudioQueryService` devra utiliser `PreparedStatement` directement (contourner `JdbcTemplate`), ou étendre la couche existante |
| E8 | SPEC §5 contrat API `/api/studio/apps` ; les apps actuelles sont sous `/api/apps` | Utiliser `/api/studio/apps` pour ne pas casser l'existant ; les routes front seront aussi sous `studio/` |
| E9 | SPEC §7.1 : LLM via SDK Anthropic + `STUDIO_AI_MODEL` ; repo utilise Ollama | **Voir question ouverte #1** |

---

## 6. Risques

| Priorité | Risque | Mitigation |
|----------|--------|------------|
| **Critique** | `JdbcTemplate` maison ne supporte pas les paramètres nommés liés (`PreparedStatement`) → risque injection SQL si mal contourné | Écrire `StudioQueryService` avec `PreparedStatement` natif JDBC ; tests d'attaque obligatoires (Phase 5) |
| **Critique** | Validation SQL §6 côté Java : aucune lib de parsing SQL n'est dans `build.gradle` | Ajouter JSqlParser dès Phase 2 ; écrire des tests avant le code (Phase 5) |
| Élevé | Le verrou optimiste (`expectedVersion`) nécessite une gestion des conflits côté front | Afficher un message d'erreur clair et proposer un rechargement |
| Élevé | JSONB vs TEXT : `app_definition` utilise TEXT ; si on passe à JSONB les indexes et la recherche sont meilleurs mais PostgreSQL-only | Utiliser TEXT + validation applicative au save (même comportement que `fields_json`) ; note dans la migration |
| Moyen | Store undo/redo avec Immer : les patches imbriqués peuvent être complexes à inverser atomiquement | `applyPatch` doit retourner un patch inverse ; tester avec `example-app.json` |
| Moyen | LLM côté Python (Ollama) vs côté Java (SPEC Anthropic) : l'architecture LLM n'est pas tranchée | Voir question ouverte #1 |
| Faible | Réordonnancement canvas avec `@dnd-kit/sortable` : pile verticale MVP seulement, pas de grille 2D | Hors MVP — ne pas bloquer |

---

## 7. Questions ouvertes — TRANCHÉES (2026-10-27)

| # | Question | Décision |
|---|----------|----------|
| Q1 | LLM : Ollama ou Anthropic ? | **Ollama** (`qwen2.5:14b`) — souveraineté maintenue, même modèle que le reste du repo |
| Q2 | Service IA : FastAPI ou Boson ? | **FastAPI** (`movetodata-ai/`) — cohérent avec l'existant ; proxy Boson inchangé |
| Q3 | `datasourceId` = quoi ? | **`Source.id`** (UUID de `connect_sources`) |
| Q4 | Introspection schema | **Wrapper dédié** `StudioDataSourceService` (n'expose pas directement `SourceService`) |
| Q5 | Droits sur les apps Studio | **Rôles existants** — même `@PreAuthorize` que les APIs existantes, pas de nouveau droit |

---

## 8. Décisions retenues (pour Phases 1–4)

1. **Emplacement front** : `src/Apps/Studio/` (conforme aux conventions du repo).
2. **State management** : Redux Toolkit slice pour l'éditeur + undo/redo ; pas de TanStack Query.
3. **Client HTTP** : axios existant (même intercepteur, même baseURL).
4. **Zod** : à ajouter (`yarn add zod`) — seule dépendance nouvelle confirmée pour Phase 1.
5. **Icônes** : `@ant-design/icons` par défaut ; `lucide-react` à demander si nécessaire.
6. **Tables backend** : préfixe `studio_` (ex. `studio_app`, `studio_app_version`) pour ne pas interférer avec `app_definition`.
7. **Paramètres SQL** : `PreparedStatement` JDBC direct dans `StudioQueryService` (pas via `JdbcTemplate` maison).
8. **Validation SQL** : ajouter `jsqlparser` à `build.gradle` en Phase 2.
9. **Prompt système** : `boson/src/main/resources/studio/prompts/system.md`.
10. **i18n** : textes en français en dur (pas de lib i18n).
