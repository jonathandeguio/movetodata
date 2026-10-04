/**
 * F-KEPLER-01 — Kepler Chart & Dashboard
 *
 * Tests the Kepler visualisation pages:
 *   /portal/kepler/CHART/:id    — single chart view
 *   /portal/kepler/DASHBOARD/:id — dashboard view
 *
 * API calls are mocked to avoid depending on real Kepler artefacts.
 */

import { test, expect } from '../../helpers/auth';

const CHART_ID = 'chart-e2e-001';
const DASHBOARD_ID = 'dash-e2e-001';

const MOCK_CHART = {
  id: CHART_ID,
  title: 'e2e Sales Chart',
  type: 'line',
  datasetId: 'dataset-e2e-001',
  branch: 'master',
  config: {},
};

const MOCK_DASHBOARD = {
  id: DASHBOARD_ID,
  title: 'e2e Analytics Dashboard',
  charts: [MOCK_CHART],
  tabs: [],
};

test.describe('F-KEPLER-01 — Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/kepler/chart/${CHART_ID}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHART),
      })
    );

    await page.route(`**/api/kepler/dashboard/${DASHBOARD_ID}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Chart — happy path
  // -------------------------------------------------------------------------

  test('should load the chart page at /portal/kepler/CHART/:id', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kepler/CHART/${CHART_ID}`);
    await expect(page).toHaveURL(new RegExp(`/portal/kepler/CHART/${CHART_ID}`));
    await expect(page.getByPlaceholder(/password/i)).not.toBeVisible();
  });

  test('should display the chart title', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kepler/CHART/${CHART_ID}`);
    await expect(
      page.getByText(/e2e sales chart/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Dashboard — happy path
  // -------------------------------------------------------------------------

  test('should load the dashboard page at /portal/kepler/DASHBOARD/:id', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kepler/DASHBOARD/${DASHBOARD_ID}`);
    await expect(page).toHaveURL(new RegExp(`/portal/kepler/DASHBOARD/${DASHBOARD_ID}`));
  });

  test('should display the dashboard title', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kepler/DASHBOARD/${DASHBOARD_ID}`);
    await expect(
      page.getByText(/e2e analytics dashboard/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should handle a 404 response for a non-existent chart', async ({ authenticatedPage: page }) => {
    const unknownId = 'chart-does-not-exist';
    await page.route(`**/api/kepler/chart/${unknownId}**`, (route) =>
      route.fulfill({ status: 404, body: 'Not Found' })
    );

    await page.goto(`/portal/kepler/CHART/${unknownId}`);
    await expect(
      page.getByText(/not found|error|introuvable/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
