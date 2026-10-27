# Plan de développement — Studio Webapps IA

Une phase = une session Claude Code = une branche/PR. Chaque phase se termine par : lint + typecheck + tests verts, puis commit.
Cocher les cases au fil de l'eau (Claude Code met ce fichier à jour).

## Phase 0 — Exploration & plan d'intégration (aucun code)
- [x] Cartographier le repo : framework, routing, state, client HTTP, lib UI/design system, i18n, tests, backend (langage, ORM, migrations), accès aux datasources, auth/rôles.
- [x] Localiser l'écran actuel `/portal/applications` et son API.
- [x] Rédiger `docs/studio/ADR-001-integration.md` : où vit chaque module (§5 SPEC), libs à ajouter/réutiliser, écarts avec la SPEC, risques, questions ouvertes.
- **DoD** : ADR validé par Jonathan avant la phase 1. ✅ (2026-10-27)

## Phase 1 — Modèle & moteur de patch (front, pur TS)
- [ ] `model/types.ts`, `model/schemas.ts` (zod par type de nœud + PatchOp + AppDefinition).
- [ ] `applyPatch` immuable, atomique (tout ou rien), erreurs typées.
- [ ] Store éditeur : définition, sélection, mode, onglets, historique undo/redo (un patch = une entrée).
- [ ] Évaluateur d'expressions `{{ }}` restreint (SPEC §7.4).
- [ ] Tests unitaires exhaustifs (dont `example-app.json` valide).

## Phase 2 — Backend : persistance & API apps
- [ ] Migrations `studio_app`, `studio_app_version`, `studio_ai_message`, `studio_query_audit`.
- [ ] CRUD apps, brouillon avec verrou optimiste, publication, suppression logique.
- [ ] Validation serveur de la définition (même schéma que le front ou équivalent).
- [ ] Tests d'intégration.

## Phase 3 — Écran Applications
- [ ] Refonte de `/portal/applications` selon le prototype : header, recherche, barre de prompt IA, cartes (statut, méta, 4 actions), carte « Nouvelle application ».
- [ ] Modale de création (nom, description, table principale depuis l'introspection, modèles suggérés, « Créer vide » / « Générer avec l'IA » — IA branchée en phase 6, bouton désactivé d'ici là).
- [ ] Confirmation de suppression, états vide / chargement / erreur.

## Phase 4 — Studio éditeur + runtime
- [ ] `NodeRenderer` + 5 widgets + `stack` ; modes edit / preview / published.
- [ ] Layout 3 panneaux, header (fil d'Ariane, statut, Édition/Aperçu, Undo/Redo, Publier).
- [ ] Bibliothèque (ajout d'un nœud avec requête par défaut sur la table active), explorateur de données.
- [ ] Panneau Propriétés : formulaires générés depuis les schémas zod de props, éditeur SQL (monospace, validation serveur au blur), source, réordonnancement, suppression.
- [ ] Autosave du brouillon (debounce) + indicateur « Enregistré ».

## Phase 5 — Exécution des requêtes
- [ ] Introspection de schéma (cache).
- [ ] Validateur SQL (SPEC §6) + tests d'attaque (multi-statements, DELETE, UPDATE sans WHERE, table non autorisée, injection via params).
- [ ] Endpoint `run` : liaison des params, LIMIT, timeout, transaction, audit.
- [ ] Runtime front : `useAppQuery`, actions `runQuery`/`refetch`/`setState`/`toast`, sélection de ligne, soumission de formulaire.

## Phase 6 — Assistant IA
- [ ] Service serveur : SDK Anthropic, tool `apply_patch` (JSON Schema dérivé), prompt système versionné, contexte (schéma + arbre + requêtes + sélection + historique).
- [ ] Pipeline validation → dry-run → 1 retry → réponse ; persistance des messages.
- [ ] Endpoint `generate` (création d'app complète).
- [ ] UI `AiAssistant` : chat, suggestions contextuelles, SQL affiché, « Annuler cette modification », états d'erreur.
- [ ] Tests avec LLM mocké (fixtures de réponses valides et invalides).

## Phase 7 — Publication & durcissement
- [ ] Route runtime `/portal/apps/:appId` (version publiée, sans éditeur).
- [ ] e2e : P2 → P5 → P6 (Playwright ou l'outil e2e du repo), LLM mocké.
- [ ] Passe accessibilité (clavier, focus, contrastes) et responsive.
- [ ] Vérifier toute la checklist SPEC §9.
