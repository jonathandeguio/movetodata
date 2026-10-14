/**
 * mock-factory.ts — Centralized Playwright route mocks for F-SCENARIOS specs.
 *
 * All mocks are built from the real TypeScript interfaces (Source.d.ts,
 * explorer.d.ts, Dashboard.api.ts) to guarantee shape correctness.
 *
 * IMPORTANT — Playwright LIFO rule:
 *   page.route() handlers are called in REVERSE registration order (last added
 *   = first called). The catch-all logger MUST be registered FIRST so it runs
 *   LAST and does not intercept requests intended for specific mocks.
 *
 * Usage:
 *   import { setupFallbackRoutes } from '../../helpers/mock-factory';
 *   await setupFallbackRoutes(page, seed, INDUSTRY);
 */

import type { Page } from '@playwright/test';
import type { SeedResult } from './scenario-seed';
import type { DashboardChart } from './scenario-factory';
import { attachApiLogger } from './api-logger';

export interface IndustryConfig {
  label:               string;
  mockAnalyzeFile:     unknown;
  mockSmartConnector:  unknown;
  mockDashboardCharts: DashboardChart[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPosition(x: number, y: number, w = 6, h = 4): string {
  return JSON.stringify(
    JSON.stringify({ x, y, w, h, minH: 2, minW: 2, maxH: 20, maxW: 12, type: 'CHART' })
  );
}

function buildChartState(chart: DashboardChart, chartId: string): object {
  return {
    chartState: {
      id: chartId,
      chartType: chart.type,
      chartCustomize: JSON.stringify({
        titleToggle: true,
        title: chart.title,
        subTitleToggle: false,
        subTitle: '',
        chartTitleFontColor: '#000000',
        chartTitleFontSize: 14,
        chartTitleFontWeight: 400,
        titleAlign: 'left',
        // bigNumber fields (no-op for other chart types)
        bigNumberFontPrefix: '',
        bigNumberFontSuffix: '',
        bigNumberPrecision: 0,
        bigNumberMode: 'VALUE',
        bigNumberScale: 1,
        bigNumberFontSize: 32,
        bigNumberFontWeight: 700,
        bigNumberTop: 30,
        horizontalAlignment: 'center',
        verticalAlignment: 'middle',
        subHeader: '',
        subheaderTop: 65,
        subHeaderHorizontalAlignment: 'center',
        subHeaderFontSize: 14,
        subHeaderFontWeight: 400,
        seriesCustomize: [],
      }),
      series: [],
      xaxis: null,
    },
    chartData: { data: [], columns: [] },
    error: null,
  };
}

// ── Main setup ────────────────────────────────────────────────────────────────

export async function setupFallbackRoutes(
  page: Page,
  s: SeedResult,
  industry: IndustryConfig
): Promise<void> {
  if (process.env.MOCK_AI === 'false') return;

  // ── Catch-all logger — registered FIRST so it runs LAST (LIFO) ───────────
  // Only logs requests NOT intercepted by a specific mock below.
  attachApiLogger(page);

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

  // ── Dashboard header (kepler) ─────────────────────────────────────────────
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

  // ── Dashboard tabs ────────────────────────────────────────────────────────
  const tabId = `tab-${s.dashboardId}`;

  await page.route(`**/kepler/tabs/getDashboardTabs/${s.dashboardId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([{
        id: tabId, dashboardId: s.dashboardId,
        name: 'Vue principale', position: 0, uniqueId: tabId,
      }]),
    })
  );

  // ── Tab config (grid layout settings) ────────────────────────────────────
  await page.route(`**/kepler/tabs/getTabConfig/${tabId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        chartHeadingBg: null, background: null, backgroundOpacity: 1,
        chartHeadingColor: null,
      }),
    })
  );

  // ── Tab elements (chart grid) ─────────────────────────────────────────────
  const prefix = s.dashboardId.slice(0, 8);
  const tabElements = industry.mockDashboardCharts.map((chart, i) => ({
    id:        `elem-${i + 1}-${prefix}`,
    type:      'CHART',
    chartId:   `chart-${i + 1}-${prefix}`,
    position:  buildPosition((i % 2) * 6, Math.floor(i / 2) * 4),
    data:      null,
    createElement: false,
  }));

  await page.route(
    `**/kepler/tabElements/getElements/${s.dashboardId}/${tabId}**`,
    (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(tabElements),
    })
  );

  // ── Chart data (per chart ID) ─────────────────────────────────────────────
  const chartDataMap: Record<string, object> = {};
  industry.mockDashboardCharts.forEach((chart, i) => {
    const chartId = `chart-${i + 1}-${prefix}`;
    chartDataMap[chartId] = buildChartState(chart, chartId);
  });

  await page.route('**/dataset/getChartDataByIds**', async (route) => {
    const body = await route.request().postDataJSON().catch(() => null) as { chartIds?: string[] } | null;
    const chartId = body?.chartIds?.[0];
    const data = chartId && chartDataMap[chartId] ? [chartDataMap[chartId]] : [];
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });

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
}
