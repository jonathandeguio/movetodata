/**
 * global-setup.ts — Playwright "setup" project.
 *
 * Authenticates once via POST /passport/login, then saves the resulting
 * browser storage state (cookies + localStorage) to .auth/user.json so every
 * spec can start already authenticated without re-logging in.
 *
 * Triggered automatically by the "setup" project in playwright.config.ts.
 */

import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STORAGE_STATE = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page, request }) => {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:8081';
  const username = process.env.TEST_USER ?? 'admin';
  const password = process.env.TEST_PASSWORD ?? '';

  if (!password) {
    throw new Error(
      'TEST_PASSWORD environment variable is required. ' +
        'Copy .env.test.example to .env.test and set the value.'
    );
  }

  // Ensure .auth/ directory exists before writing storageState.
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  // --- 1. POST /passport/login to obtain the bAT cookie ---
  const loginResponse = await request.post(`${baseURL}/passport/login`, {
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(loginResponse.status(), 'Login API should return 200').toBe(200);

  // --- 2. Navigate to the app so cookies are applied to the browser context ---
  await page.goto(`${baseURL}/auth/login`);

  // The cookie is set by the API call above; Playwright shares the context
  // between request and page within the same test, so we just need to verify
  // the app recognises the session.
  await page.waitForTimeout(500);

  // If the API call didn't set the cookie on the page context, fall back to
  // filling the login form in the browser.
  const cookies = await page.context().cookies();
  const hasAuthCookie = cookies.some((c) => c.name === 'bAT');

  if (!hasAuthCookie) {
    await page.goto(`${baseURL}/auth/login`);
    await page.getByPlaceholder(/username|user name/i).fill(username);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL('**/portal/home', { timeout: 30_000 });
  }

  // --- 3. Persist the authenticated state ---
  await page.context().storageState({ path: STORAGE_STATE });
});
