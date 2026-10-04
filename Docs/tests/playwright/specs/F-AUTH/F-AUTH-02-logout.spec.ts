/**
 * F-AUTH-02 — Logout
 *
 * Tests that a logged-in user can log out and is redirected to the login page,
 * and that protected routes are no longer accessible after logout.
 *
 * Uses the stored auth state from global-setup.ts.
 */

import { test, expect } from '../../helpers/auth';

test.describe('F-AUTH-02 — Logout', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Verify we start authenticated on the portal.
    await expect(page).toHaveURL(/\/portal\/home/);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should redirect to /auth/login after navigating to /auth/logout', async ({ authenticatedPage: page }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should clear the bAT cookie after logout', async ({ authenticatedPage: page, context }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'bAT');
    // After logout the cookie should be absent or expired.
    expect(
      authCookie === undefined || (authCookie.expires !== -1 && authCookie.expires < Date.now() / 1000),
      'bAT cookie should be cleared after logout'
    ).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Post-logout access control
  // -------------------------------------------------------------------------

  test('should redirect to /auth/login when accessing /portal/home after logout', async ({ authenticatedPage: page }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });

    // Try to access a protected route without being authenticated.
    await page.goto('/portal/home');
    // The PrivateOutlet should redirect unauthenticated users to the login page.
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should show the login form after logout', async ({ authenticatedPage: page }) => {
    await page.goto('/auth/logout');
    await page.waitForURL('**/auth/login', { timeout: 15_000 });

    await expect(page.getByPlaceholder(/username|user name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });
});
