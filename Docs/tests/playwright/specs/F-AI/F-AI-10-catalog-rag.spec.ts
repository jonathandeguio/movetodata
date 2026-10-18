/**
 * F-AI-10 — Catalog RAG Search (Recherche Sémantique)
 *
 * Tests the CatalogRagSearch page exposed at /portal/catalog/rag.
 * All /api/ai/catalog/rag/** endpoints are guarded by `useMockAI`
 * (same pattern as F-AI-01).
 */

import { test, expect } from '../../helpers/auth';
import {
  MOCK_RAG_RESULTS,
  MOCK_RAG_STATUS,
  MOCK_RAG_INDEX_RESPONSE,
} from '../../helpers/catalog-mocks';

const useMockAI = process.env.MOCK_AI !== 'false';

test.describe('F-AI-10 — Catalog RAG Search (Recherche Sémantique)', () => {
  test.beforeEach(async ({ page }) => {
    if (useMockAI) {
      // RAG index status.
      await page.route('**/api/ai/catalog/rag/status**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RAG_STATUS),
        })
      );

      // RAG semantic search.
      await page.route('**/api/ai/catalog/rag/search**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RAG_RESULTS),
        })
      );

      // RAG re-index trigger.
      await page.route('**/api/ai/catalog/rag/index**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RAG_INDEX_RESPONSE),
        })
      );
    }
  });

  // -------------------------------------------------------------------------
  // Page structure
  // -------------------------------------------------------------------------

  test('should display the semantic search page', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/rag');
    await expect(page).toHaveURL(/\/portal\/catalog\/rag/);

    await expect(
      page.getByText(/recherche sémantique/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // An IA badge must be visible (Ant Design Tag or similar).
    await expect(
      page.getByText(/\bIA\b|\bAI\b/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show RAG status in collapse panel', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/rag');

    // Open the status collapse panel.
    await page
      .getByRole('button', { name: /statut.*index|rag.*status|index.*rag/i })
      .or(page.getByText(/statut.*index|rag.*status/i))
      .first()
      .click();

    await expect(
      page.getByText('42').first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText('nomic-embed-text').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Semantic search
  // -------------------------------------------------------------------------

  test('should return semantic results on search', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/rag');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|query|question/i))
      .first();
    await searchInput.fill('données clients anonymisées');
    await searchInput.press('Enter');

    await expect(
      page.getByText('SalesDataProduct').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show result score and badges', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/rag');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|query|question/i))
      .first();
    await searchInput.fill('données clients anonymisées');
    await searchInput.press('Enter');

    // Wait for results to appear.
    await expect(
      page.getByText('SalesDataProduct').first()
    ).toBeVisible({ timeout: 10_000 });

    // Score badge — rendered as a percentage (92%) or Ant Design Progress.
    await expect(
      page.getByText(/92|0\.92|score/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Quality and access policy badges.
    await expect(page.getByText('GOLD').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('INTERNAL').first()).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Re-index
  // -------------------------------------------------------------------------

  test('should trigger reindex with confirmation', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/rag');

    // Click the re-index button.
    await page.getByRole('button', { name: /ré.?index|reindex/i }).first().click();

    // A confirmation modal must appear (Ant Design Modal.confirm).
    await expect(
      page.getByRole('dialog').or(page.getByText(/confirmer|confirm|êtes.vous sûr/i)).first()
    ).toBeVisible({ timeout: 10_000 });

    // Confirm the action.
    await page.getByRole('button', { name: /ok|confirmer|oui|yes/i }).last().click();

    // A success notification must appear.
    await expect(
      page.getByText(/succès|success|indexé|indexed/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  test('should navigate to data product on result click', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/rag');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|query|question/i))
      .first();
    await searchInput.fill('données clients anonymisées');
    await searchInput.press('Enter');

    await expect(
      page.getByText('SalesDataProduct').first()
    ).toBeVisible({ timeout: 10_000 });

    // Click the result link.
    await page.getByRole('link', { name: /SalesDataProduct/i }).first().click();

    await expect(page).toHaveURL(/\/portal\/catalog\/data-product\//, { timeout: 10_000 });
  });
});
