/**
 * F-AI-07 — Catalog Data Product Detail
 *
 * Tests the CatalogDataProduct page exposed at
 * /portal/catalog/data-product/:fqn.
 * The OpenMetadata endpoint GET /api/v1/dataProducts/name/** is always mocked
 * (no MOCK_AI guard — OpenMetadata is not the AI service).
 */

import { test, expect } from '../../helpers/auth';
import { MOCK_DATA_PRODUCT } from '../../helpers/catalog-mocks';

const FQN = 'e2e.catalog.SalesDataProduct';
const DETAIL_URL = `/portal/catalog/data-product/${FQN}`;

test.describe('F-AI-07 — Catalog Data Product Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OpenMetadata data product fetch by FQN — always active.
    await page.route('**/api/v1/dataProducts/name/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DATA_PRODUCT),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Overview tab
  // -------------------------------------------------------------------------

  test('should display the data product overview tab', async ({ authenticatedPage: page }) => {
    await page.goto(DETAIL_URL);
    await expect(page).toHaveURL(new RegExp(`/portal/catalog/data-product/${FQN}`));

    await expect(
      page.getByText('Sales Data Product').first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(/dataset de ventes|anonymisé/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Access tab
  // -------------------------------------------------------------------------

  test('should display the access tab with policy badge', async ({ authenticatedPage: page }) => {
    await page.goto(DETAIL_URL);

    await page.getByRole('tab', { name: /accès|access/i }).click();

    await expect(
      page.getByText('INTERNAL').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Governance / RGPD tab
  // -------------------------------------------------------------------------

  test('should display the governance tab with PII columns', async ({ authenticatedPage: page }) => {
    await page.goto(DETAIL_URL);

    await page.getByRole('tab', { name: /gouvernance|rgpd|gdpr/i }).click();

    await expect(
      page.getByText('customer_email').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show the DPO controller in governance tab', async ({ authenticatedPage: page }) => {
    await page.goto(DETAIL_URL);

    await page.getByRole('tab', { name: /gouvernance|rgpd|gdpr/i }).click();

    await expect(
      page.getByText(/DPO MoveToData/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  test('should navigate to lineage on button click', async ({ authenticatedPage: page }) => {
    await page.goto(DETAIL_URL);

    await page.getByRole('button', { name: /lignage|lineage/i }).first().click();

    await expect(page).toHaveURL(/\/portal\/catalog\/lineage\/dp-e2e-001/, { timeout: 10_000 });
  });

  test('should navigate to certify on access tab button', async ({ authenticatedPage: page }) => {
    await page.goto(DETAIL_URL);

    await page.getByRole('tab', { name: /accès|access/i }).click();

    await page.getByRole('button', { name: /certif/i }).first().click();

    await expect(page).toHaveURL(/\/portal\/catalog\/certify\//, { timeout: 10_000 });
  });
});
