## Brique « Studio de Webapps IA »

- Spécification : @docs/studio/SPEC.md — Plan : @docs/studio/PLAN.md
- Prototype visuel (référence layout/couleurs/libellés, pas du code à copier) : `docs/studio/prototype/studio-prototype.dc.html`
- Exemple de définition d'app : `docs/studio/example-app.json`

Règles :
- Travailler phase par phase selon PLAN.md ; mettre à jour les cases ; ne pas anticiper la phase suivante.
- Toute modification d'une application passe par `PatchOp` + `applyPatch` (jamais de mutation directe de l'arbre).
- Un seul `NodeRenderer` pour éditeur, aperçu et runtime publié.
- Sécurité SQL (SPEC §6) non négociable : le front n'envoie jamais de SQL à exécuter, seulement `queryId` + `params`.
- Appels LLM uniquement côté serveur, sortie structurée via tool use, validée avant application.
- Réutiliser les conventions, libs et composants UI existants du repo ; demander avant d'ajouter une dépendance.
- Avant de terminer une tâche : lint, typecheck et tests au vert.
- UI en français.
