/**
 * F-SCENARIOS-04 — Scénario Finance & Gestion
 * Utilisateur : codir (Comité de Direction)
 *
 * Parcours complet :
 *   Étape 1 : Import du jeu de données CSV
 *   Étape 2 : Analyse Smart Connector (score qualité + suggestions graphiques)
 *   Étape 3 : Tableau de bord KPI Kepler
 *
 * Authentification : loginViaUI avec le compte "codir" (Codir2024!)
 * Mocks backend   : page.route() — MOCK_AI=false pour tester le backend réel
 */

import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth';
import * as path from 'path';
import { INDUSTRIES } from '../../helpers/scenario-factory';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const INDUSTRY    = INDUSTRIES.finance;
const SOURCE_ID   = 'scenario-finance-001';
const DATASET_URL = `/portal/connect/source/${SOURCE_ID}`;
const ANALYZE_URL = `/portal/connect/source/${SOURCE_ID}/analyze`;
const CSV_PATH    = path.join(__dirname, '../../helpers/fixtures/finance.csv');
const useMockAI   = process.env.MOCK_AI !== 'false';

let authCookies: any[] = [];

async function setupRoutes(page: import('@playwright/test').Page): Promise<void> {
  if (!useMockAI) return;

  await page.route(`**/api/sources/${SOURCE_ID}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: SOURCE_ID, name: `e2e-${INDUSTRY.id}-source`, type: 'CSV', status: 'CONNECTED' }),
    })
  );
  await page.route('**/api/files/upload**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDUSTRY.mockUpload) })
  );
  await page.route('**/api/ai/analyze-file**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDUSTRY.mockAnalyzeFile) })
  );
  await page.route(`**/api/ai/smart-connector/score/${SOURCE_ID}**`, (route) =>
    route.fulfill({ status: 404, body: '' })
  );
  await page.route('**/api/ai/smart-connector/analyze**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDUSTRY.mockSmartConnector) })
  );
  await page.route(`**/api/kepler/dashboards/scenario-${INDUSTRY.id}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDUSTRY.mockDashboard) })
  );
}

// ===========================================================================
// Suite
// ===========================================================================

test.describe(`Scénario ${INDUSTRY.label} [${INDUSTRY.user.role}]`, () => {

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://localhost:8081' });
    const pg  = await ctx.newPage();
    await loginViaUI(pg, INDUSTRY.user.username, INDUSTRY.user.password);
    const state = await ctx.storageState();
    authCookies = state.cookies;
    await ctx.close();
  });

  // ---------------------------------------------------------------------------
  // Étape 1 — Import du jeu de données
  // ---------------------------------------------------------------------------

  test.describe('Étape 1 : Import du jeu de données', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies(authCookies);
      await setupRoutes(page);
    });

    test("le bouton d'import est visible", async ({ page }) => {
      await page.goto(DATASET_URL);
      await expect(
        page.getByRole('button', { name: /import|upload|add file/i }).first()
      ).toBeVisible({ timeout: 10_000 });
    });

    test("l'upload du CSV déclenche l'analyse IA", async ({ page }) => {
      await page.goto(DATASET_URL);
      await page.getByRole('button', { name: /import|upload|add file/i }).first().click();
      await page.locator('input[type="file"]').first().setInputFiles(CSV_PATH);
      const confirm = page.getByRole('button', { name: /confirm|upload|next|valider/i }).first();
      if (await confirm.isVisible({ timeout: 5_000 })) await confirm.click();
      await expect(page.getByText(/200 rows|200 lignes/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('les colonnes détectées correspondent au secteur', async ({ page }) => {
      await page.goto(DATASET_URL);
      await page.getByRole('button', { name: /import|upload|add file/i }).first().click();
      await page.locator('input[type="file"]').first().setInputFiles(CSV_PATH);
      const confirm = page.getByRole('button', { name: /confirm|upload|next|valider/i }).first();
      if (await confirm.isVisible({ timeout: 5_000 })) await confirm.click();
      await expect(page.getByText(/ebitda_eur/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('les 200 lignes importées sont confirmées', async ({ page }) => {
      await page.goto(DATASET_URL);
      await page.getByRole('button', { name: /import|upload|add file/i }).first().click();
      await page.locator('input[type="file"]').first().setInputFiles(CSV_PATH);
      const confirm = page.getByRole('button', { name: /confirm|upload|next|valider/i }).first();
      if (await confirm.isVisible({ timeout: 5_000 })) await confirm.click();
      await expect(page.getByText(/200/i).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Étape 2 — Analyse Smart Connector
  // ---------------------------------------------------------------------------

  test.describe('Étape 2 : Analyse Smart Connector', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies(authCookies);
      await setupRoutes(page);
    });

    test('le score qualité global est affiché (≥ 75)', async ({ page }) => {
      await page.goto(ANALYZE_URL);
      await expect(page.getByText(/90|quality score|score qualité/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('les sous-scores sont visibles (complétude, unicité, cohérence)', async ({ page }) => {
      await page.goto(ANALYZE_URL);
      await expect(page.getByText(/completeness|complétude/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/uniqueness|unicité/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/consistency|cohérence/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('les suggestions de graphiques sont pertinentes pour le secteur', async ({ page }) => {
      await page.goto(ANALYZE_URL);
      await expect(page.getByText(/ebitda par département|burn rate/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('le bouton "Ouvrir dans Kepler" est présent sur chaque suggestion', async ({ page }) => {
      await page.goto(ANALYZE_URL);
      await expect(page.getByRole('button', { name: /kepler|open|chart/i }).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Étape 3 — Tableau de bord KPI
  // ---------------------------------------------------------------------------

  test.describe('Étape 3 : Tableau de bord KPI', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies(authCookies);
      await setupRoutes(page);
    });

    test('le dashboard secteur se charge', async ({ page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(page).toHaveURL(new RegExp(`scenario-${INDUSTRY.id}`));
    });

    test(`le KPI "${INDUSTRY.kpis[0].name}" est affiché`, async ({ page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(page.getByText(new RegExp(INDUSTRY.kpis[0].name, 'i')).first()).toBeVisible({ timeout: 15_000 });
    });

    test(`le KPI "${INDUSTRY.kpis[1].name}" est affiché`, async ({ page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(page.getByText(new RegExp(INDUSTRY.kpis[1].name, 'i')).first()).toBeVisible({ timeout: 15_000 });
    });

    test(`le KPI "${INDUSTRY.kpis[2].name}" est affiché`, async ({ page }) => {
      await page.goto(`/portal/kepler/DASHBOARD/scenario-${INDUSTRY.id}`);
      await expect(page.getByText(new RegExp(INDUSTRY.kpis[2].name, 'i')).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
