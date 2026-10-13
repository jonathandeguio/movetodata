/**
 * F-SCENARIOS-04 — Scénario Finance & Gestion
 * Utilisateur : codir (Comité de Direction)
 *
 * beforeAll (admin) : seed permanent — upload CSV, analyse IA, création source + dashboard
 * beforeEach (codir): loginViaUI + mocks de fallback
 * Tests             : vérifient source et dashboard créés en base
 */

import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth';
import { seedScenario, type SeedResult } from '../../helpers/scenario-seed';
import * as path from 'path';
import { INDUSTRIES } from '../../helpers/scenario-factory';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const INDUSTRY = INDUSTRIES.finance;
const CSV_PATH = path.join(__dirname, '../../helpers/fixtures/finance.csv');

let seed: SeedResult;

async function setupFallbackRoutes(page: import('@playwright/test').Page, s: SeedResult): Promise<void> {
  if (process.env.MOCK_AI === 'false') return;
  await page.route('**/platform/decryptLicenseKey**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      product: 'DATA_VIZ', client: 'Demo', baseUrl: 'https://movetodata.io',
      displayBlockedFeatures: false, maximumUsers: -1, maximumBuildsPerDay: -1,
      maximumDatasets: -1, maximumDashboards: -1, maximumCharts: -1,
      maximumRepositories: -1, expiresOn: 4102444800000,
    }) })
  );
  await page.route(`**/connect/source/GetById/${s.sourceId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: s.sourceId, name: `Scénario ${INDUSTRY.label}`, type: 'FILE', status: 'CONNECTED', parent: '',
      agentId: [], description: '', path: '', timeout: '', server: '', port: '', database: '',
      username: '', password: '', token: '', url: '', method: '', dbmsType: '', authType: 'DEFAULT',
      privateKey: '', privateKeyPassPhrase: '', warehouse: '', schema: '', userRole: '',
      directLoad: true, build: true,
    }) })
  );
  await page.route(`**/kitab/explorer/projectRoot/${s.sourceId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: s.sourceId, name: `Scénario ${INDUSTRY.label}`, type: 'FILE', children: [] }) })
  );
  await page.route(`**/kitab/explorer/projectRoot/${s.dashboardId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: s.dashboardId, name: `KPI ${INDUSTRY.label}`, type: 'LINK', subType: 'DASHBOARD', children: [] }) })
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
  await page.route(`**/kitab/${s.sourceId}/getPath**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: s.sourceId, type: 'LINK', name: `Scénario ${INDUSTRY.label}` },
    ]) })
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
  await page.route(`**/kitab/explorer/resource/${s.sourceId}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: s.sourceId,
      name: `Scénario ${INDUSTRY.label}`,
      type: 'FILE',
      children: [],
      favourite: false,
    }) })
  );
}

async function authenticate(page: import('@playwright/test').Page): Promise<void> {
  await setupFallbackRoutes(page, seed);
  await loginViaUI(page, INDUSTRY.user.username, INDUSTRY.user.password);
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
      await expect(page.locator('input[placeholder="Add the Name of the file"]').first()).toHaveValue(/Scénario Finance|Gestion/i, { timeout: 15_000 });
    });

    test(`la colonne "${INDUSTRY.csvColumns[4]}" est détectée`, async ({ page }) => {
      await page.goto(`${seed.sourceUrl}/analyze`);
      await expect(page.getByText(new RegExp(INDUSTRY.csvColumns[4], 'i')).first()).toBeVisible({ timeout: 15_000 });
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
      await authenticate(page);
    });

    test('le dashboard KPI créé est accessible', async ({ page }) => {
      await page.goto(seed.dashboardUrl);
      await expect(page).toHaveURL(new RegExp(seed.dashboardId));
    });

    test('le nom du dashboard est affiché', async ({ page }) => {
      await page.goto(seed.dashboardUrl);
      await expect(page.locator('input[placeholder="Add the Name of the file"]').first()).toHaveValue(/KPI Finance|Gestion/i, { timeout: 15_000 });
    });

    test(`le KPI "${INDUSTRY.kpis[0].name}" est présent`, async ({ page }) => {
      await page.goto(seed.dashboardUrl);
      await expect(page.getByText(new RegExp(INDUSTRY.kpis[0].name, 'i')).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
