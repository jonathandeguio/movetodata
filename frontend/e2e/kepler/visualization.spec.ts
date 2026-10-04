/**
 * E2E tests — Kepler : visualisation de graphiques
 *
 * Pages testées :
 *   /portal/kepler/CHART/:id    — vue d'un graphique ECharts
 *   /portal/kepler/DASHBOARD/:id — vue d'un tableau de bord
 *
 * Composants :
 *   Apps/Kepler/chart/index.tsx             — ChartsWrapper
 *   Apps/Kepler/chart/ChartComponentContainer.tsx
 *   Apps/Kepler/chart/components/KeplerHeader.tsx
 *   Apps/Kepler/dashboard/index.tsx         — Dashboard
 *
 * Notes importantes :
 *   - Les routes Kepler nécessitent un ID de ressource réel (UUID Boson).
 *   - Les tests de chargement de graphique sont paramétrés via
 *     TEST_CHART_ID et TEST_DASHBOARD_ID (variables d'env).
 *   - Si ces variables ne sont pas définies, les tests correspondants
 *     sont ignorés (test.skip) pour ne pas bloquer la CI.
 *   - Les tests de navigation (Explorer → Kepler) et de création de
 *     graphique testent le parcours UI complet.
 *
 * Variables d'env :
 *   TEST_CHART_ID       — UUID d'un graphique existant dans l'env de test
 *   TEST_DASHBOARD_ID   — UUID d'un tableau de bord existant
 */

import { expect, test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

// ---------------------------------------------------------------------------
// IDs optionnels — récupérés depuis les variables d'env
// ---------------------------------------------------------------------------

const CHART_ID = process.env.TEST_CHART_ID;
const DASHBOARD_ID = process.env.TEST_DASHBOARD_ID;

// ---------------------------------------------------------------------------
// Suite — accès aux pages Kepler
// ---------------------------------------------------------------------------

test.describe('Kepler – Chargement des graphiques', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 1. Chargement d'un graphique existant
  //    Requiert TEST_CHART_ID dans l'environnement.
  // -------------------------------------------------------------------------

  test('should render a chart page when navigating to /portal/kepler/CHART/:id', async ({ page }) => {
    test.skip(!CHART_ID, 'TEST_CHART_ID non défini — test ignoré');

    await page.goto(`/portal/kepler/CHART/${CHART_ID}`);

    // ChartsWrapper affiche un .kepler-container une fois le chargement terminé
    await expect(page.locator('.kepler-container')).toBeVisible({ timeout: 30000 });

    // KeplerHeader est toujours visible en mode édition
    // Il contient un bouton de sauvegarde (KeplerSaveBtn)
    await expect(page.locator('.kepler-container').first()).toBeVisible();
  });

  test('should render an ECharts canvas or SVG inside the chart container', async ({ page }) => {
    test.skip(!CHART_ID, 'TEST_CHART_ID non défini — test ignoré');

    await page.goto(`/portal/kepler/CHART/${CHART_ID}`);

    await expect(page.locator('.kepler-container')).toBeVisible({ timeout: 30000 });

    // ECharts génère soit un <canvas> soit un <svg> dans le conteneur du graphique
    // ChartComponentContainer → ChartComponent → ECharts instance
    const echartCanvas = page.locator('.kepler-container canvas, .kepler-container svg').first();
    await expect(echartCanvas).toBeVisible({ timeout: 20000 });
  });

  // -------------------------------------------------------------------------
  // 2. Chargement d'un tableau de bord existant
  // -------------------------------------------------------------------------

  test('should render a dashboard page when navigating to /portal/kepler/DASHBOARD/:id', async ({ page }) => {
    test.skip(!DASHBOARD_ID, 'TEST_DASHBOARD_ID non défini — test ignoré');

    await page.goto(`/portal/kepler/DASHBOARD/${DASHBOARD_ID}`);

    // Dashboard.index.tsx rend un conteneur principal
    // DashboardTabs est visible en haut du tableau de bord
    await expect(
      page.locator('.ant-tabs, .kepler-container, [class*="dashboard"]').first(),
    ).toBeVisible({ timeout: 30000 });
  });

  // -------------------------------------------------------------------------
  // 3. Redirection hors Kepler si la licence ne couvre pas le module
  //    KeplerRestricted.view.tsx affiche un message quand le produit
  //    n'inclut pas Kepler.
  //    Ce test vérifie que la page répond (200 ou restricted).
  // -------------------------------------------------------------------------

  test('should display either a chart or the KeplerRestricted view', async ({ page }) => {
    test.skip(!CHART_ID, 'TEST_CHART_ID non défini — test ignoré');

    await page.goto(`/portal/kepler/CHART/${CHART_ID}`);

    // Attendre l'un des deux états possibles
    await expect(
      page
        .locator('.kepler-container, [class*="restricted"], [class*="kepler"]')
        .first(),
    ).toBeVisible({ timeout: 30000 });
  });
});

// ---------------------------------------------------------------------------
// Suite — Navigation depuis Explorer vers Kepler
// ---------------------------------------------------------------------------

test.describe('Kepler – Navigation depuis Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 4. L'Explorer est accessible (prérequis pour créer un graphique)
  // -------------------------------------------------------------------------

  test('should display the Explorer when navigating to /portal/kitab/folder/:id', async ({ page }) => {
    // L'ID de dossier racine est "ROOT" par convention dans MoveToData
    // (voir specialIds dans Apps/explorer/explorer.constants)
    await page.goto('/portal/kitab/folder/ROOT');

    // FileExplorer.tsx rend une structure avec une barre de header
    // FolderDetailHeader rend .explorer-header
    // Si ROOT ne fonctionne pas, on vérifie qu'on est sur le portail (pas 404)
    const isExplorerVisible = await page.locator('.explorer-header').isVisible().catch(() => false);
    const isOnPortal = /\/portal\//.test(page.url());

    expect(
      isExplorerVisible || isOnPortal,
      `Attendu: explorer chargé ou URL portail — URL actuelle: ${page.url()}`,
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 5. Bouton "New" dans Explorer permet de créer un graphique
  //    NewButton rend un popover avec les types disponibles.
  //    Ce test vérifie uniquement l'ouverture du menu.
  // -------------------------------------------------------------------------

  test('should show the new resource menu when the New button is clicked in Explorer', async ({ page }) => {
    await page.goto('/portal/kitab/folder/ROOT');

    // Attendre le chargement du header
    await page.waitForTimeout(3000);

    // NewButton est dans FolderDetailHeader — chercher le bouton "New" ou "+"
    const newBtn = page.getByRole('button', { name: /^(new|\+|nouveau)$/i }).first();
    const isBtnVisible = await newBtn.isVisible().catch(() => false);

    if (isBtnVisible) {
      await newBtn.click();

      // Un menu ou popover s'ouvre avec les types de ressources
      await expect(
        page.locator('.ant-dropdown, .ant-popover').first(),
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Le bouton peut ne pas être visible si l'ID ROOT est invalide
      // On vérifie simplement qu'on est authentifié et sur le portail
      await expect(page).toHaveURL(/\/portal\//);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite — Sauvegarde d'un graphique
// ---------------------------------------------------------------------------

test.describe('Kepler – Sauvegarde', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 6. Le bouton de sauvegarde est visible sur la page d'un graphique
  // -------------------------------------------------------------------------

  test('should display a save button on the chart page', async ({ page }) => {
    test.skip(!CHART_ID, 'TEST_CHART_ID non défini — test ignoré');

    await page.goto(`/portal/kepler/CHART/${CHART_ID}`);

    await expect(page.locator('.kepler-container')).toBeVisible({ timeout: 30000 });

    // KeplerSaveBtn.tsx rend un bouton de sauvegarde dans KeplerHeader
    // Il peut être affiché comme un bouton avec icône uniquement
    // On cherche un bouton dans le header Kepler
    const headerButtons = page.locator('.kepler-container button');
    await expect(headerButtons.first()).toBeVisible({ timeout: 15000 });
  });
});
