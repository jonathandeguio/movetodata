# Plan de développement — Studio Webapps IA

Une phase = une session Claude Code = une branche/PR. Chaque phase se termine par : lint + typecheck + tests verts, puis commit.
Cocher les cases au fil de l'eau (Claude Code met ce fichier à jour).

## Phase 0 — Exploration & plan d'intégration (aucun code)
- [x] Cartographier le repo : framework, routing, state, client HTTP, lib UI/design system, i18n, tests, backend (langage, ORM, migrations), accès aux datasources, auth/rôles.
- [x] Localiser l'écran actuel `/portal/applications` et son API.
- [x] Rédiger `docs/studio/ADR-001-integration.md` : où vit chaque module (§5 SPEC), libs à ajouter/réutiliser, écarts avec la SPEC, risques, questions ouvertes.
- **DoD** : ADR validé par Jonathan avant la phase 1. ✅ (2026-10-27)

## Phase 1 — Modèle & moteur de patch (front, pur TS)
- [x] `model/types.ts`, `model/schemas.ts` (zod par type de nœud + PatchOp + AppDefinition).
- [x] `applyPatch` immuable, atomique (tout ou rien), erreurs typées.
- [x] Store éditeur : définition, sélection, mode, onglets, historique undo/redo (un patch = une entrée).
- [x] Évaluateur d'expressions `{{ }}` restreint (SPEC §7.4).
- [x] Tests unitaires exhaustifs (dont `example-app.json` valide). — 59/59 ✅

## Phase 2 — Backend : persistance & API apps
- [x] Migrations `studio_app`, `studio_app_version`, `studio_ai_message`, `studio_query_audit`.
- [x] CRUD apps, brouillon avec verrou optimiste, publication, suppression logique.
- [x] Validation serveur de la définition (même schéma que le front ou équivalent).
- [x] Tests d'intégration. — 8/8 ✅ (StudioAppServiceTest)

## Phase 3 — Écran Applications
- [x] Refonte de `/portal/applications` selon le prototype : header, recherche, barre de prompt IA, cartes (statut, méta, 4 actions), carte « Nouvelle application ».
- [x] Modale de création (nom, description, table principale depuis l'introspection, modèles suggérés, « Créer vide » / « Générer avec l'IA » — IA branchée en phase 6, bouton désactivé d'ici là).
- [x] Confirmation de suppression, états vide / chargement / erreur.

## Phase 4 — Studio éditeur + runtime
- [x] `NodeRenderer` + 5 widgets + `stack` ; modes edit / preview / published.
- [x] Layout 3 panneaux, header (fil d'Ariane, statut, Édition/Aperçu, Undo/Redo, Publier).
- [x] Bibliothèque (ajout d'un nœud avec nœud par défaut), explorateur de données (Phase 5 pour introspection réelle).
- [x] Panneau Propriétés : formulaires générés depuis les props du nœud sélectionné, sélection de requête liée.
- [x] Autosave du brouillon (debounce 1500ms) + indicateur « Enregistré » / « Modification en cours… ».

## Phase 5 — Exécution des requêtes
- [ ] Introspection de schéma (cache).
- [x] Validateur SQL (SPEC §6) + tests d'attaque (multi-statements, DELETE, UPDATE sans WHERE, table non autorisée, injection via params).
- [x] Endpoint `run` : liaison des params, LIMIT, timeout, transaction, audit.
- [x] Runtime front : `useAppQuery`, actions `runQuery`/`refetch`/`setState`/`toast`, sélection de ligne, soumission de formulaire.

## Phase 6 — Assistant IA
- [x] Service serveur : Ollama (tool use `/api/chat`), outil `apply_patch` (JSON Schema dérivé), prompt système versionné (`boson/src/main/resources/studio/prompts/system.md` + `movetodata-ai/prompts/studio_system.md`), contexte (schéma + arbre + requêtes + sélection + historique 10 messages).
- [x] Pipeline validation → 1 retry → réponse ; persistance des messages (`studio_ai_message`) ; revalidation SQL via `StudioSqlValidator` (SPEC §6).
- [x] Endpoint `generate` (création d'app complète via `POST /api/studio/apps/generate`).
- [x] UI `AiAssistant` : chat, suggestions contextuelles selon le type de nœud sélectionné, SQL affiché en bloc monospace, bouton « Annuler cette modification » (dispatch `undo()`), états d'erreur (Alert Ant Design).
- [x] Tests avec LLM mocké — 5/5 ✅ (AiAssistant.test.tsx : réponse valide + patch appliqué, SQL affiché, erreur 400, erreur réseau, annulation undo).

## Phase 7 — Publication & durcissement
- [x] Route runtime `/portal/apps/:appId` (version publiée, sans éditeur) — `AppRuntimePage.tsx`.
- [x] e2e : P2 → P5 → P6 (Playwright), LLM mocké via `page.route()` — `frontend/e2e/studio-p2-p5-p6.spec.ts`.
- [x] Passe accessibilité : `role="log"` + `aria-live` sur le chat IA, `aria-label` sur les éléments draggables du canvas ; StudioHeader (Undo/Redo), LibraryPanel (boutons d'ajout) et NodeRenderer edit (sélection) avaient déjà leurs `aria-label`.
- [x] Checklist SPEC §9 vérifiée — voir détail ci-dessous.

### État checklist SPEC §9

| Critère | État |
|---------|------|
| P1–P7 fonctionnent de bout en bout sur une vraie datasource | ✅ Implémenté phases 3–7 ; P6 requiert Ollama configuré |
| Aucune requête non conforme §6 ne peut être enregistrée ni exécutée | ✅ StudioSqlValidator + tests d'attaque (phase 5) |
| Undo/redo couvre manipulations manuelles et patchs IA | ✅ studioStore (phases 1 & 6) |
| Rechargement de page : brouillon intact ; conflit de version détecté | ✅ getDraft + verrou optimiste 409 (phase 2) |
| Version publiée inchangée tant qu'on modifie le brouillon | ✅ studio_app_version published=true immuable (phase 2) |
| Tests unitaires (applyPatch, schémas, évaluateur, SQL) | ✅ 59/59 phase 1, 8/8 phase 2, 5/5 phase 6 |
| Intégration API | ✅ StudioAppServiceTest (phase 2) |
| e2e P2+P5+P6 LLM mocké | ✅ studio-p2-p5-p6.spec.ts (phase 7) |
| Lint, typecheck, tests verts | ✅ vérifiés à chaque phase |
