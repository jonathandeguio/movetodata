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
    JSON.stringify({ x, y, w, h, minH: 2, minW: 2, maxH: 20, maxW: 12, type: 'chart' })
  );
}

interface SeriesShape {
  series:    unknown[];
  xaxis:     unknown;
  chartData: { data: unknown[][]; columns: string[] };
}

function buildSeriesForType(chartType: string): SeriesShape {
  switch (chartType) {
    case 'VerticalAxisChart':
      return {
        series: [{ name: 'Valeur', type: 'bar', data: [120, 200, 150, 80, 170, 110, 230] }],
        xaxis:  { data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'] },
        chartData: {
          data:    [[120], [200], [150], [80], [170], [110], [230]],
          columns: ['valeur'],
        },
      };
    case 'horizontalBarChart':
      return {
        series: [{ name: 'Total', type: 'bar', data: [45, 82, 37] }],
        xaxis:  { data: ['Enterprise', 'Pro', 'Starter'] },
        chartData: { data: [[45], [82], [37]], columns: ['total'] },
      };
    case 'pieChart':
      return {
        series: [{
          name: 'Répartition', type: 'pie',
          data: [{ name: 'Catégorie A', value: 40 }, { name: 'Catégorie B', value: 35 }, { name: 'Catégorie C', value: 25 }],
        }],
        xaxis: null,
        chartData: { data: [['Catégorie A', 40], ['Catégorie B', 35], ['Catégorie C', 25]], columns: ['categorie', 'valeur'] },
      };
    case 'gaugeChart':
      return {
        series: [{ name: 'Score', type: 'gauge', data: [{ name: 'Valeur', value: 75 }] }],
        xaxis:  null,
        chartData: { data: [[75]], columns: ['score'] },
      };
    case 'waterFallChart':
      return {
        series: [
          { name: 'placeholder', type: 'bar', stack: 'Total', itemStyle: { borderColor: 'transparent', color: 'transparent' }, data: [0, 80000, 0, 20000] },
          { name: 'Valeur',      type: 'bar', stack: 'Total', data: [200000, 50000, -80000, 0] },
        ],
        xaxis:  { data: ['Base', 'Q1', 'Q2', 'Total'] },
        chartData: { data: [[200000], [50000], [-80000], [0]], columns: ['valeur'] },
      };
    case 'wordCloudChart':
      return {
        series: [{
          type: 'wordCloud',
          data: [
            { name: 'Analytics', value: 100 }, { name: 'Dashboard', value: 85 },
            { name: 'Export',    value: 70  }, { name: 'API',        value: 60 },
            { name: 'Reports',   value: 55  },
          ],
        }],
        xaxis: null,
        chartData: { data: [['Analytics', 100], ['Dashboard', 85], ['Export', 70]], columns: ['mot', 'frequence'] },
      };
    case 'radarChart':
      return {
        series: [{ name: 'Performance', type: 'radar', data: [{ value: [80, 70, 90, 85, 75], name: 'Score' }] }],
        xaxis:  { data: ['Qualité', 'Délai', 'Coût', 'Sécurité', 'Fiabilité'] },
        chartData: { data: [[80, 70, 90, 85, 75]], columns: ['qualite', 'delai', 'cout', 'securite', 'fiabilite'] },
      };
    case 'sunBurstChart':
      return {
        series: [{
          type: 'sunburst',
          data: [
            { name: 'Charges', children: [{ name: 'Salaires', value: 40 }, { name: 'Loyer', value: 20 }] },
            { name: 'Revenus', children: [{ name: 'Ventes', value: 70 }, { name: 'Services', value: 30 }] },
          ],
        }],
        xaxis: null,
        chartData: { data: [['Salaires', 40], ['Loyer', 20], ['Ventes', 70], ['Services', 30]], columns: ['categorie', 'valeur'] },
      };
    case 'funnelChart':
      return {
        series: [{
          name: 'Entonnoir', type: 'funnel',
          data: [{ name: 'Visiteurs', value: 100 }, { name: 'Leads', value: 60 }, { name: 'Opportunités', value: 35 }, { name: 'Clients', value: 20 }],
        }],
        xaxis: null,
        chartData: { data: [[100], [60], [35], [20]], columns: ['valeur'] },
      };
    case 'heatmapChart':
      return {
        series: [
          { name: 'Lun', type: 'heatmap', data: [0, 10, 20, 30, 40] },
          { name: 'Mar', type: 'heatmap', data: [5, 15, 25, 35, 45] },
          { name: 'Mer', type: 'heatmap', data: [8, 18, 28, 38, 48] },
        ],
        xaxis:  { data: ['8h', '10h', '12h', '14h', '16h'] },
        chartData: { data: [[0, 10, 20], [5, 15, 25], [8, 18, 28]], columns: ['lun', 'mar', 'mer'] },
      };
    case 'treeMapChart':
      return {
        series: [{
          type: 'treemap',
          data: [
            { name: 'Production A', value: 500 }, { name: 'Production B', value: 300 },
            { name: 'Production C', value: 200 }, { name: 'Production D', value: 150 },
          ],
        }],
        xaxis: null,
        chartData: { data: [['Production A', 500], ['Production B', 300]], columns: ['site', 'volume'] },
      };
    case 'boxplotChart':
      return {
        series: [{ name: 'Distribution', type: 'boxplot', data: [[2, 5, 8, 12, 18], [3, 6, 9, 14, 20]] }],
        xaxis:  { data: ['Ligne 1', 'Ligne 2'] },
        chartData: { data: [[2, 5, 8, 12, 18], [3, 6, 9, 14, 20]], columns: ['min', 'q1', 'median', 'q3', 'max'] },
      };
    case 'parallelChart':
      return {
        series: [{ type: 'parallel', data: [[1, 55, 9, 56], [2, 25, 11, 21], [3, 56, 7, 63]] }],
        xaxis:  null,
        chartData: { data: [[1, 55, 9, 56], [2, 25, 11, 21]], columns: ['dim1', 'dim2', 'dim3', 'dim4'] },
      };
    case 'pictorialBarChart':
      return {
        series: [{ name: 'Production', type: 'pictorialBar', symbol: 'circle', data: [120, 200, 150] }],
        xaxis:  { data: ['Matin', 'Après-midi', 'Nuit'] },
        chartData: { data: [[120], [200], [150]], columns: ['production'] },
      };
    case 'bigNumber':
      return {
        series: [],
        xaxis:  null,
        chartData: { data: [[42.5]], columns: ['valeur'] },
      };
    default:
      return {
        series: [{ name: 'Valeur', type: 'bar', data: [10, 20, 30] }],
        xaxis:  { data: ['A', 'B', 'C'] },
        chartData: { data: [[10], [20], [30]], columns: ['valeur'] },
      };
  }
}

function buildChartState(chart: DashboardChart, chartId: string): object {
  const { series, xaxis, chartData } = buildSeriesForType(chart.type);
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
      series,
      xaxis,
    },
    chartData,
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

  // ── Resource permission (dashboard) ──────────────────────────────────────
  await page.route(`**/api/passport/authz/resourcePermission/${s.dashboardId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ permission: 'WRITE', hasPermission: true }),
    })
  );

  // ── Dashboard auto-save version ───────────────────────────────────────────
  await page.route(`**/kepler/dashboards/createVersion/${s.dashboardId}/**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: `version-${s.dashboardId}`, dashboardId: s.dashboardId }),
    })
  );

  // ── Datasets for tab (required before chart elements render) ──────────────
  await page.route(`**/kepler/tabs/getDatasets/${tabId}**`, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([{
        id: s.sourceId,
        name: `Scénario ${industry.label}`,
        type: 'FILE',
        status: 'ACTIVE',
        subType: '',
      }]),
    })
  );

  // ── Tab elements (chart grid) ─────────────────────────────────────────────
  const prefix = s.dashboardId.slice(0, 8);
  const tabElements = industry.mockDashboardCharts.map((chart, i) => ({
    id:        `elem-${i + 1}-${prefix}`,
    type:      'chart',
    chartId:   `chart-${i + 1}-${prefix}`,
    position:  buildPosition((i % 2) * 6, Math.floor(i / 2) * 4),
    data:      `chart-${i + 1}-${prefix}`,
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
    let chartIds: string[] | undefined;

    // Cas 1 : POST avec body JSON  { chartIds: ['chart-1-xxx', ...] }
    let postBody: { chartIds?: string[] } | null = null;
    try { postBody = route.request().postDataJSON() as { chartIds?: string[] } | null; } catch { /* not JSON */ }
    if (postBody?.chartIds?.length) {
      chartIds = postBody.chartIds;
    } else {
      // Cas 2 : GET (ou POST form-data) avec query param ?chartIds=chart-1-xxx,chart-2-xxx
      try {
        const url = new URL(route.request().url());
        const param = url.searchParams.get('chartIds');
        if (param) chartIds = param.split(',').map((s) => s.trim()).filter(Boolean);
      } catch {
        // URL invalide — on laisse chartIds indéfini
      }
    }

    const chartId = chartIds?.[0];
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
