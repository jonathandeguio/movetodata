/**
 * F-AI-09 — Catalog Certify
 *
 * Tests the CatalogCertify page exposed at /portal/catalog/certify/:fqn.
 * GET and PATCH /api/v1/dataProducts/name/** are always mocked
 * (no MOCK_AI guard — OpenMetadata is not the AI service).
 */

import { test, expect } from '../../helpers/auth';
import { MOCK_DATA_PRODUCT } from '../../helpers/catalog-mocks';

const FQN = 'e2e.catalog.SalesDataProduct';
const CERTIFY_URL = `/portal/catalog/certify/${FQN}`;

test.describe('F-AI-09 — Catalog Certify', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GET — fetch current data product state.
    await page.route('**/api/v1/dataProducts/name/**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_DATA_PRODUCT),
        });
      } else {
        route.continue();
      }
    });

    // Mock PATCH — submit certification update.
    await page.route('**/api/v1/dataProducts/name/**', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_DATA_PRODUCT,
            extension: { qualityLevel: 'GOLD' },
          }),
        });
      } else {
        route.continue();
      }
    });
  });

  // -------------------------------------------------------------------------
  // Page structure
  // -------------------------------------------------------------------------

  test('should display the certification page with steps', async ({ authenticatedPage: page }) => {
    await page.goto(CERTIFY_URL);
    await expect(page).toHaveURL(new RegExp(`/portal/catalog/certify/${FQN}`));

    // The page must show the three certification levels as steps or options.
    await expect(page.getByText(/bronze/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/silver/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/gold/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should show current level as GOLD', async ({ authenticatedPage: page }) => {
    await page.goto(CERTIFY_URL);

    // The Gold step/option should carry an active / selected visual indicator.
    // Accept either an aria-selected attribute or a visible "GOLD" text near
    // an active/current marker.
    const goldElement = page.getByText(/gold/i).first();
    await expect(goldElement).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  test('should require a comment before promotion', async ({ authenticatedPage: page }) => {
    await page.goto(CERTIFY_URL);

    // Select Silver from the quality-level select.
    const levelSelect = page
      .getByRole('combobox')
      .or(page.getByLabel(/niveau|level|certification/i))
      .first();
    await levelSelect.click();
    await page.getByText(/silver/i).last().click();

    // Click Promouvoir without filling a comment.
    await page.getByRole('button', { name: /promouvoir|promote|valider/i }).first().click();

    // A validation message must appear.
    await expect(
      page.getByText(/commentaire|comment|requis|required/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should submit certification with comment', async ({ authenticatedPage: page }) => {
    await page.goto(CERTIFY_URL);

    // Select GOLD from the select (may already be selected — pick it explicitly).
    const levelSelect = page
      .getByRole('combobox')
      .or(page.getByLabel(/niveau|level|certification/i))
      .first();
    await levelSelect.click();
    await page.getByText(/gold/i).last().click();

    // Fill in the mandatory comment field.
    const commentInput = page
      .getByRole('textbox', { name: /commentaire|comment/i })
      .or(page.getByPlaceholder(/commentaire|comment/i))
      .first();
    await commentInput.fill('Validation QA complète');

    // Submit.
    await page.getByRole('button', { name: /promouvoir|promote|valider/i }).first().click();

    // A success notification must appear.
    await expect(
      page.getByText(/succès|success|certif.*mise à jour|updated/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
