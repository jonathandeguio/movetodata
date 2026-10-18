/**
 * F-AI-06 — Catalog Search (OpenMetadata full-text)
 *
 * Tests the CatalogSearch page exposed at /portal/catalog/search.
 * The OpenMetadata endpoint GET /api/v1/search/query is always mocked
 * (no MOCK_AI guard — OpenMetadata is not the AI service).
 */

import { test, expect } from '../../helpers/auth';
import {
  MOCK_SEARCH_RESPONSE,
  MOCK_SEARCH_EMPTY_RESPONSE,
} from '../../helpers/catalog-mocks';

test.describe('F-AI-06 — Catalog Search (OpenMetadata full-text)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OpenMetadata full-text search — always active.
    await page.route('**/api/v1/search/query**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SEARCH_RESPONSE),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should display the search page with an input', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/search');
    await expect(page).toHaveURL(/\/portal\/catalog\/search/);

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|search|catalog/i))
      .first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('should show results after search', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/search');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|search|catalog/i))
      .first();
    await searchInput.fill('sales');

    await page.getByRole('button', { name: /search|recherch/i }).first().click();

    await expect(
      page.getByText('SalesDataProduct').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show the RAG search suggestion banner', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/search');

    // An Ant Design Alert info pointing to the semantic/IA search page.
    await expect(
      page.getByRole('alert').or(page.getByText(/recherche.*ia|semantic|rag|sémantique/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to data product detail on click', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/catalog/search');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|search|catalog/i))
      .first();
    await searchInput.fill('sales');
    await page.getByRole('button', { name: /search|recherch/i }).first().click();

    await expect(
      page.getByText('SalesDataProduct').first()
    ).toBeVisible({ timeout: 10_000 });

    await page.getByText('SalesDataProduct').first().click();

    await expect(page).toHaveURL(/\/portal\/catalog\/data-product\//, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show empty state when no results', async ({ authenticatedPage: page }) => {
    // Override beforeEach mock with an empty response (LIFO — registered last, matched first).
    await page.route('**/api/v1/search/query**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SEARCH_EMPTY_RESPONSE),
      })
    );

    await page.goto('/portal/catalog/search');

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/recherch|search|catalog/i))
      .first();
    await searchInput.fill('xxxnotfound');
    await page.getByRole('button', { name: /search|recherch/i }).first().click();

    await expect(
      page.getByText(/aucun résultat|no result|empty|vide/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
