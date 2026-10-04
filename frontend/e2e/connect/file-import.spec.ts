/**
 * E2E tests — Import de fichier CSV (Feature F5)
 *
 * Composants testés :
 *   src/components/FileImport/FileDropZone.tsx    — zone de dépôt drag-and-drop
 *   src/components/FileImport/FileAnalysisModal.tsx — modale d'analyse IA 4 onglets
 *
 * Sélecteurs :
 *   .ant-upload-dragger          — zone Ant Design Dragger
 *   .ant-modal                   — modale FileAnalysisModal
 *   .ant-tabs-tab                — onglets de la modale
 *   button[name=/créer un dataset/i] — bouton de création de dataset
 *
 * Prérequis d'intégration :
 *   - Le composant FileDropZone doit être monté dans une route accessible.
 *   - La constante FILE_IMPORT_ROUTE (ci-dessous) doit pointer vers cette route.
 *   - L'endpoint POST /api/files/upload doit être disponible.
 *   - L'endpoint POST /api/ai/analyze-file doit être disponible.
 *
 * NOTE : Au moment de l'écriture de ces tests (2026-10-04), FileDropZone est
 *   un composant autonome (src/components/FileImport/) non encore monté dans
 *   le routeur React (frontend/src/App/routes.tsx). Ces tests sont marqués
 *   test.skip jusqu'à l'intégration dans une route.
 *   Ticket de suivi : intégrer FileDropZone dans /portal/connect/import ou
 *   dans la page Connect Sources.
 *
 * Fichier de fixture : frontend/fixtures/sample.csv (10 lignes, 4 colonnes)
 */

import path from 'path';
import { expect, test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

// ---------------------------------------------------------------------------
// Configuration — mettre à jour quand FileDropZone sera intégré dans une route
// ---------------------------------------------------------------------------

/**
 * Route où FileDropZone sera montée.
 * Mettre à jour dès que la route est créée dans routes.tsx.
 */
const FILE_IMPORT_ROUTE = '/portal/connect/import';

/** Chemin absolu vers le fichier CSV de fixture */
const FIXTURE_CSV = path.resolve(__dirname, '../../fixtures/sample.csv');

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Import de fichier CSV (F5)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 1. La zone de dépôt est visible
  // -------------------------------------------------------------------------

  test('should display the file drop zone', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    // Ant Design Dragger rend une zone avec la classe .ant-upload-dragger
    await expect(page.locator('.ant-upload-dragger')).toBeVisible({ timeout: 15000 });

    // Le texte indicatif du composant
    await expect(
      page.getByText(/glissez un fichier ici/i),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 2. Upload d'un fichier CSV via le sélecteur de fichiers
  //    L'Ant Design Dragger expose un <input type="file"> caché.
  //    setInputFiles() déclenche le handler beforeUpload.
  // -------------------------------------------------------------------------

  test('should open the analysis modal after uploading a CSV file', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    // Localiser le <input type="file"> caché dans le Dragger
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_CSV);

    // FileDropZone appelle uploadFileAPI puis analyzeFileAPI.
    // Après le succès de l'upload, setModalOpen(true) ouvre FileAnalysisModal.
    // Le spinner "Analyse en cours..." apparaît d'abord.
    await expect(
      page.locator('.ant-modal').filter({ hasText: /analyse ia/i }),
    ).toBeVisible({ timeout: 20000 });
  });

  // -------------------------------------------------------------------------
  // 3. L'onglet "Rapport" affiche les statistiques (nb lignes, colonnes)
  // -------------------------------------------------------------------------

  test('should display statistics in the Rapport tab', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_CSV);

    // Attendre la fin de l'analyse (spinner disparaît, contenu chargé)
    const modal = page.locator('.ant-modal').filter({ hasText: /analyse ia/i });
    await expect(modal).toBeVisible({ timeout: 20000 });

    // Attendre la fin du loading (le spinner Spin doit disparaître)
    await expect(
      modal.locator('.ant-spin-spinning'),
    ).not.toBeVisible({ timeout: 60000 });

    // Cliquer sur l'onglet "Rapport"
    // TabPane tab="Rapport" key="report"
    await modal.getByRole('tab', { name: /rapport/i }).click();

    // FileAnalysisModal affiche des Statistic : "Lignes", "Colonnes", "Doublons"
    await expect(modal.getByText(/lignes/i).first()).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/colonnes/i).first()).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 4. L'onglet "Aperçu" affiche les types de colonnes
  // -------------------------------------------------------------------------

  test('should display column type tags in the Apercu tab', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_CSV);

    const modal = page.locator('.ant-modal').filter({ hasText: /analyse ia/i });
    await expect(modal).toBeVisible({ timeout: 20000 });
    await expect(modal.locator('.ant-spin-spinning')).not.toBeVisible({ timeout: 60000 });

    // L'onglet "Aperçu" est sélectionné par défaut (defaultActiveKey="preview")
    // Il affiche des Tags Ant Design avec les types de colonnes (date, ca, région…)
    await expect(modal.locator('.ant-tag').first()).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 5. Cliquer "Créer un dataset" ferme la modale et redirige vers Connect
  // -------------------------------------------------------------------------

  test('should create a dataset and display the source in Connect', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_CSV);

    const modal = page.locator('.ant-modal').filter({ hasText: /analyse ia/i });
    await expect(modal).toBeVisible({ timeout: 20000 });
    await expect(modal.locator('.ant-spin-spinning')).not.toBeVisible({ timeout: 60000 });

    // Cliquer le bouton "Créer un dataset" (footer du modal)
    const createBtn = modal.getByRole('button', { name: /créer un dataset/i });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();

    // Message de succès Ant Design message.success
    await expect(
      page.locator('.ant-message-notice', { hasText: /créé avec succès/i }),
    ).toBeVisible({ timeout: 15000 });

    // La modale se ferme
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------------
  // 6. Format non supporté — affiche un message d'erreur (pas de modal)
  // -------------------------------------------------------------------------

  test('should show an error alert for unsupported file formats', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    // Créer un fichier .exe en mémoire — format non supporté
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('fake binary content'),
    });

    // FileDropZone valide le format côté client (hasValidExtension)
    // et rend une <Alert type="error"> avec le message d'erreur
    await expect(page.locator('.ant-alert-error')).toBeVisible({ timeout: 8000 });

    // La modale d'analyse ne doit PAS s'ouvrir
    await expect(
      page.locator('.ant-modal').filter({ hasText: /analyse ia/i }),
    ).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 7. "Fermer sans enregistrer" ferme la modale sans créer de dataset
  // -------------------------------------------------------------------------

  test('should close the analysis modal without creating a dataset', async ({ page }) => {
    test.skip(true, `FileDropZone pas encore intégré dans ${FILE_IMPORT_ROUTE} — en attente de la route`);

    await page.goto(FILE_IMPORT_ROUTE);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_CSV);

    const modal = page.locator('.ant-modal').filter({ hasText: /analyse ia/i });
    await expect(modal).toBeVisible({ timeout: 20000 });
    await expect(modal.locator('.ant-spin-spinning')).not.toBeVisible({ timeout: 60000 });

    // Cliquer "Fermer sans enregistrer"
    await modal.getByRole('button', { name: /fermer sans enregistrer/i }).click();

    // La modale se ferme
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Aucun message de succès ne doit apparaître
    await expect(
      page.locator('.ant-message-notice', { hasText: /créé avec succès/i }),
    ).not.toBeVisible();
  });
});
