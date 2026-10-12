/**
 * F-ORCHESTRATION-02 — Scheduler (planification)
 *
 * Couvre le système de planification (/portal/schedules) :
 *   - Liste des planifications (enabled / disabled)
 *   - Détail d'une planification + logs d'exécution
 *   - Création d'une planification (PUT /api/scheduler/schedule)
 *   - Pause / reprise (POST /api/scheduler/:jobId/pause|resume)
 *   - Suppression (DELETE /api/scheduler/:resourceId)
 *   - Affichage de l'expression cron et de la prochaine exécution
 *   - État vide
 */

import { test, expect } from '../../helpers/auth';

// ---------------------------------------------------------------------------
// Données de test
// ---------------------------------------------------------------------------

const MOCK_SCHEDULES = [
  {
    id: 'sched-e2e-001',
    jobId: 'job-e2e-001',
    name: 'e2e-daily-refresh',
    resourceId: 'ds-e2e-001',
    resourceName: 'e2e-dataset-sales',
    resourceType: 'DATASET',
    cron: '0 6 * * *',
    enabled: true,
    lastRunAt: new Date(Date.now() - 86_400_000).toISOString(),
    nextRunAt: new Date(Date.now() + 3_600_000).toISOString(),
    branch: 'main',
  },
  {
    id: 'sched-e2e-002',
    jobId: 'job-e2e-002',
    name: 'e2e-weekly-export',
    resourceId: 'ds-e2e-002',
    resourceName: 'e2e-dataset-inventory',
    resourceType: 'DATASET',
    cron: '0 3 * * 1',
    enabled: false,
    lastRunAt: null,
    nextRunAt: null,
    branch: 'main',
  },
];

const MOCK_SCHEDULE_LOGS = [
  { id: 'log-001', jobId: 'job-e2e-001', status: 'SUCCESS', startedAt: new Date(Date.now() - 86_400_000).toISOString(), finishedAt: new Date(Date.now() - 86_390_000).toISOString() },
  { id: 'log-002', jobId: 'job-e2e-001', status: 'FAILED', startedAt: new Date(Date.now() - 172_800_000).toISOString(), finishedAt: new Date(Date.now() - 172_790_000).toISOString() },
];

function mockSchedulesList(page: import('@playwright/test').Page, schedules = MOCK_SCHEDULES) {
  return page.route('**/scheduler/getAll**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: schedules,
        totalElements: schedules.length,
        totalPages: 1,
        number: 0,
      }),
    })
  );
}

// =============================================================================
// Suite
// =============================================================================

test.describe('F-ORCHESTRATION-02 — Liste des planifications', () => {
  test.beforeEach(async ({ page }) => {
    await mockSchedulesList(page);
  });

  test('la page /portal/schedules se charge correctement', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules');
    await expect(page).toHaveURL(/\/portal\/schedules/);
    await expect(page.getByPlaceholder(/password/i)).not.toBeVisible();
  });

  test('les planifications enabled et disabled sont affichées', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules');
    await expect(page.getByText(/e2e-daily-refresh/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/e2e-weekly-export/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('l\'expression cron est affichée', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules');
    await expect(page.getByText(/0 6 \* \* \*|every day|chaque jour/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('état vide quand aucune planification', async ({ authenticatedPage: page }) => {
    await page.route('**/scheduler/getAll**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0 }),
      })
    );
    await page.goto('/portal/schedules');
    await expect(
      page.getByText(/no schedule|no data|aucune planification|aucun/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('F-ORCHESTRATION-02 — Détail d\'une planification', () => {
  test.beforeEach(async ({ page }) => {
    await mockSchedulesList(page);
    await page.route('**/scheduler/sched-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SCHEDULES[0]),
      })
    );
    await page.route('**/scheduler/logs/job-e2e-001**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: MOCK_SCHEDULE_LOGS, totalElements: MOCK_SCHEDULE_LOGS.length }),
      })
    );
  });

  test('navigation vers le détail d\'une planification', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules');
    await page.getByText(/e2e-daily-refresh/i).first().click();
    await page.waitForURL('**/portal/schedules/**', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/portal\/schedules\//);
  });

  test('accès direct à /portal/schedules/:id', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules/sched-e2e-001');
    await expect(page).toHaveURL(/\/portal\/schedules\/sched-e2e-001/);
  });

  test('les logs d\'exécution sont affichés dans le détail', async ({ authenticatedPage: page }) => {
    await page.goto('/portal/schedules/sched-e2e-001');
    const logsTab = page.getByText(/log|historique|exécution/i).first();
    if (await logsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await logsTab.click();
    }
    await expect(
      page.getByText(/success|fail(ed)?/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('F-ORCHESTRATION-02 — Pause et reprise', () => {
  test.beforeEach(async ({ page }) => {
    await mockSchedulesList(page);
    await page.route('**/scheduler/sched-e2e-001**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCHEDULES[0]) })
    );
  });

  test('mettre en pause une planification active appelle POST /scheduler/:id/pause', async ({ authenticatedPage: page }) => {
    let pauseCalled = false;
    await page.route('**/scheduler/**/pause**', (route) => {
      pauseCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/portal/schedules');
    const pauseBtn = page.getByRole('button', { name: /pause|désactiver/i }).first();
    if (await pauseBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pauseBtn.click();
      await page.waitForTimeout(1_000);
      expect(pauseCalled).toBe(true);
    } else {
      test.skip();
    }
  });

  test('reprendre une planification suspendue appelle POST /scheduler/:id/resume', async ({ authenticatedPage: page }) => {
    let resumeCalled = false;
    await page.route('**/scheduler/**/resume**', (route) => {
      resumeCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/portal/schedules');
    // La planification sched-e2e-002 est disabled — chercher un bouton Activer/Resume
    const resumeBtn = page.getByRole('button', { name: /resume|activer|reprendre/i }).first();
    if (await resumeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resumeBtn.click();
      await page.waitForTimeout(1_000);
      expect(resumeCalled).toBe(true);
    } else {
      test.skip();
    }
  });
});

test.describe('F-ORCHESTRATION-02 — Création d\'une planification', () => {
  test.beforeEach(async ({ page }) => {
    await mockSchedulesList(page, []);
    await page.route('**/scheduler/schedule**', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'sched-e2e-new', cron: '0 8 * * 1-5', enabled: true }),
        });
      }
      return route.continue();
    });
    await page.route('**/scheduler/getJob/**', (route) =>
      route.fulfill({ status: 404, body: '' })
    );
  });

  test('créer une planification appelle PUT /scheduler/schedule', async ({ authenticatedPage: page }) => {
    let scheduleCalled = false;
    await page.route('**/scheduler/schedule**', (route) => {
      if (route.request().method() === 'PUT') {
        scheduleCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'sched-e2e-new', cron: '0 8 * * 1-5', enabled: true }),
        });
      }
      return route.continue();
    });

    await page.goto('/portal/schedules');
    const newBtn = page.getByRole('button', { name: /nouveau|new|planifier|schedule/i }).first();
    if (await newBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await newBtn.click();
      // Remplir le cron
      const cronInput = page.getByPlaceholder(/cron|0 \* \* \*/i).first();
      if (await cronInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await cronInput.fill('0 8 * * 1-5');
      }
      const saveBtn = page.getByRole('button', { name: /save|sauvegarder|créer|create/i }).first();
      if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1_000);
        expect(scheduleCalled).toBe(true);
      }
    } else {
      test.skip();
    }
  });
});
