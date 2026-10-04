import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * playwright.config.ts — MoveToData E2E test configuration.
 *
 * Usage:
 *   cd Docs/tests/playwright
 *   BASE_URL=http://localhost:8081 npx playwright test
 *
 * Environment variables (copy .env.test.example → .env.test and set values):
 *   BASE_URL          Frontend URL (default: http://localhost:8081)
 *   TEST_USER         Login username (default: admin)
 *   TEST_PASSWORD     Login password (required, no default)
 *   MOCK_AI           If "true", AI endpoints are intercepted via page.route()
 */

export const STORAGE_STATE = path.join(__dirname, '.auth/user.json');

export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  fullyParallel: false,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8081',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    /**
     * Setup project — runs first, calls /passport/login and stores the
     * auth cookie in .auth/user.json so all spec projects can reuse it.
     */
    {
      name: 'setup',
      testMatch: '**/helpers/global-setup.ts',
    },

    /**
     * All other specs run with the stored auth state.
     */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
