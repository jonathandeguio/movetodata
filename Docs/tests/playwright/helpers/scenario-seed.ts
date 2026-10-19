/**
 * scenario-seed.ts — Seed API pour les scénarios sectoriels.
 *
 * Crée (de façon permanente en base) pour chaque industrie :
 *   1. Upload du CSV          → fileId + storagePath
 *   2. Analyse IA             → stats + suggestions (best effort)
 *   3. Projet kitab           → projectId  (POST /api/kitab/project/create)
 *   4. Source Connect         → sourceId   (POST /api/connect/source/create)
 *   5. Dashboard KPI          → dashboardId (POST /api/kepler/dashboards/new)
 *
 * Utilise les credentials admin (TEST_USER / TEST_PASSWORD) pour la création.
 * Idempotent : les erreurs 406/409 sont gérées silencieusement.
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
): Promise<{ fileId: string; storagePath: string }> {
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
  return { fileId: body.fileId as string, storagePath: body.storagePath as string };
}

async function analyzeFile(
  request: APIRequestContext,
  fileId:  string,
  token:   string,
): Promise<void> {
  const res = await request.post('/api/ai/analyze-file', {
    data:    { fileId },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    timeout: 120_000, // LLM inference can take up to 2 minutes on first run
  });
  // Une erreur d'analyse ne bloque pas la suite — l'IA peut être indisponible
  if (!res.ok()) {
    console.warn(`[seed] analyzeFile ${fileId}: ${res.status()} — ${await res.text()}`);
  }
}

// Mirrors Utils.normalizeName from the Java backend (strips same special chars).
function normalizeName(name: string): string {
  return name.replace(/[/\\:;%$&^#£@?~,*+"<>|'`]/g, '').replace(/^_+|_+$/, '');
}

/**
 * Crée un projet kitab (resource racine) ou récupère son ID s'il existe déjà.
 * Idempotent : gère le 406 "same name already exists".
 * Note : le backend normalise le nom via Utils.normalizeName (strip & etc.)
 * donc la comparaison après 406 doit aussi comparer la version normalisée.
 */
async function getOrCreateProject(
  request: APIRequestContext,
  name:    string,
  token:   string,
): Promise<string> {
  const createRes = await request.post('/api/kitab/project/create', {
    data:    { name, description: name },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });

  if (createRes.ok()) {
    const body = await createRes.json();
    return (body.id ?? body.resourceId) as string;
  }

  if (createRes.status() === 406) {
    // Déjà existant — on le retrouve par nom.
    // Le backend a normalisé le nom (strip &, #, etc.) donc on compare
    // aussi les versions normalisées.
    const normalized = normalizeName(name);
    const listRes = await request.get('/api/kitab/project/all', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok()) throw new Error(`getProjects failed: ${listRes.status()}`);
    const projects: Array<{ id: string; name: string }> = await listRes.json();
    const found = projects.find(
      (p) =>
        p.name === name ||
        p.name === normalized ||
        p.name?.toLowerCase() === name.toLowerCase() ||
        p.name?.toLowerCase() === normalized.toLowerCase(),
    );
    if (!found) throw new Error(`getOrCreateProject: projet "${name}" (normalisé: "${normalized}") introuvable après 406`);
    return found.id;
  }

  throw new Error(`getOrCreateProject "${name}": ${createRes.status()} — ${await createRes.text()}`);
}

/**
 * Crée une source Connect de type "folder" pointant vers le fichier uploadé.
 * Idempotent : gère le 409 "already exists".
 */
async function createSource(
  request:     APIRequestContext,
  name:        string,
  storagePath: string,
  projectId:   string,
  token:       string,
): Promise<string> {
  const res = await request.post('/api/connect/source/create', {
    data: {
      name,
      type:        'folder',
      path:        storagePath,
      directLoad:  true,
      agentId:     [],
      parent:      projectId,
    },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });

  if (res.status() === 409) {
    try {
      const body = await res.json();
      return (body.id ?? body.sourceId ?? body.existingId) as string;
    } catch {
      throw new Error('createSource 409 — impossible de récupérer le sourceId existant');
    }
  }
  if (!res.ok()) throw new Error(`createSource: ${res.status()} — ${await res.text()}`);
  const body = await res.json();
  return (body.id ?? body.sourceId) as string;
}

async function createDashboard(
  request:     APIRequestContext,
  name:        string,
  description: string,
  projectId:   string,
  token:       string,
): Promise<string> {
  const res = await request.post('/api/kepler/dashboards/new', {
    data:    { name, description, parent: projectId },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`createDashboard: ${res.status()} — ${await res.text()}`);
  const body = await res.json() as Record<string, unknown>;
  const id = (body.id ?? body.dashboardId ?? body.resourceId) as string | undefined;
  if (!id) {
    throw new Error(
      `createDashboard: impossible d'extraire l'ID depuis la réponse backend. ` +
      `Clés reçues : [${Object.keys(body).join(', ')}]. ` +
      `Corps complet : ${JSON.stringify(body)}`,
    );
  }
  return id;
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
  const { fileId, storagePath } = await uploadCsv(request, csvPath, token);
  console.log(`[seed] fileId = ${fileId}, storagePath = ${storagePath}`);

  // 3. Analyse IA (best effort)
  console.log(`[seed] Analyse IA du fichier...`);
  await analyzeFile(request, fileId, token);

  // 4. Projet kitab (resource parent)
  const projectName = `Scénario ${industry.label}`;
  console.log(`[seed] Projet : "${projectName}"`);
  const projectId = await getOrCreateProject(request, projectName, token);
  console.log(`[seed] projectId = ${projectId}`);

  // 5. Source Connect
  const sourceName = `Scénario ${industry.label}`;
  console.log(`[seed] Création source : "${sourceName}"`);
  const sourceId = await createSource(request, sourceName, storagePath, projectId, token);
  console.log(`[seed] sourceId = ${sourceId}`);

  // 6. Dashboard KPI
  const dashName = `KPI ${industry.label}`;
  console.log(`[seed] Création dashboard : "${dashName}"`);
  const dashboardId = await createDashboard(request, dashName, `Tableau de bord ${industry.label}`, projectId, token);
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
