/**
 * F-PORTAL-04 — Builds
 *
 * Tests the Builds list page (/portal/builds) and the Build Detail page
 * (/portal/builds/:id). Uses mock API interception to avoid depending on
 * real build history data.
 */

import { test, expect } from '../../helpers/auth';

// Minimal build object returned by /api/builds (adapt to the real shape if needed).
const MOCK_BUILDS = [
  {
    id: 'build-e2e-001',
    name: 'e2e-test-build-1',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
    finishedAt: new Date(Date.now() - 3_500_000).toISOString(),
    duration: 100,
  },
  {
    id: 'build-e2e-002',
    name: 'e2e-test-build-2',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 7_200_000).toISOString(),
    finishedAt: new Date(Date.now() - 7_100_000).toISOString(),
    duration: 100,
  },
];

test.describe('F-PORTAL-04 — Builds', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the builds list API so tests are independent of real data.
    await page.route('**/api/builds**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: MOCK_BUILDS, totalElements: MOCK_BUILDS.length }),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should load the builds list at /portal/builds', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/builds');
    await expect(page).toHaveURL(/\/portal\/builds/);
    // The page should not show the login form.
    await expect(page.getByPlaceholder(/password/i)).not.toBeVisible();
  });

  test('should display mocked build entries', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/builds');
    // With mocked data, at least one of our build names should appear.
    await expect(
      page.getByText(/e2e-test-build/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to build detail when clicking a build row', async ({ authenticatedPage: page }) => {
    // Also intercept the detail call.
    await page.route('**/api/builds/build-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUILDS[0]),
      })
    );

    await page.goto('/portal/builds');
    // Click the first build entry.
    await page.getByText(/e2e-test-build-1/i).first().click();
    await page.waitForURL('**/portal/builds/**', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/portal\/builds\//);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show an empty state when there are no builds', async ({ authenticatedPage: page }) => {
    // Override the beforeEach mock with an empty response.
    await page.route('**/api/builds**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      })
    );

    await page.goto('/portal/builds');
    // Expect some "no data" or "empty" indicator from the component.
    await expect(
      page.getByText(/no build|no data|aucun/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should load /portal/builds/:id directly', async ({ authenticatedPage: page }) => {
    await page.route('**/api/builds/build-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUILDS[0]),
      })
    );

    await page.goto('/portal/builds/build-e2e-001');
    await expect(page).toHaveURL(/\/portal\/builds\/build-e2e-001/);
  });
});
