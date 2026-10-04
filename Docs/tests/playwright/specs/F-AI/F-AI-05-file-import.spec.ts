/**
 * F-AI-05 — File Import with AI Analysis
 *
 * Tests the AI-assisted file import flow:
 *   1. User uploads a file  → POST /api/files/upload
 *   2. Backend analyses it  → POST /api/ai/analyze-file
 *   3. UI shows a summary of detected columns and quality.
 *
 * The upload interaction uses Playwright's setInputFiles() to simulate file
 * selection. Both API calls are intercepted when MOCK_AI=true.
 */

import { test, expect } from '../../helpers/auth';
import { mockFileAnalysisResponse } from '../../helpers/api';
import path from 'path';
import fs from 'fs';
import os from 'os';

const useMockAI = process.env.MOCK_AI !== 'false';

/** Creates a small temporary CSV file and returns its path. */
function createTmpCsv(): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, 'e2e-test-import.csv');
  const content = 'id,label,value\n1,foo,10\n2,bar,20\n3,baz,30\n';
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

test.describe('F-AI-05 — File Import', () => {
  let tmpCsvPath: string;

  test.beforeAll(() => {
    tmpCsvPath = createTmpCsv();
  });

  test.afterAll(() => {
    try {
      fs.unlinkSync(tmpCsvPath);
    } catch {
      // Ignore cleanup errors in CI.
    }
  });

  test.beforeEach(async ({ page }) => {
    if (useMockAI) {
      // Mock the file upload endpoint — returns a file ID.
      await page.route('**/api/files/upload**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ fileId: 'file-e2e-001', fileName: 'e2e-test-import.csv' }),
        })
      );

      // Mock the AI analysis endpoint.
      await page.route('**/api/ai/analyze-file**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockFileAnalysisResponse()),
        })
      );
    }
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should display a file import button or drag-and-drop zone', async ({ authenticatedPage: page }) => {
    // The file import UI can live on /portal/connect/source or a dedicated import page.
    await page.goto('/portal/connect/source');

    const importTrigger = page
      .getByRole('button', { name: /import|upload|add file/i })
      .first();
    await expect(importTrigger).toBeVisible({ timeout: 10_000 });
  });

  test('should upload a CSV file and display the analysis results', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');

    // Open the import / upload dialog.
    const importButton = page
      .getByRole('button', { name: /import|upload|add file/i })
      .first();
    await importButton.click();

    // Locate the file input (may be hidden; Playwright handles it automatically).
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(tmpCsvPath);

    // Confirm / submit the upload.
    const confirmButton = page
      .getByRole('button', { name: /confirm|upload|next|valider/i })
      .first();
    if (await confirmButton.isVisible({ timeout: 5_000 })) {
      await confirmButton.click();
    }

    // Wait for the mock analysis response to be displayed.
    await expect(
      page.getByText(/200 rows|200 lignes|csv file/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display detected column names from the analysis', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');

    const importButton = page
      .getByRole('button', { name: /import|upload|add file/i })
      .first();
    await importButton.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(tmpCsvPath);

    const confirmButton = page
      .getByRole('button', { name: /confirm|upload|next|valider/i })
      .first();
    if (await confirmButton.isVisible({ timeout: 5_000 })) {
      await confirmButton.click();
    }

    // Mock returns columns: id, label, value.
    await expect(
      page.getByText(/\blabel\b/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should show an error when the upload endpoint returns 413 (file too large)', async ({ authenticatedPage: page }) => {
    await page.route('**/api/files/upload**', (route) =>
      route.fulfill({ status: 413, body: 'Payload Too Large' })
    );

    await page.goto('/portal/connect/source');

    const importButton = page
      .getByRole('button', { name: /import|upload|add file/i })
      .first();
    await importButton.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(tmpCsvPath);

    const confirmButton = page
      .getByRole('button', { name: /confirm|upload|next|valider/i })
      .first();
    if (await confirmButton.isVisible({ timeout: 5_000 })) {
      await confirmButton.click();
    }

    await expect(
      page.getByText(/too large|trop grand|413|size limit/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should show an error when the AI analysis returns 500', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/analyze-file**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/portal/connect/source');

    const importButton = page
      .getByRole('button', { name: /import|upload|add file/i })
      .first();
    await importButton.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(tmpCsvPath);

    const confirmButton = page
      .getByRole('button', { name: /confirm|upload|next|valider/i })
      .first();
    if (await confirmButton.isVisible({ timeout: 5_000 })) {
      await confirmButton.click();
    }

    await expect(
      page.getByText(/error|erreur|analysis failed/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
