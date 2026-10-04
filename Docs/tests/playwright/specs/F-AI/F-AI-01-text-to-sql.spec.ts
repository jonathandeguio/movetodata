/**
 * F-AI-01 — Text-to-SQL
 *
 * Tests the Text-to-SQL feature exposed via the Dataset Detail page
 * (/portal/kitab/dataset/:id/:branch). The AI endpoint POST /api/ai/text-to-sql
 * is intercepted when MOCK_AI=true (default for CI).
 *
 * Wire format (from aiService.ts):
 *   Request  : { datasetId, branch, question }
 *   Response : { sql, confidence, model, tokensUsed, sourceId }
 */

import { test, expect } from '../../helpers/auth';
import { mockTextToSqlResponse } from '../../helpers/api';

const DATASET_ID = 'dataset-e2e-sql-001';
const BRANCH = 'master';

const MOCK_DATASET = {
  id: DATASET_ID,
  name: 'e2e-orders-dataset',
  branch: BRANCH,
  columns: [
    { name: 'id', type: 'INTEGER' },
    { name: 'customer', type: 'VARCHAR' },
    { name: 'amount', type: 'DECIMAL' },
    { name: 'created_at', type: 'TIMESTAMP' },
  ],
};

const useMockAI = process.env.MOCK_AI !== 'false';

test.describe('F-AI-01 — Text-to-SQL', () => {
  test.beforeEach(async ({ page }) => {
    // Mock dataset detail.
    await page.route(`**/api/kitab/dataset/${DATASET_ID}/${BRANCH}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DATASET),
      })
    );

    // Mock or relay the AI endpoint.
    if (useMockAI) {
      await page.route('**/api/ai/text-to-sql**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTextToSqlResponse()),
        })
      );
    }
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should display the Text-to-SQL input area on the dataset page', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);
    await expect(page).toHaveURL(new RegExp(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`));

    // The AI assistant panel or text-to-sql input should be visible.
    const aiInput = page
      .getByPlaceholder(/ask a question|posez une question|text.to.sql|sql query/i)
      .first();
    await expect(aiInput).toBeVisible({ timeout: 10_000 });
  });

  test('should generate SQL and display the result', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);

    const aiInput = page
      .getByPlaceholder(/ask a question|posez une question|text.to.sql/i)
      .first();
    await aiInput.fill('Show me orders from the last 30 days');

    await page.getByRole('button', { name: /generate|run|ask|submit/i }).first().click();

    // The generated SQL should appear in a code block.
    await expect(
      page.getByText(/SELECT|select/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display the confidence score alongside the SQL', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);

    const aiInput = page
      .getByPlaceholder(/ask a question|posez une question|text.to.sql/i)
      .first();
    await aiInput.fill('Count orders per customer');
    await page.getByRole('button', { name: /generate|run|ask|submit/i }).first().click();

    // The mock returns confidence 0.87 — the UI renders it as "87%" or "high".
    await expect(
      page.getByText(/87|high|confidence/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show a warning when confidence is below 0.6', async ({ authenticatedPage: page }) => {
    // Override mock to return low-confidence result.
    await page.route('**/api/ai/text-to-sql**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockTextToSqlResponse(), confidence: 0.45 }),
      })
    );

    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);
    const aiInput = page
      .getByPlaceholder(/ask a question|posez une question|text.to.sql/i)
      .first();
    await aiInput.fill('Something ambiguous');
    await page.getByRole('button', { name: /generate|run|ask|submit/i }).first().click();

    await expect(
      page.getByText(/low|warning|faible|attention/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should show an error message when the AI service is unavailable', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/text-to-sql**', (route) =>
      route.fulfill({ status: 503, body: 'Service Unavailable' })
    );

    await page.goto(`/portal/kitab/dataset/${DATASET_ID}/${BRANCH}`);
    const aiInput = page
      .getByPlaceholder(/ask a question|posez une question|text.to.sql/i)
      .first();
    await aiInput.fill('How many rows?');
    await page.getByRole('button', { name: /generate|run|ask|submit/i }).first().click();

    await expect(
      page.getByText(/error|erreur|unavailable|indisponible/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
