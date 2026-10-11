/**
 * scenario-seed.ts — Seed API pour les scénarios sectoriels.
 *
 * Crée (de façon permanente en base) pour chaque industrie :
 *   1. Upload du CSV → fileId
 *   2. Analyse IA    → stats + suggestions
 *   3. Source        → sourceId (via POST /api/sources/from-file)
 *   4. Dashboard KPI → dashboardId (via POST /api/kepler/dashboards/new)
 *
 * Utilise les credentials admin (TEST_USER / TEST_PASSWORD) pour la création.
 * Idempotent : les erreurs 409 sont ignorées, la source/dashboard existant
 * est renvoyé.
 */

import type { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { ScenarioIndustry } from './scenario-factory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeedResult {
  fileId:      string;
  sourceId:    string;
  dashboardId: string;
  /** URL relative vers la page source dans le portail */
  sourceUrl:   string;
  /** URL relative vers le dashboard KPI */
  dashboardUrl: string;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

async function adminToken(
  request:  APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const res = await request.post('/api/passport/login', {
    data:    { username, password, loginType: 'plain' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) throw new Error(`adminToken: login failed ${res.status()} — ${await res.text()}`);
  const body = await res.json();
  if (!body?.accessToken) throw new Error('adminToken: no accessToken in response');
  return body.accessToken;
}

async function uploadCsv(
  request: APIRequestContext,
  csvPath: string,
  token:   string,
): Promise<string> {
  const buffer   = fs.readFileSync(csvPath);
  const filename = path.basename(csvPath);

  const res = await request.post('/api/files/upload', {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      file: { name: filename, mimeType: 'text/csv', buffer },
    },
  });
  if (!res.ok()) throw new Error(`uploadCsv: ${res.status()} — ${await res.text()}`);
  const body = await res.json();
  return body.fileId as string;
}

async function analyzeFile(
  request: APIRequestContext,
  fileId:  string,
  token:   string,
): Promise<void> {
  const res = await request.post('/api/ai/analyze-file', {
    data:    { fileId },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  // Une erreur d'analyse ne bloque pas la suite — l'IA peut être indisponible
  if (!res.ok()) {
    console.warn(`[seed] analyzeFile ${fileId}: ${res.status()} — ${await res.text()}`);
  }
}

async function createSourceFromFile(
  request:    APIRequestContext,
  fileId:     string,
  sourceName: string,
  token:      string,
): Promise<string> {
  const res = await request.post('/api/sources/from-file', {
    data:    { fileId, sourceName },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });

  if (res.status() === 409) {
    // Déjà existant : on récupère l'ID depuis le corps de la réponse d'erreur si disponible
    try {
      const body = await res.json();
      return (body.sourceId ?? body.id ?? body.existingId) as string;
    } catch {
      throw new Error(`createSourceFromFile 409 — impossible de récupérer sourceId existant`);
    }
  }
  if (!res.ok()) throw new Error(`createSourceFromFile: ${res.status()} — ${await res.text()}`);
  const body = await res.json();
  return (body.sourceId ?? body.id) as string;
}

async function createDashboard(
  request: APIRequestContext,
  name:    string,
  description: string,
  token:   string,
): Promise<string> {
  const res = await request.post('/api/kepler/dashboards/new', {
    data:    { name, description },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`createDashboard: ${res.status()} — ${await res.text()}`);
  const body = await res.json();
  return (body.id ?? body.dashboardId ?? body.resourceId) as string;
}

// ---------------------------------------------------------------------------
// Export principal
// ---------------------------------------------------------------------------

/**
 * Seed permanent pour un scénario sectoriel.
 * À appeler dans `test.beforeAll` — utilise les credentials admin.
 *
 * @param request  - Playwright APIRequestContext (fixture `request`)
 * @param industry - Définition du scénario (depuis scenario-factory.ts)
 * @param csvPath  - Chemin absolu vers le fichier CSV à uploader
 */
export async function seedScenario(
  request:  APIRequestContext,
  industry: ScenarioIndustry,
  csvPath:  string,
): Promise<SeedResult> {
  const adminUser = process.env.TEST_USER     ?? 'platform-administrator';
  const adminPass = process.env.TEST_PASSWORD ?? '';

  console.log(`[seed] Scénario "${industry.label}" — début du seed`);

  // 1. Auth admin
  const token = await adminToken(request, adminUser, adminPass);

  // 2. Upload CSV
  console.log(`[seed] Upload CSV : ${path.basename(csvPath)}`);
  const fileId = await uploadCsv(request, csvPath, token);
  console.log(`[seed] fileId = ${fileId}`);

  // 3. Analyse IA (best effort)
  console.log(`[seed] Analyse IA du fichier...`);
  await analyzeFile(request, fileId, token);

  // 4. Création de la source
  const sourceName = `Scénario ${industry.label}`;
  console.log(`[seed] Création source : "${sourceName}"`);
  const sourceId = await createSourceFromFile(request, fileId, sourceName, token);
  console.log(`[seed] sourceId = ${sourceId}`);

  // 5. Création du dashboard KPI
  const dashName = `KPI ${industry.label}`;
  console.log(`[seed] Création dashboard : "${dashName}"`);
  const dashboardId = await createDashboard(request, dashName, `Tableau de bord ${industry.label}`, token);
  console.log(`[seed] dashboardId = ${dashboardId}`);

  const result: SeedResult = {
    fileId,
    sourceId,
    dashboardId,
    sourceUrl:    `/portal/connect/source/${sourceId}`,
    dashboardUrl: `/portal/kepler/DASHBOARD/${dashboardId}`,
  };

  console.log(`[seed] Scénario "${industry.label}" seedé`, result);
  return result;
}
