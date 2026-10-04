/**
 * auth.ts — Authentication helpers and custom test fixture.
 *
 * Exports:
 *   - loginViaUI()        : fills the login form in a browser page
 *   - loginViaAPI()       : posts to /passport/login (faster, for setup only)
 *   - test                : extended test with `authenticatedPage` fixture
 *   - expect              : re-exported from @playwright/test
 *
 * Most specs should just import { test, expect } from '../helpers/auth' so
 * they get an already-authenticated page thanks to the storageState set by
 * global-setup.ts. The `authenticatedPage` fixture is available when a spec
 * needs explicit control over the post-login navigation.
 */

import {
  test as base,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';

export { expect };

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Authenticates by filling the login form in the browser.
 * Use this only when the storage state cannot be reused (e.g. testing the
 * login page itself).
 */
export async function loginViaUI(
  page: Page,
  username = process.env.TEST_USER ?? 'admin',
  password = process.env.TEST_PASSWORD ?? ''
): Promise<void> {
  await page.goto('/auth/login');
  // The login form uses Ant Design — inputs are rendered as plain <input>
  // elements accessible by their placeholder text.
  await page.getByPlaceholder(/username|user name/i).fill(username);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL('**/portal/home', { timeout: 30_000 });
}

/**
 * Authenticates programmatically via the REST API.
 * Returns the raw response (caller must assert status).
 */
export async function loginViaAPI(
  request: APIRequestContext,
  username = process.env.TEST_USER ?? 'admin',
  password = process.env.TEST_PASSWORD ?? ''
) {
  return request.post('/passport/login', {
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Custom fixture
// ---------------------------------------------------------------------------

type AuthFixtures = {
  /** A Page that has already navigated to /portal/home after authentication. */
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // The storage state loaded from .auth/user.json (configured in
    // playwright.config.ts) already contains the bAT cookie, so we only
    // need to navigate to the portal.
    await page.goto('/portal/home');
    await page.waitForURL('**/portal/home', { timeout: 30_000 });
    await use(page);
  },
});
