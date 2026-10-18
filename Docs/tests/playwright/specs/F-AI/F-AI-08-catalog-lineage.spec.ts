/**
 * F-AI-08 — Catalog Lineage
 *
 * Tests the CatalogLineage page exposed at /portal/catalog/lineage/:id.
 * The OpenMetadata endpoint GET /api/v1/lineage/** is always mocked
 * (no MOCK_AI guard — OpenMetadata is not the AI service).
 */

import { test, expect } from '../../helpers/auth';
import { MOCK_LINEAGE } from '../../helpers/catalog-mocks';

const ENTITY_ID = 'dp-e2e-001';
const LINEAGE_URL = `/portal/catalog/lineage/${ENTITY_ID}`;

test.describe('F-AI-08 — Catalog Lineage', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OpenMetadata lineage endpoint — always active.
    await page.route('**/api/v1/lineage/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LINEAGE),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Page load
  // -------------------------------------------------------------------------

  test('should display the lineage page', async ({ authenticatedPage: page }) => {
    await page.goto(LINEAGE_URL);
    await expect(page).toHaveURL(new RegExp(`/portal/catalog/lineage/${ENTITY_ID}`));

    // Page must render without a crash — verify a stable structural element.
    await expect(
      page.getByText(/SalesDataProduct|lignage|lineage/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Graph nodes
  // -------------------------------------------------------------------------

  test('should show upstream nodes', async ({ authenticatedPage: page }) => {
    await page.goto(LINEAGE_URL);

    // RawSalesCSV is an upstream source — visible in list or SVG node label.
    await expect(
      page.getByText('RawSalesCSV').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show downstream nodes', async ({ authenticatedPage: page }) => {
    await page.goto(LINEAGE_URL);

    // SalesDashboard is a downstream consumer — visible in list or SVG node label.
    await expect(
      page.getByText('SalesDashboard').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
