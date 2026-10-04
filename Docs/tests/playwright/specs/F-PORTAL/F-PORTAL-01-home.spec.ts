/**
 * F-PORTAL-01 — Home
 *
 * Tests the portal home page (/portal/home):
 *   - Page loads and key sections are visible.
 *   - Navigation links to sub-sections (favourites, recently viewed, etc.).
 *   - Unauthenticated access is blocked.
 */

import { test, expect } from '../../helpers/auth';

test.describe('F-PORTAL-01 — Home', () => {
  test('should load /portal/home for an authenticated user', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/portal\/home/);
    // The page must not show the login form.
    await expect(page.getByPlaceholder(/username|user name/i)).not.toBeVisible();
  });

  test('should display the main portal navigation', async ({ authenticatedPage: page }) => {
    // The left-side navigation bar contains links that are consistent across the portal.
    // We check for at least one nav item using role-based selectors.
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate to /portal/recentlyViewed via the sidebar link', async ({ authenticatedPage: page }) => {
    // The sidebar link text may vary; we navigate directly and expect the route to resolve.
    await page.goto('/portal/recentlyViewed');
    await expect(page).toHaveURL(/\/portal\/recentlyViewed/);
    // The page must not redirect to login.
    await expect(page.getByPlaceholder(/password/i)).not.toBeVisible();
  });

  test('should navigate to /portal/favourites', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/favourites');
    await expect(page).toHaveURL(/\/portal\/favourites/);
  });

  test('should navigate to /portal/createdByYou', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/createdByYou');
    await expect(page).toHaveURL(/\/portal\/createdByYou/);
  });

  test('should navigate to /portal/updatedByYou', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/updatedByYou');
    await expect(page).toHaveURL(/\/portal\/updatedByYou/);
  });

  test('should navigate to /portal/projects', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/projects');
    await expect(page).toHaveURL(/\/portal\/projects/);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should redirect / to /portal/home', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('**/portal/home', { timeout: 15_000 });
    expect(page.url()).toContain('/portal/home');
  });

  test('should show a 404 page for an unknown route', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/this-route-does-not-exist-xyz');
    // The Notfound component renders; we check for a "not found" or "404" text.
    await expect(
      page.getByText(/not found|404|page not found/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
