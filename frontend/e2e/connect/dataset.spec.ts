/**
 * E2E tests — Connect > Sources : création d'une source PostgreSQL
 *
 * Page testée : /portal/connect/source
 * Composants  : ConnectSources.view.tsx
 *               SourceModal.view.tsx (BoslerModal + BoslerInput + Ant Design)
 *               SourceTable.view.tsx (Ant Design Table)
 *
 * Sélecteurs utilisés :
 *   button[name=/new/i]         — BoslerButton intent="action" (getLanguageLabel("new"))
 *   .Selectable-Cards           — cartes de sélection du connecteur dans SourceModal
 *   .ant-modal-body             — corps de la modale
 *   input.inputComponent        — inputs BoslerInput (wrappent Ant Design Input)
 *   getByPlaceholder(...)       — champs Server, Port, Database, Username
 *   input[type="password"]      — champ Ant Design Input.Password
 *   button[name=/create|créer/] — bouton de soumission du formulaire
 *   .ant-table-tbody            — corps du tableau de sources
 *
 * Variables d'env :
 *   TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD
 */

import { expect, test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

// ---------------------------------------------------------------------------
// Helpers locaux
// ---------------------------------------------------------------------------

const DB_HOST = process.env.TEST_DB_HOST ?? 'localhost';
const DB_PORT = process.env.TEST_DB_PORT ?? '5432';
const DB_NAME = process.env.TEST_DB_NAME ?? 'boson';
const DB_USER = process.env.TEST_DB_USER ?? 'movetodata';
const DB_PASS = process.env.TEST_DB_PASSWORD ?? 'movetodata';

// Nom unique pour éviter les collisions entre runs
function uniqueSourceName(): string {
  return `e2e-postgres-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Connect – Sources PostgreSQL', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 1. La page /portal/connect/source charge correctement
  // -------------------------------------------------------------------------

  test('should display the Sources page with a "New" button', async ({ page }) => {
    await page.goto('/portal/connect/source');

    // ConnectSources.view.tsx affiche le titre "Dataset Sources"
    // getLanguageLabel("datasetSources") → "Dataset Sources" (en)
    await expect(
      page.getByText(/dataset sources/i).first(),
    ).toBeVisible({ timeout: 15000 });

    // BoslerButton intent="action" avec getLanguageLabel("new") → "New"
    const newButton = page.getByRole('button', { name: /^new$/i });
    await expect(newButton).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 2. Ouverture de la modale de création
  // -------------------------------------------------------------------------

  test('should open the source creation modal when "New" is clicked', async ({ page }) => {
    await page.goto('/portal/connect/source');

    const newButton = page.getByRole('button', { name: /^new$/i });
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();

    // La BoslerModal s'ouvre avec le titre "Source"
    await expect(page.locator('.ant-modal-body')).toBeVisible({ timeout: 8000 });

    // La modale affiche les cartes de connecteurs (.Selectable-Cards)
    await expect(
      page.locator('.Selectable-Cards').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  // 3. Sélection du connecteur PostgreSQL
  // -------------------------------------------------------------------------

  test('should display the PostgreSQL form after selecting the connector', async ({ page }) => {
    await page.goto('/portal/connect/source');

    await page.getByRole('button', { name: /^new$/i }).click();
    await expect(page.locator('.Selectable-Cards').first()).toBeVisible({ timeout: 10000 });

    // Cliquer sur la carte PostgreSQL (contient "postgres" dans le SVG label)
    const postgresCard = page.locator('.Selectable-Cards').filter({ hasText: /postgres/i }).first();
    await expect(postgresCard).toBeVisible({ timeout: 8000 });
    await postgresCard.click();

    // La modale passe en mode formulaire JDBC
    // Le titre devient "Source > postgres" (breadcrumb dans le heading)
    // Et affiche la section "DATABASE" (getLanguageLabel("database").toUpperCase())
    await expect(
      page.locator('.BoslerHeader1', { hasText: /database/i }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  // 4. Happy path — création complète d'une source PostgreSQL
  // -------------------------------------------------------------------------

  test('should create a PostgreSQL source and display it in the table', async ({ page }) => {
    const sourceName = uniqueSourceName();

    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /^new$/i }).click();
    await expect(page.locator('.Selectable-Cards').first()).toBeVisible({ timeout: 10000 });

    // Sélectionner PostgreSQL
    const postgresCard = page.locator('.Selectable-Cards').filter({ hasText: /postgres/i }).first();
    await postgresCard.click();

    const modalBody = page.locator('.ant-modal-body');
    await expect(modalBody).toBeVisible({ timeout: 8000 });

    // --- Remplir le formulaire ---

    // Champ Name : premier .inputComponent (autofocus, sans placeholder)
    const nameInput = modalBody.locator('input.inputComponent').first();
    await nameInput.fill(sourceName);

    // Server
    await modalBody.getByPlaceholder('Server').fill(DB_HOST);

    // Port (placeholder "443" dans SourceModal.view.tsx)
    await modalBody.getByPlaceholder('443').fill(DB_PORT);

    // Database
    await modalBody.getByPlaceholder('Database').fill(DB_NAME);

    // Username (getLanguageLabel("userName") → "Username" en anglais)
    await modalBody.getByPlaceholder(/username/i).fill(DB_USER);

    // Password — Input.Password d'Ant Design
    await modalBody.locator('input[type="password"]').fill(DB_PASS);

    // --- Soumettre ---
    // getLanguageLabel("create") → "Create"
    const createButton = page.getByRole('button', { name: /^(create|créer)$/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // La modale se ferme après la création
    await expect(page.locator('.ant-modal-body')).not.toBeVisible({ timeout: 20000 });

    // La source apparaît dans le tableau
    // SourceTable2 utilise un Ant Design Table — chercher le nom dans .ant-table-tbody
    await expect(
      page.locator('.ant-table-tbody').getByText(sourceName),
    ).toBeVisible({ timeout: 15000 });
  });

  // -------------------------------------------------------------------------
  // 5. Cas d'erreur — formulaire incomplet
  // -------------------------------------------------------------------------

  test('should show a warning when submitting an incomplete form', async ({ page }) => {
    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /^new$/i }).click();

    const postgresCard = page.locator('.Selectable-Cards').filter({ hasText: /postgres/i }).first();
    await expect(postgresCard).toBeVisible({ timeout: 10000 });
    await postgresCard.click();

    const modalBody = page.locator('.ant-modal-body');
    await expect(modalBody).toBeVisible({ timeout: 8000 });

    // Cliquer "Create" sans remplir les champs → notification "Details incomplete"
    const createButton = page.getByRole('button', { name: /^(create|créer)$/i });
    await createButton.click();

    // openNotification("Details incomplete", ...) → .ant-notification-notice-message
    await expect(
      page.locator('.ant-notification-notice-message', {
        hasText: /details incomplete/i,
      }),
    ).toBeVisible({ timeout: 8000 });

    // La modale reste ouverte
    await expect(page.locator('.ant-modal-body')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 6. Fermeture de la modale sans créer
  // -------------------------------------------------------------------------

  test('should close the modal when cancel is clicked', async ({ page }) => {
    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /^new$/i }).click();

    await expect(page.locator('.ant-modal-body')).toBeVisible({ timeout: 10000 });

    // La BoslerModal a un bouton de fermeture (X) rendu par Ant Design Modal
    // La prop closable est false sur la SourceModal — on utilise le bouton Cancel
    // rendu dans le footer via onCancel={() => setIsVisible(false)}
    // Le bouton Cancel est rendu par le composant BoslerModal avec le rôle button
    const cancelButton = page.locator('.ant-modal-footer button').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      // Fermer en cliquant en dehors de la modale (mask click)
      await page.keyboard.press('Escape');
    }

    await expect(page.locator('.ant-modal-body')).not.toBeVisible({ timeout: 8000 });
  });
});
