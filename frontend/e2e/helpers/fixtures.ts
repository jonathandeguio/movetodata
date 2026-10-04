/**
 * fixtures.ts — Shared setup helpers for E2E tests.
 *
 * Functions:
 *   - createTestSource(page)  : Creates a PostgreSQL test source via the
 *                               Connect > Sources UI and returns its name.
 *   - deleteTestSourceByName  : Cleans up a source created during a test.
 *
 * All credentials are read from environment variables.
 */

import { expect, Page } from '@playwright/test';
import { loginAs } from './auth';

// ---------------------------------------------------------------------------
// Default test source config — override via environment variables
// ---------------------------------------------------------------------------

export const TEST_SOURCE = {
  name: `e2e-test-${Date.now()}`,
  host: process.env.TEST_DB_HOST ?? 'localhost',
  port: process.env.TEST_DB_PORT ?? '5432',
  database: process.env.TEST_DB_NAME ?? 'boson',
  username: process.env.TEST_DB_USER ?? 'movetodata',
  password: process.env.TEST_DB_PASSWORD ?? 'movetodata',
};

// ---------------------------------------------------------------------------
// createTestSource
// ---------------------------------------------------------------------------

/**
 * Navigates to Connect > Sources, opens the "New source" modal, fills in
 * PostgreSQL connection details and submits the form.
 *
 * Prerequisites : user must already be authenticated (call loginAs first, or
 *                 use test.beforeEach with loginAs).
 *
 * Returns the name used for the source so the caller can assert its presence.
 */
export async function createTestSource(page: Page): Promise<string> {
  const sourceName = `e2e-postgres-${Date.now()}`;

  await page.goto('/portal/connect/source');

  // Wait for the page to load — the "New" button is rendered by BoslerButton
  // with intent="action" inside ConnectSources.view.tsx.
  // getLanguageLabel("new") returns "New" in English.
  const newButton = page.getByRole('button', { name: /new/i });
  await expect(newButton).toBeVisible({ timeout: 15000 });
  await newButton.click();

  // -------------------------------------------------------------------
  // Step 1 — Select the PostgreSQL connector card
  // The SourceModal shows a grid of .Selectable-Cards.
  // The PostgreSQL card contains "postgres" text (the SVG logo label).
  // -------------------------------------------------------------------
  const postgresCard = page.locator('.Selectable-Cards').filter({
    hasText: /postgres/i,
  }).first();
  await expect(postgresCard).toBeVisible({ timeout: 10000 });
  await postgresCard.click();

  // -------------------------------------------------------------------
  // Step 2 — Fill in the source form
  // BoslerInput wraps Ant Design Input — no data-testid.
  // We target inputs by placeholder attribute (set in SourceModal.view.tsx).
  // -------------------------------------------------------------------

  // Name: first autofocus input — no placeholder in the component, use nth(0)
  // inside the modal body (identified by .ant-modal-body).
  const modalBody = page.locator('.ant-modal-body');
  await expect(modalBody).toBeVisible({ timeout: 8000 });

  // The Name row input has no placeholder; it is the first .inputComponent
  // rendered after the connector is selected.
  const nameInput = modalBody.locator('input.inputComponent').first();
  await nameInput.fill(sourceName);

  // Server (placeholder="Server")
  await modalBody.getByPlaceholder('Server').fill(TEST_SOURCE.host);

  // Port (placeholder="443" — the generic default in SourceModal)
  await modalBody.getByPlaceholder('443').fill(TEST_SOURCE.port);

  // Database (placeholder="Database")
  await modalBody.getByPlaceholder('Database').fill(TEST_SOURCE.database);

  // Username (placeholder="Username" — getLanguageLabel("userName"))
  await modalBody.getByPlaceholder(/username/i).fill(TEST_SOURCE.username);

  // Password — Ant Design Input.Password renders <input type="password">
  await modalBody.locator('input[type="password"]').fill(TEST_SOURCE.password);

  // -------------------------------------------------------------------
  // Step 3 — Submit
  // getLanguageLabel("create") = "Create" in English.
  // The footer button is a BoslerButton rendered as button[type="button"].
  // -------------------------------------------------------------------
  const createButton = page.getByRole('button', { name: /^(create|créer)$/i });
  await expect(createButton).toBeVisible({ timeout: 5000 });
  await createButton.click();

  // Modal closes after successful creation.
  await expect(page.locator('.ant-modal-body')).not.toBeVisible({ timeout: 15000 });

  return sourceName;
}

// ---------------------------------------------------------------------------
// loginAndCreateTestSource
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper: logs in and creates a PostgreSQL test source in one call.
 * Use in beforeEach when both login and a source are needed.
 */
export async function loginAndCreateTestSource(page: Page): Promise<string> {
  await loginAs(page);
  return createTestSource(page);
}
