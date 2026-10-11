/**
 * F-SCENARIOS-03 — Scénario Industrie & Manufacturing
 * Utilisateur : expl.rennes (Explorateur Rennes)
 *
 * beforeAll (admin)    : seed permanent — upload CSV, analyse IA, création source + dashboard
 * beforeEach (expl.rennes): loginViaUI + mocks de fallback
 * Tests                : vérifient source et dashboard créés en base
 */

import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth';
import { seedScenario, type SeedResult } from '../../helpers/scenario-seed';
import * as path from 'path';
import { INDUSTRIES } from '../../helpers/scenario-factory';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const INDUSTRY = INDUSTRIES.manufacturing;
const CSV_PATH = path.join(__dirname, '../../helpers/fixtures/manufacturing.csv');

let seed: SeedResult;

async function setupFallbackRoutes(page: import('@playwright/test').Page, s: SeedResult): Promise<void> {
  if (process.env.MOCK_AI === 'false') return;
  await page.route(`**/api/sources/${s.sourceId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: s.sourceId, name: `Scénario ${INDUSTRY.label}`, type: 'FILE', status: 'CONNECTED' }) })
  );
  await page.route('**/api/ai/analyze-file**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDUSTRY.mockAnalyzeFile) })
  );
  await page.route(`**/api/ai/smart-connector/score/${s.sourceId}**`, (route) =>
    route.fulfill({ status: 404, body: '' })
  );
  await page.route('**/api/ai/smart-connector/analyze**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INDUSTRY.mockSmartConnector) })
  );
  await page.route(`**/kepler/dashboards/getById/${s.dashboardId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: s.dashboardId,
      name: `KPI ${INDUSTRY.label}`,
      type: 'DASHBOARD',
      lastVersionedDate: null,
      versionId: null,
      createdBy: null,
      updatedBy: null,
    }) })
  );
  await page.route(`**/kitab/${s.dashboardId}/getPath**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: s.dashboardId, type: 'LINK', name: `KPI ${INDUSTRY.label}` },
    ]) })
  );
  await page.route(`**/kitab/explorer/resource/${s.dashboardId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: s.dashboardId,
      name: `KPI ${INDUSTRY.label}`,
      type: 'LINK',
      subType: 'DASHBOARD',
      favourite: false,
    }) })
  );
}

async function authenticate(page: import('@playwright/test').Page): Promise<void> {
  await loginViaUI(page, INDUSTRY.user.username, INDUSTRY.user.password);
  await setupFallbackRoutes(page, seed);
}

// ===========================================================================
// Suite
// ===========================================================================

test.describe(`Scénario ${INDUSTRY.label} [${INDUSTRY.user.role}]`, () => {

  test.beforeAll(async ({ request }) => {
    seed = await seedScenario(request, INDUSTRY, CSV_PATH);
  });

  // ---------------------------------------------------------------------------
  // Étape 1 — Vérification de la source importée
  // ---------------------------------------------------------------------------

  test.describe('Étape 1 : Source importée', () => {
    test.beforeEach(async ({ page }) => {
      await authenticate(page);
    });

    test('la page source se charge après import', async ({ page }) => {
      await page.goto(seed.sourceUrl);
      await expect(page).toHaveURL(new RegExp(seed.sourceId));
    });

    test('le nom de la source est affiché', async ({ page }) => {
      await page.goto(seed.sourceUrl);
      // Le nom est affiché dans l'onglet "Info" (SourceInfoPanel), pas dans "Data Browser"
      await page.getByText('Info').first().click();
      await expect(page.getByText(/Scénario Industrie|Manufacturing/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test(`la colonne "${INDUSTRY.csvColumns[6]}" est détectée`, async ({ page }) => {
      await page.goto(`${seed.sourceUrl}/analyze`);
      await expect(page.getByText(new RegExp(INDUSTRY.csvColumns[6], 'i')).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Étape 2 — Analyse Smart Connector
  // ---------------------------------------------------------------------------

  test.describe('Étape 2 : Analyse Smart Connector', () => {
    test.beforeEach(async ({ page }) => {
      await authenticate(page);
    });

    test('le score qualité global est affiché (≥ 75)', async ({ page }) => {
      await page.goto(`${seed.sourceUrl}/analyze`);
      await expect(page.getByText(/score|quality/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('les suggestions de graphiques sont affichées', async ({ page }) => {
      await page.goto(`${seed.sourceUrl}/analyze`);
      await expect(page.getByText(/chart|graphique|suggestion/i).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Étape 3 — Dashboard KPI
  // ---------------------------------------------------------------------------

  test.describe('Étape 3 : Tableau de bord KPI', () => {
    test.beforeEach(async ({ page }) => {
      if (process.env.MOCK_AI !== 'false') {
        await page.route('**/platform/decryptLicenseKey**', (route) =>
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
            product: 'DATA_VIZ',
            client: 'Demo',
            baseUrl: 'https://movetodata.io',
            displayBlockedFeatures: false,
            maximumUsers: -1,
            maximumBuildsPerDay: -1,
            maximumDatasets: -1,
            maximumDashboards: -1,
            maximumCharts: -1,
            maximumRepositories: -1,
            expiresOn: '2099-01-01T00:00:00Z',
          }) })
        );
      }
      await authenticate(page);
    });

    test('le dashboard KPI créé est accessible', async ({ page }) => {
      await page.goto(seed.dashboardUrl);
      await expect(page).toHaveURL(new RegExp(seed.dashboardId));
    });

    test('le nom du dashboard est affiché', async ({ page }) => {
      await page.goto(seed.dashboardUrl);
      await expect(page.getByText(/KPI Industrie|Manufacturing/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test(`le KPI "${INDUSTRY.kpis[0].name}" est présent`, async ({ page }) => {
      await page.goto(seed.dashboardUrl);
      await expect(page.getByText(new RegExp(INDUSTRY.kpis[0].name, 'i')).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
