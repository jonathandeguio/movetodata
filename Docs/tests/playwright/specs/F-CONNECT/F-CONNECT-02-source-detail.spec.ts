/**
 * F-CONNECT-02 — Source Detail
 *
 * Tests the Source Detail page (/portal/connect/source/:id):
 *   - Displays source metadata (name, type, status).
 *   - "Analyze" button navigates to the Smart Connector analysis page.
 *   - Error handling when source is not found.
 */

import { test, expect } from '../../helpers/auth';

const SOURCE_ID = 'src-e2e-detail-001';
const MOCK_SOURCE = {
  id: SOURCE_ID,
  name: 'e2e-detail-source',
  type: 'JDBC',
  driver: 'postgresql',
  jdbcUrl: 'jdbc:postgresql://localhost:5432/testdb',
  status: 'CONNECTED',
  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe('F-CONNECT-02 — Source Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/sources/${SOURCE_ID}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SOURCE),
      })
    );

    // Mock cached quality score (may be called on detail page load).
    await page.route(`**/api/ai/smart-connector/score/${SOURCE_ID}**`, (route) =>
      route.fulfill({ status: 404, body: '' })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should display source metadata on the detail page', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}`);
    await expect(page).toHaveURL(new RegExp(`/portal/connect/source/${SOURCE_ID}`));

    await expect(
      page.getByText(/e2e-detail-source/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show a link or button to the Smart Connector analysis', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}`);

    // The page should have an "Analyze" or "Smart Connector" button.
    const analyzeButton = page.getByRole('button', { name: /analyze|smart connector/i }).first();
    await expect(analyzeButton).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to /portal/connect/source/:id/analyze when clicking Analyze', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/connect/source/${SOURCE_ID}`);

    const analyzeButton = page.getByRole('button', { name: /analyze|smart connector/i }).first();
    await analyzeButton.click();

    await page.waitForURL(`**/portal/connect/source/${SOURCE_ID}/analyze`, { timeout: 15_000 });
    expect(page.url()).toContain(`/portal/connect/source/${SOURCE_ID}/analyze`);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show an error state when the source is not found (404)', async ({ authenticatedPage: page }) => {
    const unknownId = 'src-does-not-exist-xyz';
    await page.route(`**/api/sources/${unknownId}**`, (route) =>
      route.fulfill({ status: 404, body: 'Not Found' })
    );

    await page.goto(`/portal/connect/source/${unknownId}`);
    // Expect an error message, redirect, or not-found indicator.
    await expect(
      page.getByText(/not found|error|introuvable/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
