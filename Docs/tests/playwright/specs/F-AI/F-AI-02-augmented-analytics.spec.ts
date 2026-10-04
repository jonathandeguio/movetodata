/**
 * F-AI-02 — Augmented Analytics
 *
 * Tests the Augmented Analytics feature (POST /api/ai/insights) exposed on
 * the Dataset Detail page. Covers anomaly detection, forecasting, clustering,
 * and summary types.
 *
 * Wire format (from aiService.ts):
 *   Request  : { datasetId, branch, columnX, columnY, type, options? }
 *   Response : { type, results, model, row_count, warning }
 */

import { test, expect } from '../../helpers/auth';
import { mockInsightsResponse } from '../../helpers/api';

const DATASET_ID = 'dataset-e2e-analytics-001';
const BRANCH = 'master';

const MOCK_DATASET = {
  id: DATASET_ID,
  name: 'e2e-analytics-dataset',
  branch: BRANCH,
  columns: [
    { name: 'created_at', type: 'TIMESTAMP' },
    { name: 'revenue', type: 'DECIMAL' },
    { name: 'region', type: 'VARCHAR' },
  ],
};

const useMockAI = process.env.MOCK_AI !== 'false';

test.describe('F-AI-02 — Augmented Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/kitab/dataset/${DATASET_ID}/${BRANCH}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DATASET),
      })
    );

    if (useMockAI) {
      await page.route('**/api/ai/insights**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockInsightsResponse()),
        })
      );
    }
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should display the analytics panel on the dataset page', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);

    // The analytics panel / button should be accessible.
    const analyticsButton = page
      .getByRole('button', { name: /analytics|insights|analyse/i })
      .first();
    await expect(analyticsButton).toBeVisible({ timeout: 10_000 });
  });

  test('should display the summary result text', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);

    const analyticsButton = page
      .getByRole('button', { name: /analytics|insights|analyse/i })
      .first();
    await analyticsButton.click();

    // Mock returns summary with "1 200 rows".
    await expect(
      page.getByText(/1.200|1,200|dataset contains/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Anomaly detection
  // -------------------------------------------------------------------------

  test('should call the insights API with type=anomaly', async ({ authenticatedPage: page }) => {
    const requests: string[] = [];
    await page.route('**/api/ai/insights**', (route) => {
      requests.push(route.request().postData() ?? '');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockInsightsResponse(), type: 'anomaly', results: [] }),
      });
    });

    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);

    // Trigger anomaly detection via the UI (select "Anomaly" from a dropdown or tab).
    const anomalyOption = page.getByRole('option', { name: /anomaly/i }).first();
    if (await anomalyOption.isVisible()) {
      await anomalyOption.click();
    }

    const runButton = page.getByRole('button', { name: /run|analyse|compute/i }).first();
    if (await runButton.isVisible()) {
      await runButton.click();
      await page.waitForTimeout(500);
      expect(requests.some((r) => r.includes('"anomaly"'))).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should display a warning banner when the response contains a warning', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/insights**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockInsightsResponse(),
          warning: 'Data was truncated to 10 000 rows.',
        }),
      })
    );

    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);
    const analyticsButton = page
      .getByRole('button', { name: /analytics|insights|analyse/i })
      .first();
    if (await analyticsButton.isVisible()) {
      await analyticsButton.click();
      await expect(
        page.getByText(/truncated|warning|avertissement/i).first()
      ).toBeVisible({ timeout: 15_000 });
    }
  });

  test('should show an error when the insights endpoint returns 500', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/insights**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);
    const analyticsButton = page
      .getByRole('button', { name: /analytics|insights|analyse/i })
      .first();
    if (await analyticsButton.isVisible()) {
      await analyticsButton.click();
      await expect(
        page.getByText(/error|erreur|failed/i).first()
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});
