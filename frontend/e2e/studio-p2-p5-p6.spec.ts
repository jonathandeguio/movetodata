/**
 * E2E tests — Studio de Webapps IA (Phase 7)
 *
 * Parcours couverts (SPEC §3) :
 *   P2 — Créer une application et ouvrir le Studio
 *   P5 — Ajouter un composant, vérifier les Propriétés et l'autosave
 *   P6 — Envoyer un message à l'assistant IA (LLM mocké via page.route)
 *
 * Toutes les APIs backend sont interceptées via page.route() pour que
 * le test soit autonome (pas de backend requis).
 */

import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

// ---------------------------------------------------------------------------
// Fixtures de données minimales
// ---------------------------------------------------------------------------

const APP_ID = 'app-test-e2e-1';

const MINIMAL_DEFINITION = JSON.stringify({
  schemaVersion: 1,
  id: APP_ID,
  name: 'App E2E Test',
  datasourceId: 'ds-1',
  queries: {},
  state: {},
  pages: [
    {
      id: 'page-1',
      name: 'Page principale',
      root: {
        id: 'root-1',
        type: 'stack',
        props: { gap: 16 },
        children: [],
      },
    },
  ],
});

const DRAFT_V1 = {
  id: 'version-1',
  appId: APP_ID,
  version: 1,
  definition: MINIMAL_DEFINITION,
  createdAt: new Date().toISOString(),
};

const DRAFT_V2 = {
  id: 'version-2',
  appId: APP_ID,
  version: 2,
  definition: MINIMAL_DEFINITION,
  createdAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Setup : mocks des APIs et login
// ---------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  // Mock sources (liste des connexions disponibles)
  await page.route('**/connect/source/Getall', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'ds-1', name: 'Demo Source', type: 'POSTGRESQL' }]),
    });
  });

  // Mock création d'app
  await page.route('**/api/studio/apps', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(DRAFT_V1),
      });
    } else {
      await route.continue();
    }
  });

  // Mock brouillon (lecture et sauvegarde)
  await page.route(`**/api/studio/apps/${APP_ID}/draft`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DRAFT_V1),
      });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DRAFT_V2),
      });
    } else {
      await route.continue();
    }
  });

  // Mock assistant IA (LLM mocké — réponse vide sans patch)
  await page.route(`**/api/studio/apps/${APP_ID}/ai`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        explanation: 'Voici votre tableau.',
        patch: [],
      }),
    });
  });

  // Authentification
  await loginAs(page);
});

// ---------------------------------------------------------------------------
// P2 — Créer une application et ouvrir le Studio
// ---------------------------------------------------------------------------

test.describe('P2 — Création d\'application', () => {
  test('doit créer une application et ouvrir le Studio', async ({ page }) => {
    // Aller sur la page des applications
    await page.goto('/portal/applications');

    // Ouvrir la modale de création
    const newAppButton = page.getByRole('button', { name: /nouvelle application/i });
    await expect(newAppButton).toBeVisible({ timeout: 10000 });
    await newAppButton.click();

    // Vérifier que la modale s'est ouverte
    const modal = page.locator('.ant-modal-content');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Nouvelle application')).toBeVisible();

    // Remplir le nom
    const nameInput = modal.locator('input[id="name"]');
    await nameInput.fill('App E2E Test');

    // Sélectionner la source de données
    const sourceSelect = modal.locator('.ant-select').first();
    await sourceSelect.click();
    const option = page.locator('.ant-select-item-option', { hasText: 'Demo Source' });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();

    // Cliquer sur "Créer vide"
    const createButton = modal.getByRole('button', { name: /créer vide/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Vérifier la redirection vers le Studio
    await page.waitForURL(`**/portal/applications/${APP_ID}/studio`, { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(`/portal/applications/${APP_ID}/studio`));
  });
});

// ---------------------------------------------------------------------------
// P5 — Ajouter un composant et vérifier l'autosave
// ---------------------------------------------------------------------------

test.describe('P5 — Composant et autosave', () => {
  test('doit ajouter un composant tableau et indiquer "Enregistré"', async ({ page }) => {
    // Accéder directement au Studio (déjà créé)
    await page.goto(`/portal/applications/${APP_ID}/studio`);

    // Attendre que le Studio soit chargé
    await expect(page.locator('[data-testid="studio-header"], .studio-header, header')).toBeVisible({
      timeout: 10000,
    }).catch(() => {
      // Fallback : attendre simplement que la page ne soit plus en chargement
    });

    // Attendre que le bouton de bibliothèque soit présent
    const addTableButton = page.getByRole('button', { name: /ajouter un composant tableau/i });
    await expect(addTableButton).toBeVisible({ timeout: 10000 });

    // Ajouter un composant Tableau
    await addTableButton.click();

    // Vérifier que le panneau Propriétés s'affiche après sélection
    // (Le composant ajouté devrait être sélectionnable)
    const tableNode = page.locator('[aria-label*="Sélectionner le composant table"]').first();
    await expect(tableNode).toBeVisible({ timeout: 5000 });
    await tableNode.click();

    // Vérifier que l'onglet Propriétés est présent
    const propertiesTab = page.getByRole('tab', { name: /propriétés/i });
    await expect(propertiesTab).toBeVisible({ timeout: 5000 });

    // Vérifier que l'indicateur "Enregistré" apparaît (après autosave, délai max 5s)
    await expect(page.getByText('Enregistré')).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// P6 — Envoyer un message à l'assistant IA (LLM mocké)
// ---------------------------------------------------------------------------

test.describe('P6 — Assistant IA (LLM mocké)', () => {
  test('doit envoyer un message et afficher la réponse de l\'IA', async ({ page }) => {
    // Accéder directement au Studio
    await page.goto(`/portal/applications/${APP_ID}/studio`);

    // Attendre le chargement du Studio
    await expect(page.getByRole('button', { name: /ajouter un composant tableau/i })).toBeVisible({
      timeout: 10000,
    });

    // Cliquer sur l'onglet "Assistant IA"
    const aiTab = page.getByRole('tab', { name: /assistant ia/i });
    await expect(aiTab).toBeVisible({ timeout: 5000 });
    await aiTab.click();

    // Vérifier que le panneau IA est visible
    const aiPanel = page.locator('[role="log"]');
    await expect(aiPanel).toBeVisible({ timeout: 5000 });

    // Taper un message
    const textarea = page.locator('textarea[placeholder*="modification"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill('Ajoute un tableau de données clients');

    // Cliquer sur "Envoyer"
    const sendButton = page.getByRole('button', { name: /envoyer le message/i });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Vérifier que la réponse mockée s'affiche dans le log
    await expect(page.locator('[role="log"]').getByText('Voici votre tableau.')).toBeVisible({
      timeout: 10000,
    });
  });
});
