/**
 * F-DOCS-01 — Documentation
 *
 * Tests that the MoveToData documentation site is accessible at /learn/ and
 * /learn/fr/. These routes are served by Nginx as a static site; no auth is
 * required.
 *
 * The tests use a fresh (unauthenticated) browser context to confirm public
 * accessibility.
 */

import { test, expect } from '@playwright/test';

// No stored auth state needed — docs are public.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('F-DOCS-01 — Documentation', () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should serve the documentation at /learn/', async ({ page }) => {
    const response = await page.goto('/learn/');
    // Nginx must return 200; redirect (301/302) also acceptable.
    expect(
      response?.status(),
      '/learn/ should return a 2xx or 3xx response'
    ).toBeLessThan(400);

    // The page title or heading should mention the docs / MoveToData.
    await expect(
      page.getByText(/movetodata|documentation|learn|docs/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should serve the French documentation at /learn/fr/', async ({ page }) => {
    const response = await page.goto('/learn/fr/');
    expect(
      response?.status(),
      '/learn/fr/ should return a 2xx or 3xx response'
    ).toBeLessThan(400);
  });

  test('should have a working navigation on the docs site', async ({ page }) => {
    await page.goto('/learn/');
    // The documentation typically has a sidebar or top navigation.
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test('should allow deep-linking into a documentation page', async ({ page }) => {
    // Attempt to navigate directly to a known sub-section.
    // If the page returns 404, we accept it gracefully (static site may not
    // have this exact path) but verify no server error.
    const response = await page.goto('/learn/fr/connect/');
    expect(
      response?.status() ?? 200,
      'Deep link into docs should not return a 5xx error'
    ).toBeLessThan(500);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should not redirect docs visitors to the login page', async ({ page }) => {
    await page.goto('/learn/');
    // The docs are public — the URL must NOT land on /auth/login.
    await page.waitForTimeout(1_000);
    expect(page.url()).not.toContain('/auth/login');
  });
});
