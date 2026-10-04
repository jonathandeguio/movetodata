/**
 * F-AI-03 — Conversational Assistant (SSE streaming)
 *
 * Tests the AI chat assistant sidebar. The assistant streams tokens via
 * Server-Sent Events on POST /api/ai/chat.
 *
 * When MOCK_AI=true the SSE stream is simulated with page.route() returning a
 * text/event-stream body containing a sequence of token events.
 */

import { test, expect } from '../../helpers/auth';

const useMockAI = process.env.MOCK_AI !== 'false';

/** Builds a minimal SSE response body for testing. */
function buildSseBody(tokens: string[], model = 'qwen2.5-coder:7b'): string {
  const tokenEvents = tokens
    .map((t) => `data: ${JSON.stringify({ type: 'token', content: t })}\n\n`)
    .join('');
  const doneEvent = `data: ${JSON.stringify({ type: 'done', model, tokens_used: tokens.length * 4 })}\n\n`;
  return tokenEvents + doneEvent;
}

test.describe('F-AI-03 — Conversational Assistant', () => {
  test.beforeEach(async ({ page }) => {
    if (useMockAI) {
      await page.route('**/api/ai/chat**', async (route) => {
        const sseBody = buildSseBody(['Hello', ' !', ' How', ' can', ' I', ' help', ' you', '?']);
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: sseBody,
        });
      });

      // Mock chat history (empty at start).
      await page.route('**/api/ai/chat/history**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      );
    }
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('should show the AI assistant toggle or button on the portal', async ({ authenticatedPage: page }) => {
    // The assistant is accessible from the portal home.
    const assistantTrigger = page
      .getByRole('button', { name: /assistant|chat|ai|help/i })
      .first();
    await expect(assistantTrigger).toBeVisible({ timeout: 10_000 });
  });

  test('should open the chat sidebar when the assistant trigger is clicked', async ({ authenticatedPage: page }) => {
    const assistantTrigger = page
      .getByRole('button', { name: /assistant|chat|ai|help/i })
      .first();
    await assistantTrigger.click();

    // The chat input area should appear.
    const chatInput = page
      .getByPlaceholder(/message|ask|type here|votre message/i)
      .first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });
  });

  test('should stream and display the assistant response', async ({ authenticatedPage: page }) => {
    const assistantTrigger = page
      .getByRole('button', { name: /assistant|chat|ai|help/i })
      .first();
    await assistantTrigger.click();

    const chatInput = page
      .getByPlaceholder(/message|ask|type here|votre message/i)
      .first();
    await chatInput.fill('Hello, what can you do?');
    await page.keyboard.press('Enter');

    // The streamed tokens should eventually form the mock response.
    await expect(
      page.getByText(/hello|how can i help/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  test('should display an error when the SSE stream returns an error event', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/chat**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify({ type: 'error', error: 'LLM service unavailable' })}\n\n`,
      })
    );

    const assistantTrigger = page
      .getByRole('button', { name: /assistant|chat|ai|help/i })
      .first();
    await assistantTrigger.click();

    const chatInput = page
      .getByPlaceholder(/message|ask|type here|votre message/i)
      .first();
    await chatInput.fill('This should fail');
    await page.keyboard.press('Enter');

    await expect(
      page.getByText(/error|erreur|unavailable|indisponible/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should not send a message when the chat input is empty', async ({ authenticatedPage: page }) => {
    const sentRequests: string[] = [];
    await page.route('**/api/ai/chat**', (route) => {
      sentRequests.push(route.request().url());
      return route.continue();
    });

    const assistantTrigger = page
      .getByRole('button', { name: /assistant|chat|ai|help/i })
      .first();
    await assistantTrigger.click();

    // Press Enter without typing anything.
    const chatInput = page
      .getByPlaceholder(/message|ask|type here|votre message/i)
      .first();
    await chatInput.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // No API call should have been made.
    expect(sentRequests.length).toBe(0);
  });
});
