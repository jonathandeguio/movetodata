/**
 * mock-factory.ts — Centralized Playwright route mocks for F-SCENARIOS specs.
 *
 * All mocks are built from the real TypeScript interfaces (Source.d.ts,
 * explorer.d.ts, Dashboard.api.ts) to guarantee shape correctness.
 *
 * Usage:
 *   import { setupFallbackRoutes } from '../../helpers/mock-factory';
 *   await setupFallbackRoutes(page, seed, INDUSTRY);
 */

import type { Page } from '@playwright/test';
import type { SeedResult } from './scenario-seed';
import { attachApiLogger } from './api-logger';

export interface IndustryConfig {
  label: string;
  mockAnalyzeFile: unknown;
  mockSmartConnector: unknown;
}

export async function setupFallbackRoutes(
  page: Page,
  s: SeedResult,
  industry: IndustryConfig
): Promise<void> {
  if (process.env.MOCK_AI === 'false') return;

  // ── License ──────────────────────────────────────────────────────────────
  await page.route('**/platform/decryptLicenseKey**', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        product: 'DATA_VIZ', client: 'Demo', baseUrl: 'https://movetodata.io',
        displayBlockedFeatures: false, maximumUsers: -1, maximumBuildsPerDay: -1,
        maximumDatasets: -1, maximumDashboards: -1, maximumCharts: -1,
        maximumRepositories: -1, expiresOn: 4102444800000,
      }),
    })
  );

  // ── Source (ISourceConfig) ───────────────────────────────────────────────
  await page.route(`**/connect/source/GetById/${s.sourceId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: s.sourceId, name: `Scénario ${industry.label}`, type: 'FILE',
        status: 'CONNECTED', parent: '', agentId: [], description: '',
        path: '', timeout: '', server: '', port: '', database: '',
        username: '', password: '', token: '', url: '', method: '',
        dbmsType: '', authType: 'DEFAULT', privateKey: '',
        privateKeyPassPhrase: '', warehouse: '', schema: '', userRole: '',
        directLoad: true, build: true,
      }),
    })
  );

  // ── Source links — returns empty array, prevents unhandled rejection ──────
  await page.route(`**/connect/source/${s.sourceId}/links**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  // ── Kitab folder — parent='' calls /kitab/folder/, prevent unhandled ──────
  await page.route('**/kitab/folder/**', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: '', name: '', type: 'FOLDER', children: [] }),
    })
  );

  // ── Project tree (Resource) ───────────────────────────────────────────────
  await page.route(`**/kitab/explorer/projectRoot/${s.sourceId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: s.sourceId, name: `Scénario ${industry.label}`, type: 'FILE',
        subType: '', status: 'ACTIVE', children: [], description: null,
        workspace: null, size: 0, createdBy: null, updatedBy: null,
        createdAt: 0, updatedAt: 0, metaData: null, favourite: false,
      }),
    })
  );
  await page.route(`**/kitab/explorer/projectRoot/${s.dashboardId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: s.dashboardId, name: `KPI ${industry.label}`, type: 'LINK',
        subType: 'DASHBOARD', status: 'ACTIVE', children: [], description: null,
        workspace: null, size: 0, createdBy: null, updatedBy: null,
        createdAt: 0, updatedAt: 0, metaData: null, favourite: false,
      }),
    })
  );

  // ── Resource details (Resource interface) ─────────────────────────────────
  await page.route(`**/kitab/explorer/resource/${s.sourceId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: s.sourceId, name: `Scénario ${industry.label}`, type: 'FILE',
        subType: '', status: 'ACTIVE', children: [], description: null,
        workspace: null, size: 0, createdBy: null, updatedBy: null,
        createdAt: 0, updatedAt: 0, metaData: null, favourite: false,
      }),
    })
  );
  await page.route(`**/kitab/explorer/resource/${s.dashboardId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: s.dashboardId, name: `KPI ${industry.label}`, type: 'LINK',
        subType: 'DASHBOARD', status: 'ACTIVE', children: [], description: null,
        workspace: null, size: 0, createdBy: null, updatedBy: null,
        createdAt: 0, updatedAt: 0, metaData: null, favourite: false,
      }),
    })
  );

  // ── Breadcrumb paths ──────────────────────────────────────────────────────
  await page.route(`**/kitab/${s.sourceId}/getPath**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { id: s.sourceId, type: 'FILE', name: `Scénario ${industry.label}` },
      ]),
    })
  );
  await page.route(`**/kitab/${s.dashboardId}/getPath**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { id: s.dashboardId, type: 'LINK', name: `KPI ${industry.label}` },
      ]),
    })
  );

  // ── Dashboard (kepler) ────────────────────────────────────────────────────
  await page.route(`**/kepler/dashboards/getById/${s.dashboardId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        id: s.dashboardId, name: `KPI ${industry.label}`, type: 'DASHBOARD',
        lastVersionedDate: null, versionId: null,
        createdBy: null, updatedBy: null,
      }),
    })
  );

  // ── AI endpoints ──────────────────────────────────────────────────────────
  await page.route('**/api/ai/analyze-file**', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(industry.mockAnalyzeFile),
    })
  );
  await page.route(`**/api/ai/smart-connector/score/${s.sourceId}**`, (route) =>
    route.fulfill({ status: 404, body: '' })
  );
  await page.route('**/api/ai/smart-connector/analyze**', (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(industry.mockSmartConnector),
    })
  );

  // ── Catch-all logger — logs any API call not matched above ────────────────
  attachApiLogger(page);
}
