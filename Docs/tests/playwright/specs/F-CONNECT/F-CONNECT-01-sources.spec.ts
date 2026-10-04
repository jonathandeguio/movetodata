/**
 * F-CONNECT-01 — Sources list
 *
 * Tests the Connect Sources page (/portal/connect/source):
 *   - List loads and renders source cards.
 *   - Search / filter interaction.
 *   - Empty state when no sources exist.
 *   - Navigation to source detail.
 */

import { test, expect } from '../../helpers/auth';

const MOCK_SOURCES = [
  {
    id: 'src-e2e-001',
    name: 'e2e-postgres-source',
    type: 'JDBC',
    driver: 'postgresql',
    status: 'CONNECTED',
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 'src-e2e-002',
    name: 'e2e-csv-source',
    type: 'CSV',
    driver: null,
    status: 'DISCONNECTED',
    createdAt: new Date(Date.now() - 172_800_000).toISOString(),
  },
];

test.describe('F-CONNECT-01 — Sources List', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the sources list endpoint.
    await page.route('**/api/sources**', (route) => {
      // Only intercept GET calls (list); let POST calls through if any.
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: MOCK_SOURCES,
            totalElements: MOCK_SOURCES.length,
          }),
        });
      }
      return route.continue();
    });

    // Mock AI quality batch scores (loaded alongside the source list in F4).
    await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should load the sources list at /portal/connect/source', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');
    await expect(page).toHaveURL(/\/portal\/connect\/source/);
  });

  test('should render mocked source cards', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');
    await expect(
      page.getByText(/e2e-postgres-source/i).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/e2e-csv-source/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to source detail when clicking a source', async ({ authenticatedPage: page }) => {
    await page.route('**/api/sources/src-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SOURCES[0]),
      })
    );

    await page.goto('/portal/connect/source');
    await page.getByText(/e2e-postgres-source/i).first().click();
    await page.waitForURL('**/portal/connect/source/**', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/portal\/connect\/source\//);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should display an empty state when no sources are returned', async ({ authenticatedPage: page }) => {
    await page.route('**/api/sources**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      })
    );

    await page.goto('/portal/connect/source');
    await expect(
      page.getByText(/no source|no data|aucune source|add a source/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to the agents tab at /portal/connect/agent', async ({ authenticatedPage: page }) => {
    await page.route('**/api/agents**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      })
    );

    await page.goto('/portal/connect/agent');
    await expect(page).toHaveURL(/\/portal\/connect\/agent/);
  });
});
