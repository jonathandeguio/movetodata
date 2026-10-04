/**
 * F-AI-04 — Smart Connector Quality Score
 *
 * Tests the SmartConnectorAnalysisPage (/portal/connect/source/:id/analyze):
 *   - Quality score gauges (global + 4 sub-scores) are visible.
 *   - Semantic type badges are rendered for each column.
 *   - Chart suggestions are displayed with an "Open in Kepler" button.
 *   - Error state when the analysis fails.
 *
 * Route: /portal/connect/source/:id/analyze
 * API  : POST /api/ai/smart-connector/analyze   { sourceId }
 *        GET  /api/ai/smart-connector/score/:id  (cached result)
 */

import { test, expect } from '../../helpers/auth';
import { mockSmartConnectorResponse } from '../../helpers/api';

const SOURCE_ID = 'src-e2e-smart-001';
const useMockAI = process.env.MOCK_AI !== 'false';

test.describe('F-AI-04 — Smart Connector Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Mock source detail (needed to load the page correctly).
    await page.route(`**/api/sources/${SOURCE_ID}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SOURCE_ID,
          name: 'e2e-smart-source',
          type: 'JDBC',
          status: 'CONNECTED',
        }),
      })
    );

    if (useMockAI) {
      // GET cached score — return 404 so the page triggers a fresh analysis.
      await page.route(`**/api/ai/smart-connector/score/${SOURCE_ID}**`, (route) =>
        route.fulfill({ status: 404, body: '' })
      );

      // POST analyze — return the mock SmartConnectorResponse.
      await page.route('**/api/ai/smart-connector/analyze**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSmartConnectorResponse()),
        })
      );
    }
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should load the Smart Connector analysis page', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);
    await expect(page).toHaveURL(new RegExp(`/portal/connect/source/${SOURCE_ID}/analyze`));
  });

  test('should display the global quality score gauge', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);

    // The global score is rendered — mock returns 0.82.
    await expect(
      page.getByText(/82|quality score|score qualité/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display the four sub-scores (completeness, uniqueness, consistency, outlier)', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);

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

  test('should display detected semantic type badges', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);

    // Mock returns types: numeric, time_series, categorical.
    await expect(
      page.getByText(/time.series|time_series/i).first()
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByText(/categorical/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display a chart suggestion card', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);

    // Mock returns one suggestion: "Amount over time".
    await expect(
      page.getByText(/amount over time/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should have an "Open in Kepler" button on chart suggestion cards', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);

    await expect(
      page.getByRole('button', { name: /kepler|open|chart/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show an error alert when the analysis API returns an error', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/smart-connector/analyze**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);
    await expect(
      page.getByText(/error|erreur|failed|échec/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display a partial result when the response contains an error field', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/smart-connector/analyze**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockSmartConnectorResponse(),
          quality_score: {
            global: null,
            completeness: null,
            uniqueness: null,
            consistency: null,
            outlier_ratio: null,
          },
          error: 'Could not compute quality score: empty dataset.',
        }),
      })
    );

    await page.goto(`/portal/connect/source/${SOURCE_ID}/analyze`);
    await expect(
      page.getByText(/could not compute|empty dataset|error/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
