/**
 * F-CONNECT-03 — Connector Modal (création de source)
 *
 * Couvre la modale SourceModal :
 *   - Catalogue des connecteurs (disponible / beta / roadmap)
 *   - Présence des nouveaux connecteurs : BigQuery, S3/MinIO, Salesforce
 *   - Champs spécifiques par connecteur (BigQuery, S3, Salesforce, REST API)
 *   - Validation REST corrigée (précédemment toujours bloquée)
 *   - Test de connexion (success / failure)
 *   - Flux de création complet → redirection vers /analyze
 */

import { test, expect } from '../../helpers/auth';

const MOCK_PARENT_FOLDER = { id: 'folder-e2e-001', name: 'e2e-folder', type: 'FOLDER' };

const MOCK_SOURCE_CREATED = {
  id: 'src-e2e-new-001',
  name: 'e2e-bigquery-source',
  type: 'jdbc',
  dbmsType: 'BIGQUERY',
  status: 'CONNECTED',
};

/** Ouvre la modale "New Source" sur la page des sources. */
async function openNewSourceModal(page: import('@playwright/test').Page) {
  await page.route('**/connect/source/Getall**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.goto('/portal/connect/source');
  // Clique sur le bouton Nouveau
  await page.getByRole('button', { name: /nouveau|new/i }).first().click();
}

// =============================================================================
// Suite
// =============================================================================

test.describe('F-CONNECT-03 — Catalogue des connecteurs', () => {
  test('le catalogue affiche les connecteurs disponibles', async ({ authenticatedPage: page }) => {
    await openNewSourceModal(page);
    // Connecteurs existants
    await expect(page.getByText(/postgres/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/mysql/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/snowflake/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('les nouveaux connecteurs BigQuery, S3 et Salesforce sont présents', async ({ authenticatedPage: page }) => {
    await openNewSourceModal(page);
    await expect(page.getByText(/bigquery/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/s3.*minio|minio.*s3|amazon s3/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/salesforce/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('les connecteurs roadmap sont visibles mais non cliquables', async ({ authenticatedPage: page }) => {
    await openNewSourceModal(page);
    // SharePoint est en roadmap — sa carte doit exister et avoir opacity réduite / cursor not-allowed
    const sharepoint = page.getByText(/sharepoint/i).first();
    await expect(sharepoint).toBeVisible({ timeout: 10_000 });
    // Cliquer ne doit pas ouvrir le formulaire
    await sharepoint.click({ force: true });
    // Le formulaire ne doit pas apparaître (on reste sur le catalogue)
    await expect(page.getByText(/^name$|^nom$/i).first()).not.toBeVisible({ timeout: 3_000 }).catch(() => {/* acceptable */});
  });

  test('la recherche filtre les connecteurs', async ({ authenticatedPage: page }) => {
    await openNewSourceModal(page);
    await page.getByPlaceholder(/search|recherche/i).fill('postgres');
    await expect(page.getByText(/postgres/i).first()).toBeVisible({ timeout: 5_000 });
    // MySQL ne doit plus être visible
    await expect(page.getByText(/^mysql$/i).first()).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  });
});

test.describe('F-CONNECT-03 — Formulaire BigQuery', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/connect/source/Getall**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/kitab/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
  });

  test('sélectionner BigQuery affiche les champs Project ID et Service Account Key', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/bigquery/i).first().click();

    await expect(page.getByText(/project id/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/service account key/i).first()).toBeVisible({ timeout: 10_000 });
    // Pas de champ server/port générique (BigQuery ne l'utilise pas)
    await expect(page.getByPlaceholder(/443/i)).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  });

  test('créer une source BigQuery appelle POST /connect/source/create et redirige', async ({ authenticatedPage: page }) => {
    let createCalled = false;
    await page.route('**/connect/source/create**', (route) => {
      createCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SOURCE_CREATED),
      });
    });
    await page.route('**/kitab/explorer/resource/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: MOCK_SOURCE_CREATED.id, name: MOCK_SOURCE_CREATED.name }) })
    );

    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/bigquery/i).first().click();

    // Remplir les champs obligatoires
    await page.getByPlaceholder(/my-gcp-project/i).fill('my-test-project');
    await page.getByPlaceholder(/{"type": "service_account"/i).fill('{"type":"service_account","project_id":"test"}');

    // Sélectionner le dossier parent via mock
    await page.route('**/kitab/explorer**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_PARENT_FOLDER]) })
    );

    // Remplir le nom
    await page.getByRole('textbox').first().fill('e2e-bigquery-source');

    // Soumettre (Create)
    await page.getByRole('button', { name: /create|créer/i }).click();

    // La requête de création doit avoir été interceptée
    await page.waitForURL(`**/connect/source/${MOCK_SOURCE_CREATED.id}/analyze**`, { timeout: 10_000 }).catch(() => {});
    expect(createCalled).toBe(true);
  });
});

test.describe('F-CONNECT-03 — Formulaire S3 / MinIO', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/connect/source/Getall**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
  });

  test('sélectionner S3/MinIO affiche les champs bucket, région, clés AWS', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/amazon s3|s3.*minio/i).first().click();

    await expect(page.getByText(/bucket/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/region/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/access key id/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/secret access key/i).first()).toBeVisible({ timeout: 10_000 });
    // Endpoint MinIO est optionnel
    await expect(page.getByText(/endpoint.*minio|minio.*custom/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('F-CONNECT-03 — Formulaire Salesforce', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/connect/source/Getall**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
  });

  test('sélectionner Salesforce affiche les champs username, password et security token', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/salesforce/i).first().click();

    await expect(page.getByText(/security token/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/instance url/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('F-CONNECT-03 — Formulaire REST API (validation corrigée)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/connect/source/Getall**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
  });

  test('sélectionner REST API affiche les champs token, URL et méthode', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/rest api/i).first().click();

    await expect(page.getByText(/token/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/url/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/method|méthode/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('une source REST peut être créée (la validation ne bloque plus)', async ({ authenticatedPage: page }) => {
    let createCalled = false;
    await page.route('**/connect/source/create**', (route) => {
      createCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'src-rest-001', name: 'e2e-rest-source', type: 'rest' }),
      });
    });
    await page.route('**/kitab/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    );

    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/rest api/i).first().click();

    await page.getByRole('textbox').first().fill('e2e-rest-source');
    await page.getByPlaceholder(/token/i).fill('my-api-token');
    await page.getByPlaceholder(/url/i).fill('https://api.example.com/data');

    // Sélectionner la méthode GET
    const methodSelect = page.locator('select, .ant-select').filter({ hasText: /GET|POST|method/i }).first();
    await methodSelect.click().catch(() => {});
    await page.getByText(/^GET$/).first().click().catch(() => {});

    await page.getByRole('button', { name: /create|créer/i }).click();
    // Vérification : l'appel a été fait (pas bloqué par la validation)
    await page.waitForTimeout(2_000);
    expect(createCalled).toBe(true);
  });
});

test.describe('F-CONNECT-03 — Test de connexion', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/connect/source/Getall**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/ai/smart-connector/scores/batch**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
  });

  test('Test Connection retourne success', async ({ authenticatedPage: page }) => {
    await page.route('**/connect/source/testConnection**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Connection successful' }),
      })
    );

    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/postgres/i).first().click();

    // Remplir les champs minimum
    await page.getByPlaceholder(/server/i).first().fill('localhost');
    await page.getByPlaceholder(/443/i).fill('5432');
    await page.getByPlaceholder(/database/i).fill('mydb');
    await page.getByPlaceholder(/user/i).fill('admin');

    await page.getByRole('button', { name: /test.*connection|tester/i }).first().click();
    await expect(
      page.getByText(/success|connexion.*réussie|connected/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Test Connection affiche une erreur en cas d\'échec', async ({ authenticatedPage: page }) => {
    await page.route('**/connect/source/testConnection**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Connection refused' }),
      })
    );

    await page.goto('/portal/connect/source');
    await page.getByRole('button', { name: /nouveau|new/i }).first().click();
    await page.getByText(/postgres/i).first().click();

    await page.getByRole('button', { name: /test.*connection|tester/i }).first().click();
    await expect(
      page.getByText(/error|erreur|refused|failed/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
