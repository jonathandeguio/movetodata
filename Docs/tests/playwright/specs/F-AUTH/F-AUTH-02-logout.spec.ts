/**
 * F-AUTH-02 — Logout
 *
 * Tests that a logged-in user can log out and is redirected to the login page,
 * and that protected routes are no longer accessible after logout.
 *
 * IMPORTANT: Each test in this spec does its own fresh login so it does NOT
 * share the session stored in .auth/user.json. This prevents invalidating the
 * shared Redis session that all other specs depend on.
 */

import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth';

// Start every test with a clean, unauthenticated context.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('F-AUTH-02 — Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Each logout test needs its own fresh authenticated session.
    await loginViaUI(page);
    await expect(page).toHaveURL(/\/portal\/home/);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should redirect to /auth/login after navigating to /auth/logout', async ({ page }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should clear the bAT cookie after logout', async ({ page, context }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'bAT');
    expect(
      authCookie === undefined || (authCookie.expires !== -1 && authCookie.expires < Date.now() / 1000),
      'bAT cookie should be cleared after logout'
    ).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Post-logout access control
  // -------------------------------------------------------------------------

  test('should redirect to /auth/login when accessing /portal/home after logout', async ({ page }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });

    await page.goto('/portal/home');
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should show the login form after logout', async ({ page }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });

    await expect(page.getByPlaceholder(/username|user name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });
});
