/**
 * E2E tests — Features IA MoveToData (F1 : Text-to-SQL)
 *
 * Features testées :
 *   F1 — Text-to-SQL : bouton "IA" dans la barre Explorer, génération SQL,
 *                      panneau "SQL généré", badge de confiance.
 *
 * Composants attendus (à créer, décrits dans specs/ai-features-spec.md) :
 *   - Bouton "IA" ou "Demander à l'IA" dans la barre supérieure d'Explorer
 *   - Zone <textarea> avec placeholder "Posez votre question en français ou anglais…"
 *   - Panneau repliable "SQL généré" (accordéon)
 *   - Badge de confiance (vert > 80 %, orange 60-80 %, rouge < 60 %)
 *
 * STATUT DES TESTS :
 *   Tous les tests de cette suite sont marqués test.skip car les composants
 *   UI correspondants (bouton IA, panneau SQL) ne sont pas encore intégrés
 *   dans le routeur React au 2026-10-04.
 *
 *   Référence spec : specs/ai-features-spec.md § F1 — Text-to-SQL
 *   Endpoint backend : POST /api/ai/text-to-sql (proxy via Boson → movetodata-ai:8090)
 *
 *   Activation : retirer test.skip et définir TEST_SOURCE_ID (UUID d'une source
 *   JDBC active) dans les variables d'environnement.
 *
 * Variables d'env :
 *   TEST_SOURCE_ID   — UUID d'une source JDBC active dans l'env de test
 *   TEST_FOLDER_ID   — UUID d'un dossier accessible dans l'Explorer (défaut: ROOT)
 *
 * Endpoint mocké en CI :
 *   Les tests nécessitent un service movetodata-ai opérationnel (ou un mock).
 *   En CI, utiliser un mock server sur /api/ai/text-to-sql retournant :
 *   { sql: "SELECT * FROM test", confidence: 0.95, model: "qwen2.5-coder:7b", tokensUsed: 10 }
 */

import { expect, test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SOURCE_ID = process.env.TEST_SOURCE_ID;
const FOLDER_ID = process.env.TEST_FOLDER_ID ?? 'ROOT';

/** URL de l'Explorer avec un dossier donné */
const explorerUrl = (folderId: string) => `/portal/kitab/folder/${folderId}`;

// ---------------------------------------------------------------------------
// Suite — Text-to-SQL (F1)
// ---------------------------------------------------------------------------

test.describe('IA – Text-to-SQL (F1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 1. Le bouton "IA" est visible dans la barre supérieure d'Explorer
  //    Spec : "ajout d'un bouton 'IA' à droite du sélecteur de source"
  // -------------------------------------------------------------------------

  test('should display an "IA" button in the Explorer top bar', async ({ page }) => {
    test.skip(
      true,
      'Composant bouton IA pas encore intégré dans Explorer — voir specs/ai-features-spec.md §F1',
    );

    await page.goto(explorerUrl(FOLDER_ID));

    // Attendre le chargement de l'Explorer
    await page.waitForTimeout(3000);

    // Le bouton IA peut être rendu avec différents textes selon l'implémentation finale.
    // Candidates : "IA", "Demander à l'IA", "AI" ou un bouton avec aria-label="AI"
    const aiButton = page
      .getByRole('button', { name: /^(ia|ai|demander à l'ia|ask ai)$/i })
      .first();

    await expect(aiButton).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------------
  // 2. Cliquer le bouton IA affiche la zone de saisie
  //    Spec : "Une zone de saisie textuelle apparaît au-dessus de la grille"
  // -------------------------------------------------------------------------

  test('should show a text input area after clicking the AI button', async ({ page }) => {
    test.skip(
      true,
      'Composant bouton IA pas encore intégré dans Explorer — voir specs/ai-features-spec.md §F1',
    );

    await page.goto(explorerUrl(FOLDER_ID));
    await page.waitForTimeout(3000);

    const aiButton = page.getByRole('button', { name: /^(ia|ai|demander à l'ia)$/i }).first();
    await aiButton.click();

    // Zone de saisie avec le placeholder décrit dans la spec
    await expect(
      page.getByPlaceholder(/posez votre question/i),
    ).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  // 3. Soumettre une question génère du SQL et l'affiche dans le panneau
  //    Spec : "Le SQL généré est affiché dans un panneau repliable 'SQL généré'"
  // -------------------------------------------------------------------------

  test('should display generated SQL in the "SQL généré" panel', async ({ page }) => {
    test.skip(
      true,
      'Composant bouton IA pas encore intégré dans Explorer — voir specs/ai-features-spec.md §F1',
    );
    test.skip(!SOURCE_ID, 'TEST_SOURCE_ID non défini — test ignoré');

    await page.goto(explorerUrl(FOLDER_ID));
    await page.waitForTimeout(3000);

    const aiButton = page.getByRole('button', { name: /^(ia|ai|demander à l'ia)$/i }).first();
    await aiButton.click();

    const questionInput = page.getByPlaceholder(/posez votre question/i);
    await expect(questionInput).toBeVisible({ timeout: 8000 });

    // Saisir une question en langage naturel
    await questionInput.fill('montre moi les 10 premières lignes');

    // Cliquer "Générer le SQL" (spec § F1 wireframe)
    const generateButton = page.getByRole('button', { name: /générer le sql/i });
    await generateButton.click();

    // Spinner pendant la génération (max 10 s selon spec)
    // On attend que le spinner disparaisse ET que le panneau apparaisse
    await expect(page.locator('.ant-spin-spinning')).not.toBeVisible({ timeout: 15000 });

    // Le panneau "SQL généré" doit apparaître (accordéon fermé par défaut → ouvert)
    // Spec : "Panneau repliable 'SQL généré'"
    await expect(
      page.getByText(/sql généré/i).first(),
    ).toBeVisible({ timeout: 60000 }); // LLM peut être lent
  });

  // -------------------------------------------------------------------------
  // 4. Le badge de confiance est visible après la génération
  //    Spec : "badge de confiance affiché à droite du titre du panneau"
  // -------------------------------------------------------------------------

  test('should display a confidence badge after SQL generation', async ({ page }) => {
    test.skip(
      true,
      'Composant bouton IA pas encore intégré dans Explorer — voir specs/ai-features-spec.md §F1',
    );
    test.skip(!SOURCE_ID, 'TEST_SOURCE_ID non défini — test ignoré');

    await page.goto(explorerUrl(FOLDER_ID));
    await page.waitForTimeout(3000);

    const aiButton = page.getByRole('button', { name: /^(ia|ai|demander à l'ia)$/i }).first();
    await aiButton.click();

    await page.getByPlaceholder(/posez votre question/i).fill('montre moi les 10 premières lignes');
    await page.getByRole('button', { name: /générer le sql/i }).click();

    await expect(page.locator('.ant-spin-spinning')).not.toBeVisible({ timeout: 15000 });

    // Le badge de confiance est un pourcentage (ex: "95 %" ou "Confiance : 92 %")
    // Il est un Tag Ant Design coloré vert/orange/rouge selon la valeur
    await expect(
      page.locator('.ant-tag', { hasText: /%/ }).first(),
    ).toBeVisible({ timeout: 60000 });
  });

  // -------------------------------------------------------------------------
  // 5. Le bouton IA est grisé si aucune source JDBC n'est active
  //    Spec : "La fonctionnalité est désactivée si aucune source JDBC n'est active"
  // -------------------------------------------------------------------------

  test('should disable the AI button when no JDBC source is active', async ({ page }) => {
    test.skip(
      true,
      'Composant bouton IA pas encore intégré dans Explorer — voir specs/ai-features-spec.md §F1',
    );

    // Naviguer vers un dossier sans source JDBC active
    await page.goto(explorerUrl('ROOT'));
    await page.waitForTimeout(3000);

    const aiButton = page.getByRole('button', { name: /^(ia|ai|demander à l'ia)$/i }).first();

    // Vérifier que le bouton est désactivé (disabled ou aria-disabled)
    const isDisabled = await aiButton.isDisabled().catch(() => false);
    const hasDisabledAttr = await aiButton.getAttribute('disabled').catch(() => null);
    const hasAriaDisabled = await aiButton.getAttribute('aria-disabled').catch(() => null);

    expect(
      isDisabled || hasDisabledAttr !== null || hasAriaDisabled === 'true',
      'Le bouton IA devrait être désactivé sans source JDBC active',
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. Le SQL invalide (non-DQL) affiche un message d'erreur clair
  //    Spec § F1 : "Réponse 400 INVALID_DQL"
  //    Ce test utilise une question conçue pour générer un SQL de suppression.
  // -------------------------------------------------------------------------

  test('should show an error message for invalid DQL responses', async ({ page }) => {
    test.skip(
      true,
      'Composant bouton IA pas encore intégré dans Explorer — voir specs/ai-features-spec.md §F1',
    );
    test.skip(!SOURCE_ID, 'TEST_SOURCE_ID non défini — test ignoré');

    await page.goto(explorerUrl(FOLDER_ID));
    await page.waitForTimeout(3000);

    const aiButton = page.getByRole('button', { name: /^(ia|ai|demander à l'ia)$/i }).first();
    await aiButton.click();

    // La spec indique que les requêtes non-DQL sont rejetées.
    // Le modèle devrait générer CANNOT_ANSWER ou être refusé par la whitelist.
    await page.getByPlaceholder(/posez votre question/i).fill('supprime toutes les tables');
    await page.getByRole('button', { name: /générer le sql/i }).click();

    await expect(page.locator('.ant-spin-spinning')).not.toBeVisible({ timeout: 15000 });

    // L'interface doit afficher un message d'erreur explicite
    // (notification Ant Design ou inline message)
    await expect(
      page
        .locator('.ant-notification-notice-message, .ant-alert-error, [role="alert"]')
        .first(),
    ).toBeVisible({ timeout: 60000 });
  });
});

// ---------------------------------------------------------------------------
// Suite — Sidebar Assistant IA (F3 — à venir)
// ---------------------------------------------------------------------------

test.describe('IA – Sidebar Assistant (F3)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // -------------------------------------------------------------------------
  // 7. La sidebar IA peut être ouverte depuis le portail
  // -------------------------------------------------------------------------

  test('should open the AI assistant sidebar', async ({ page }) => {
    test.skip(
      true,
      'Sidebar Assistant IA pas encore implémentée — voir specs/ai-features-spec.md §F3',
    );

    await page.goto('/portal/home');

    // Le bouton d'ouverture de la sidebar IA (dans la SideBar ou MainHeader)
    const aiSidebarButton = page
      .getByRole('button', { name: /assistant ia|ai assistant|chatbot/i })
      .first();

    await expect(aiSidebarButton).toBeVisible({ timeout: 10000 });
    await aiSidebarButton.click();

    // La sidebar s'ouvre avec une zone de saisie de message
    await expect(
      page.getByPlaceholder(/message|question/i).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  // 8. Un message envoyé déclenche une réponse streamée
  //    Spec : "la réponse streame (tokens apparaissent progressivement)"
  // -------------------------------------------------------------------------

  test('should stream the AI response token by token', async ({ page }) => {
    test.skip(
      true,
      'Sidebar Assistant IA pas encore implémentée — voir specs/ai-features-spec.md §F3',
    );

    await page.goto('/portal/home');

    const aiSidebarButton = page
      .getByRole('button', { name: /assistant ia|ai assistant|chatbot/i })
      .first();
    await aiSidebarButton.click();

    const messageInput = page.getByPlaceholder(/message|question/i).first();
    await expect(messageInput).toBeVisible({ timeout: 8000 });
    await messageInput.fill('Bonjour, que peux-tu faire ?');

    // Envoyer le message (Enter ou bouton Send)
    await messageInput.press('Enter');

    // Vérifier qu'une réponse apparaît progressivement
    // Un indicateur de streaming peut être un curseur clignotant ou une classe spécifique
    // On attend simplement qu'une réponse non vide soit visible (timeout 60s pour LLM)
    const responseContainer = page.locator('[class*="message"], [class*="response"], .chat-message');
    await expect(responseContainer.last()).toBeVisible({ timeout: 60000 });

    // Le contenu de la réponse ne doit pas être vide
    const responseText = await responseContainer.last().textContent();
    expect(responseText?.trim().length).toBeGreaterThan(0);
  });
});
