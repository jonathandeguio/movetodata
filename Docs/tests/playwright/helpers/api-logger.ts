/**
 * api-logger.ts — Catch-all network logger for Playwright specs.
 *
 * Call attachApiLogger(page) at the END of setupFallbackRoutes(), after all
 * specific page.route() mocks. It intercepts every API request that wasn't
 * caught by a mock and logs it so you can see exactly what needs to be mocked.
 *
 * Usage:
 *   import { attachApiLogger } from '../helpers/api-logger';
 *   // inside setupFallbackRoutes, after all page.route() calls:
 *   attachApiLogger(page);
 */

import type { Page } from '@playwright/test';

const API_PATTERN = /\/(connect|kitab|kepler|passport|platform|api)\//;

export function attachApiLogger(page: Page): void {
  page.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (API_PATTERN.test(url)) {
      console.log(`[UNMOCKED] ${req.method()} ${url}`);
    }
    route.continue();
  });
}
