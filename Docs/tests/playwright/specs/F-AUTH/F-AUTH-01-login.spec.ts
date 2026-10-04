/**
 * F-AUTH-01 — Login
 *
 * Tests the /auth/login page: happy path, wrong credentials, empty submission,
 * and post-login redirect.
 *
 * This spec does NOT use the stored auth state — it tests the login flow itself,
 * so it uses a fresh browser context (no storageState dependency).
 */

import { test, expect } from '@playwright/test';

// Override the project storageState for this spec so we start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

const USER = process.env.TEST_USER ?? 'admin';
const PASS = process.env.TEST_PASSWORD ?? '';

test.describe('F-AUTH-01 — Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    // Wait for the login form to be visible.
    await expect(page.getByPlaceholder(/username|user name/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should redirect to /portal/home after successful login', async ({ page }) => {
    await page.getByPlaceholder(/username|user name/i).fill(USER);
    await page.getByPlaceholder(/password/i).fill(PASS);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await page.waitForURL('**/portal/home', { timeout: 30_000 });
    expect(page.url()).toContain('/portal/home');
  });

  test('should set the bAT cookie after successful login', async ({ page, context }) => {
    await page.getByPlaceholder(/username|user name/i).fill(USER);
    await page.getByPlaceholder(/password/i).fill(PASS);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await page.waitForURL('**/portal/home', { timeout: 30_000 });

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'bAT');
    expect(authCookie, 'bAT cookie should be set after login').toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Error cases
  // -------------------------------------------------------------------------

  test('should show an error notification for wrong credentials', async ({ page }) => {
    await page.getByPlaceholder(/username|user name/i).fill(USER);
    await page.getByPlaceholder(/password/i).fill('definitely-wrong-password-xyz');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Ant Design notification appears with "Login Error" or similar text.
    await expect(
      page.getByText(/login error|wrong username|invalid/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Must stay on the login page.
    expect(page.url()).toContain('/auth/login');
  });

  test('should show validation message when username is empty', async ({ page }) => {
    // Leave username empty, fill password.
    await page.getByPlaceholder(/password/i).fill(PASS);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Ant Design Form validation message.
    await expect(
      page.getByText(/please input your username|username is required/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('should show validation message when password is empty', async ({ page }) => {
    await page.getByPlaceholder(/username|user name/i).fill(USER);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await expect(
      page.getByText(/please input your password|password is required/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Already authenticated redirect
  // -------------------------------------------------------------------------

  test('should redirect already-authenticated user away from login page', async ({ page, context }) => {
    // Authenticate first, then try to visit /auth/login again.
    await page.getByPlaceholder(/username|user name/i).fill(USER);
    await page.getByPlaceholder(/password/i).fill(PASS);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL('**/portal/home', { timeout: 30_000 });

    // Navigate to /auth/login — should be redirected to /portal/home.
    await page.goto('/auth/login');
    await page.waitForURL('**/portal/home', { timeout: 15_000 });
    expect(page.url()).toContain('/portal/home');
  });
});
