# MoveToData — Tests E2E Playwright

Tests d'intégration de bout en bout pour la plateforme MoveToData.
Stack : Playwright + TypeScript, navigateur Chromium uniquement.

## Prérequis

- Node.js 18+
- L'instance MoveToData doit être démarrée (frontend sur port 8081, backend sur port 8080)
- Un compte de test dédié (ne pas utiliser un compte de production)

## Installation

```bash
# Depuis ce dossier (Docs/tests/playwright/)
npm install @playwright/test
npx playwright install chromium
```

> Si Playwright est déjà installé dans le projet racine, vous pouvez lancer les
> tests avec `npx playwright test` sans réinstaller.

## Configuration

Copiez le fichier d'exemple et renseignez vos valeurs :

```bash
cp .env.test.example .env.test
# Editez .env.test avec votre éditeur
```

Variables disponibles :

| Variable        | Défaut                   | Description                                      |
|-----------------|--------------------------|--------------------------------------------------|
| `BASE_URL`      | `http://localhost:8081`  | URL du frontend MoveToData                       |
| `TEST_USER`     | `admin`                  | Nom d'utilisateur du compte de test              |
| `TEST_PASSWORD` | *(requis)*               | Mot de passe du compte de test                   |
| `MOCK_AI`       | `true`                   | `true` pour intercepter les appels IA avec mocks |

Les variables sont chargées automatiquement si vous utilisez un fichier `.env.test`
avec `dotenv-cli` :

```bash
npx dotenv -e .env.test -- npx playwright test
```

## Lancer les tests

### Tous les tests

```bash
BASE_URL=http://localhost:8081 TEST_USER=admin TEST_PASSWORD=secret npx playwright test
```

### Un seul groupe de features (ex. F-AI)

```bash
npx playwright test specs/F-AI/
```

### Un seul fichier

```bash
npx playwright test specs/F-AI/F-AI-01-text-to-sql.spec.ts
```

### Mode interactif (UI mode)

```bash
npx playwright test --ui
```

### Rapport HTML après l'exécution

```bash
npx playwright show-report playwright-report
```

## Structure

```
Docs/tests/playwright/
├── playwright.config.ts          ← config principale
├── .env.test.example             ← variables d'environnement (à copier)
├── .auth/
│   └── user.json                 ← état de session généré par global-setup.ts (git-ignoré)
├── helpers/
│   ├── global-setup.ts           ← authentification unique (projet "setup")
│   ├── auth.ts                   ← fixture authenticatedPage + helpers login
│   └── api.ts                    ← helpers REST + factories de mocks
└── specs/
    ├── F-AUTH/                   ← Login / Logout
    ├── F-PORTAL/                 ← Home, Builds, Schedules
    ├── F-CONNECT/                ← Sources, détail source
    ├── F-DATASET/                ← Explorateur Kitab
    ├── F-KEPLER/                 ← Charts & Dashboards
    ├── F-SETTINGS/               ← Profil, préférences, tokens…
    ├── F-AI/                     ← Text-to-SQL, Analytics, Assistant, Smart Connector, Import
    └── F-DOCS/                   ← Documentation publique
```

## Conventions

- **Isolation** : chaque test est indépendant. Les specs utilisent `page.route()`
  pour mocker les API et ne laissent aucune donnée persistante.
- **Sélecteurs** : priorité aux `data-testid`, puis aux rôles ARIA, puis au
  texte visible. Les classes CSS générées ne sont jamais utilisées.
- **Credentials** : uniquement via variables d'environnement, jamais en dur.
- **Screenshots** : capturés automatiquement sur échec (`screenshot: 'only-on-failure'`).
- **Vidéos** : enregistrées en cas de retry (`video: 'retain-on-failure'`).

## Intégration CI

Exemple minimal pour GitHub Actions :

```yaml
- name: Run E2E tests
  working-directory: Docs/tests/playwright
  env:
    BASE_URL: http://localhost:8081
    TEST_USER: ${{ secrets.E2E_USER }}
    TEST_PASSWORD: ${{ secrets.E2E_PASSWORD }}
    MOCK_AI: "true"
  run: |
    npm install @playwright/test
    npx playwright install chromium --with-deps
    npx playwright test
```

> **Souveraineté** : aucun service externe (BrowserStack, SauceLabs, Sauce Connect)
> n'est utilisé. Les tests s'exécutent entièrement dans l'infrastructure MoveToData.
