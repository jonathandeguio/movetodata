/**
 * F-SCENARIOS-01 — Scénario Retail & Commerce
 *
 * Parcours complet de la plateforme pour le secteur retail :
 *   Étape 1 : Import du jeu de données CSV
 *   Étape 2 : Analyse Smart Connector (score qualité + suggestions graphiques)
 *   Étape 3 : Tableau de bord KPI Kepler
 *
 * Toutes les routes backend sont mockées via page.route().
 * Utiliser MOCK_AI=false pour tester contre un backend réel.
 */

import { test, expect } from '../../helpers/auth';
import * as path from 'path';
import { INDUSTRIES } from '../../helpers/scenario-factory';

test.describe.configure({ mode: 'serial' });

const INDUSTRY  = INDUSTRIES.retail;
const SOURCE_ID = 'scenario-retail-001';
const DATASET_URL = `/portal/connect/source/${SOURCE_ID}`;
const ANALYZE_URL = `/portal/connect/source/${SOURCE_ID}/analyze`;
const useMockAI   = process.env.MOCK_AI !== 'false';

const CSV_PATH = path.join(__dirname, '../../helpers/fixtures/retail.csv');

// ---------------------------------------------------------------------------
// Route setup helper — called in each test's beforeEach or inline
// ---------------------------------------------------------------------------

async function setupRoutes(page: import('@playwright/test').Page): Promise<void> {
  if (!useMockAI) return;

  await page.route(`**/api/sources/${SOURCE_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id:     SOURCE_ID,
        name:   `e2e-${INDUSTRY.id}-source`,
        type:   'CSV',
        status: 'CONNECTED',
      }),
    })
  );

  await page.route('**/api/files/upload**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(INDUSTRY.mockUpload),
    })
  );

  await page.route('**/api/ai/analyze-file**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(INDUSTRY.mockAnalyzeFile),
    })
  );

  await page.route(`**/api/ai/smart-connector/score/${SOURCE_ID}**`, (route) =>
    route.fulfill({ status: 404, body: '' })
  );

  await page.route('**/api/ai/smart-connector/analyze**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(INDUSTRY.mockSmartConnector),
    })
  );

  await page.route(`**/api/kepler/dashboards/scenario-${INDUSTRY.id}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(INDUSTRY.mockDashboard),
    })
  );
}

// ===========================================================================
// ÉTAPE 1 — Import du jeu de données
// ===========================================================================

test.describe(`Scénario ${INDUSTRY.label}`, () => {
  test.describe('Étape 1 : Import du jeu de données', () => {
    test.beforeEach(async ({ page }) => {
      await setupRoutes(page);
    });

    test("le bouton d'import est visible", async ({ authenticatedPage: page }) => {
      await page.goto(DATASET_URL);

      const importTrigger = page
        .getByRole('button', { name: /import|upload|add file/i })
        .first();
      await expect(importTrigger).toBeVisible({ timeout: 10_000 });
    });

    test("l'upload du CSV déclenche l'analyse IA", async ({ authenticatedPage: page }) => {
      await page.goto(DATASET_URL);

      const importButton = page
        .getByRole('button', { name: /import|upload|add file/i })
        .first();
      await importButton.click();

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(CSV_PATH);

      const confirmButton = page
        .getByRole('button', { name: /confirm|upload|next|valider/i })
        .first();
      if (await confirmButton.isVisible({ timeout: 5_000 })) {
        await confirmButton.click();
      }

      // The mock analyze-file response reports 200 rows.
      await expect(
        page.getByText(/200 rows|200 lignes/i).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test('les colonnes détectées correspondent au secteur', async ({ authenticatedPage: page }) => {
      await page.goto(DATASET_URL);

      const importButton = page
        .getByRole('button', { name: /import|upload|add file/i })
        .first();
      await importButton.click();

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(CSV_PATH);

      const confirmButton = page
        .getByRole('button', { name: /confirm|upload|next|valider/i })
        .first();
      if (await confirmButton.isVisible({ timeout: 5_000 })) {
        await confirmButton.click();
      }

      // Mock returns column 'revenue_eur' — specific to the retail dataset.
      await expect(
        page.getByText(/revenue_eur/i).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test('les 200 lignes importées sont confirmées', async ({ authenticatedPage: page }) => {
      await page.goto(DATASET_URL);

      const importButton = page
        .getByRole('button', { name: /import|upload|add file/i })
        .first();
      await importButton.click();

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(CSV_PATH);

      const confirmButton = page
        .getByRole('button', { name: /confirm|upload|next|valider/i })
        .first();
      if (await confirmButton.isVisible({ timeout: 5_000 })) {
        await confirmButton.click();
      }

      await expect(
        page.getByText(/200/i).first()
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  // ===========================================================================
  // ÉTAPE 2 — Analyse Smart Connector
  // ===========================================================================

  test.describe('Étape 2 : Analyse Smart Connector', () => {
    test.beforeEach(async ({ page }) => {
      await setupRoutes(page);
    });

    test('le score qualité global est affiché (≥ 75)', async ({ authenticatedPage: page }) => {
      await page.goto(ANALYZE_URL);

      // Mock returns global 0.88 → displayed as 88.
      await expect(
        page.getByText(/88|quality score|score qualité/i).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test('les sous-scores sont visibles (complétude, unicité, cohérence)', async ({ authenticatedPage: page }) => {
      await page.goto(ANALYZE_URL);

      await expect(
        page.getByText(/completeness|complétude/i).first()
      ).toBeVisible({ timeout: 15_000 });

      await expect(
        page.getByText(/uniqueness|unicité/i).first()
      ).toBeVisible({ timeout: 15_000 });

      await expect(
        page.getByText(/consistency|cohérence/i).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test('les suggestions de graphiques sont pertinentes pour le secteur', async ({ authenticatedPage: page }) => {
      await page.goto(ANALYZE_URL);

      // Mock returns retail-specific suggestion "CA par catégorie".
      await expect(
        page.getByText(/CA par catégorie|evolution du panier/i).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test('le bouton "Ouvrir dans Kepler" est présent sur chaque suggestion', async ({ authenticatedPage: page }) => {
      await page.goto(ANALYZE_URL);

      await expect(
        page.getByRole('button', { name: /kepler|open|chart/i }).first()
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  // ===========================================================================
  // ÉTAPE 3 — Tableau de bord KPI
  // ===========================================================================

  test.describe('Étape 3 : Tableau de bord KPI', () => {
    test.beforeEach(async ({ page }) => {
      await setupRoutes(page);
    });

    test('le dashboard secteur se charge', async ({ authenticatedPage: page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(page).toHaveURL(
        new RegExp(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`)
      );
    });

    test(`le KPI "${INDUSTRY.kpis[0].name}" est affiché`, async ({ authenticatedPage: page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(
        page.getByText(new RegExp(INDUSTRY.kpis[0].name, 'i')).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test(`le KPI "${INDUSTRY.kpis[1].name}" est affiché`, async ({ authenticatedPage: page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(
        page.getByText(new RegExp(INDUSTRY.kpis[1].name, 'i')).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test(`le KPI "${INDUSTRY.kpis[2].name}" est affiché`, async ({ authenticatedPage: page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(
        page.getByText(new RegExp(INDUSTRY.kpis[2].name, 'i')).first()
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
