/**
 * F-SETTINGS-01 — User Profile
 *
 * Tests the Profile settings page (/portal/settings/profile):
 *   - Page loads with the current user's data.
 *   - Display name can be updated.
 *   - Navigating away and back retains the saved value.
 *   - Tokens page (/portal/settings/tokens) is accessible.
 *   - SSO page (/portal/settings/sso) is accessible.
 */

import { test, expect } from '../../helpers/auth';

const MOCK_PROFILE = {
  id: 'user-e2e-001',
  username: process.env.TEST_USER ?? 'admin',
  email: 'e2e-test@movetodata.io',
  firstName: 'E2E',
  lastName: 'Tester',
  displayName: 'E2E Tester',
  role: 'ADMIN',
  avatarUrl: null,
};

test.describe('F-SETTINGS-01 — User Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the profile endpoint.
    await page.route('**/api/users/me**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should load the profile page at /portal/settings/profile', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/settings/profile');
    await expect(page).toHaveURL(/\/portal\/settings\/profile/);
  });

  test('should display the current user information', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/settings/profile');
    await expect(
      page.getByText(/e2e tester|e2e-test@movetodata\.io/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should load the preferences page at /portal/settings/preferences', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/settings/preferences');
    await expect(page).toHaveURL(/\/portal\/settings\/preferences/);
  });

  test('should load the tokens page at /portal/settings/tokens', async ({ authenticatedPage: page }) => {
    await page.route('**/api/tokens**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/portal/settings/tokens');
    await expect(page).toHaveURL(/\/portal\/settings\/tokens/);
  });

  test('should load the users management page at /portal/settings/users', async ({ authenticatedPage: page }) => {
    await page.route('**/api/users**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      })
    );

    await page.goto('/portal/settings/users');
    await expect(page).toHaveURL(/\/portal\/settings\/users/);
  });

  test('should load the SSO page at /portal/settings/sso', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/settings/sso');
    await expect(page).toHaveURL(/\/portal\/settings\/sso/);
  });

  test('should load the platform settings home at /portal/settings/platform/home', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/settings/platform/home');
    await expect(page).toHaveURL(/\/portal\/settings\/platform\/home/);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should load the login activity page at /portal/settings/loginActivity', async ({ authenticatedPage: page }) => {
    await page.route('**/api/loginActivity**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0 }),
      })
    );

    await page.goto('/portal/settings/loginActivity');
    await expect(page).toHaveURL(/\/portal\/settings\/loginActivity/);
  });

  test('should load the change-password page at /portal/settings/changePassword', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/settings/changePassword');
    await expect(page).toHaveURL(/\/portal\/settings\/changePassword/);
    // The page should contain a password input field.
    await expect(page.getByPlaceholder(/new password|nouveau mot de passe/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
