/**
 * F-PORTAL-05 — Schedules
 *
 * Tests the Schedules list page (/portal/schedules) and the Schedule Detail
 * page (/portal/schedules/:id). API calls are intercepted to ensure
 * test isolation.
 */

import { test, expect } from '../../helpers/auth';

const MOCK_SCHEDULES = [
  {
    id: 'sched-e2e-001',
    name: 'e2e-daily-refresh',
    cron: '0 6 * * *',
    enabled: true,
    lastRunAt: new Date(Date.now() - 86_400_000).toISOString(),
    nextRunAt: new Date(Date.now() + 3_600_000).toISOString(),
  },
  {
    id: 'sched-e2e-002',
    name: 'e2e-weekly-export',
    cron: '0 3 * * 1',
    enabled: false,
    lastRunAt: null,
    nextRunAt: null,
  },
];

test.describe('F-PORTAL-05 — Schedules', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/schedules**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: MOCK_SCHEDULES, totalElements: MOCK_SCHEDULES.length }),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should load the schedules list at /portal/schedules', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules');
    await expect(page).toHaveURL(/\/portal\/schedules/);
    await expect(page.getByPlaceholder(/password/i)).not.toBeVisible();
  });

  test('should display mocked schedule entries', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules');
    await expect(
      page.getByText(/e2e-daily-refresh/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to schedule detail', async ({ authenticatedPage: page }) => {
    await page.route('**/api/schedules/sched-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SCHEDULES[0]),
      })
    );

    await page.goto('/portal/schedules');
    await page.getByText(/e2e-daily-refresh/i).first().click();
    await page.waitForURL('**/portal/schedules/**', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/portal\/schedules\//);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show an empty state when there are no schedules', async ({ authenticatedPage: page }) => {
    await page.route('**/api/schedules**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      })
    );

    await page.goto('/portal/schedules');
    await expect(
      page.getByText(/no schedule|no data|aucun/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should load /portal/schedules/:id directly', async ({ authenticatedPage: page }) => {
    await page.route('**/api/schedules/sched-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SCHEDULES[0]),
      })
    );

    await page.goto('/portal/schedules/sched-e2e-001');
    await expect(page).toHaveURL(/\/portal\/schedules\/sched-e2e-001/);
  });
});
