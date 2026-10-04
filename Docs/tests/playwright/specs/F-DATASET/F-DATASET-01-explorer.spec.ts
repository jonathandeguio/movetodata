/**
 * F-DATASET-01 — File Explorer (Kitab)
 *
 * Tests the Kitab folder explorer (/portal/kitab/folder/:id):
 *   - Folder contents are rendered.
 *   - Breadcrumb navigation works.
 *   - Clicking a dataset navigates to the dataset detail page.
 *   - Empty folder shows an appropriate state.
 */

import { test, expect } from '../../helpers/auth';

const FOLDER_ID = 'folder-e2e-001';

const MOCK_FOLDER = {
  id: FOLDER_ID,
  name: 'e2e-test-folder',
  path: '/e2e-test-folder',
  children: [
    {
      id: 'dataset-e2e-001',
      name: 'e2e-sales-dataset',
      type: 'DATASET',
      branch: 'master',
      updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      id: 'folder-e2e-002',
      name: 'e2e-sub-folder',
      type: 'FOLDER',
      branch: null,
      updatedAt: new Date(Date.now() - 7_200_000).toISOString(),
    },
  ],
};

test.describe('F-DATASET-01 — File Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/kitab/folder/${FOLDER_ID}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FOLDER),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should load folder contents at /portal/kitab/folder/:id', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/folder/${FOLDER_ID}`);
    await expect(page).toHaveURL(new RegExp(`/portal/kitab/folder/${FOLDER_ID}`));
  });

  test('should display the folder name and its children', async ({ authenticatedPage: page }) => {
    await page.goto(`/portal/kitab/folder/${FOLDER_ID}`);

    await expect(
      page.getByText(/e2e-sales-dataset/i).first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(/e2e-sub-folder/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to the dataset detail page when clicking a dataset', async ({ authenticatedPage: page }) => {
    await page.route('**/api/kitab/dataset/dataset-e2e-001/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'dataset-e2e-001', name: 'e2e-sales-dataset' }),
      })
    );

    await page.goto(`/portal/kitab/folder/${FOLDER_ID}`);
    await page.getByText(/e2e-sales-dataset/i).first().click();

    await page.waitForURL('**/portal/kitab/dataset/**', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/portal\/kitab\/dataset\//);
  });

  test('should navigate into a sub-folder when clicking it', async ({ authenticatedPage: page }) => {
    const subFolderId = 'folder-e2e-002';
    await page.route(`**/api/kitab/folder/${subFolderId}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: subFolderId, name: 'e2e-sub-folder', children: [] }),
      })
    );

    await page.goto(`/portal/kitab/folder/${FOLDER_ID}`);
    await page.getByText(/e2e-sub-folder/i).first().click();
    await page.waitForURL(`**/portal/kitab/folder/${subFolderId}`, { timeout: 10_000 });
    expect(page.url()).toContain(`/portal/kitab/folder/${subFolderId}`);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show an empty state for a folder with no children', async ({ authenticatedPage: page }) => {
    const emptyFolderId = 'folder-e2e-empty';
    await page.route(`**/api/kitab/folder/${emptyFolderId}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: emptyFolderId, name: 'e2e-empty-folder', children: [] }),
      })
    );

    await page.goto(`/portal/kitab/folder/${emptyFolderId}`);
    await expect(
      page.getByText(/no data|empty|vide|aucun/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
