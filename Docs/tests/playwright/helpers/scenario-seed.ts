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
 *
 * Utilise fetch natif (Node 18+) — pas de dépendance au cycle de vie des fixtures
 * Playwright, ce qui évite les erreurs "Request context disposed" sur les retries.
 */

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
  baseURL:  string,
  username: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${baseURL}/api/passport/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password, loginType: 'plain' }),
  });
  if (!res.ok) throw new Error(`adminToken: login failed ${res.status} — ${await res.text()}`);
  const body = await res.json() as Record<string, unknown>;
  if (!body?.accessToken) throw new Error('adminToken: no accessToken in response');
  return body.accessToken as string;
}

async function uploadCsv(
  baseURL:  string,
  csvPath:  string,
  token:    string,
): Promise<{ fileId: string; storagePath: string }> {
  const buffer   = fs.readFileSync(csvPath);
  const filename = path.basename(csvPath);

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'text/csv' }), filename);

  const res = await fetch(`${baseURL}/api/files/upload`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });
  if (!res.ok) throw new Error(`uploadCsv: ${res.status} — ${await res.text()}`);
  const body = await res.json() as Record<string, unknown>;
  return { fileId: body.fileId as string, storagePath: body.storagePath as string };
}

async function analyzeFile(
  baseURL: string,
  fileId:  string,
  token:   string,
): Promise<void> {
  const res = await fetch(`${baseURL}/api/ai/analyze-file`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ fileId }),
    signal:  AbortSignal.timeout(120_000),
  });
  // Une erreur d'analyse ne bloque pas la suite — l'IA peut être indisponible
  if (!res.ok) {
    console.warn(`[seed] analyzeFile ${fileId}: ${res.status} — ${await res.text()}`);
  }
}

// Mirrors Utils.normalizeName from the Java backend (strips same special chars).
// Note: Java does NOT collapse multiple spaces, but we do here for comparisons.
function normalizeName(name: string): string {
  return name
    .replace(/[/\\:;%$&^#£@?~,*+"<>|'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Crée un projet kitab (resource racine) ou récupère son ID s'il existe déjà.
 * Idempotent : gère le 406 "same name already exists".
 *
 * Stratégie pour le 406 :
 *   1. Tenter d'extraire l'ID depuis le corps de la réponse 406 (si le backend le retourne)
 *   2. Chercher dans la liste des projets ACTIFS (/api/kitab/project/all)
 *   3. Si toujours introuvable (projet en corbeille), chercher via globalSearch sur
 *      TOUTES les ressources, puis restaurer via restoreFromTrash si statut IN_TRASH
 */
async function getOrCreateProject(
  baseURL: string,
  name:    string,
  token:   string,
): Promise<string> {
  const createRes = await fetch(`${baseURL}/api/kitab/project/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ name, description: name }),
  });

  if (createRes.ok) {
    const body = await createRes.json() as Record<string, unknown>;
    return (body.id ?? body.resourceId) as string;
  }

  if (createRes.status === 406) {
    // 1. Try to extract the existing ID from the 406 body
    let body406: Record<string, unknown> = {};
    try { body406 = await createRes.json() as Record<string, unknown>; } catch { /* not JSON */ }
    const directId = body406?.id ?? body406?.resourceId ?? body406?.existingId;
    if (directId) return directId as string;

    const normalized = normalizeName(name);

    // 2. Check active projects (/api/kitab/project/all returns ACTIVE only)
    const listRes = await fetch(`${baseURL}/api/kitab/project/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (listRes.ok) {
      const projects = await listRes.json() as Array<{ id: string; name: string }>;
      const found = projects.find((p) => {
        if (!p.name) return false;
        const pNorm = normalizeName(p.name);
        return (
          p.name === name ||
          p.name === normalized ||
          p.name.toLowerCase() === name.toLowerCase() ||
          pNorm.toLowerCase() === normalized.toLowerCase()
        );
      });
      if (found) return found.id;
    }

    // 3. Fallback: globalSearch searches ALL resources regardless of status (includes IN_TRASH).
    // If the project was soft-deleted by clear-projects.sh, restore it.
    const searchRes = await fetch(`${baseURL}/api/kitab/globalSearch`, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain', Authorization: `Bearer ${token}` },
      body:    normalized,
    });
    if (searchRes.ok) {
      const results = await searchRes.json() as Array<{
        id: string; name: string; type: string; status?: string;
      }>;
      const project = results.find((r) => {
        if (r.type !== 'PROJECT') return false;
        const rNorm = normalizeName(r.name ?? '');
        return rNorm.toLowerCase() === normalized.toLowerCase();
      });
      if (project) {
        if (project.status === 'IN_TRASH') {
          console.log(`[seed] Restauration du projet en corbeille : ${project.id}`);
          const restoreRes = await fetch(`${baseURL}/api/kitab/${project.id}/restoreFromTrash`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!restoreRes.ok) {
            console.warn(`[seed] restoreFromTrash ${project.id}: ${restoreRes.status} — ${await restoreRes.text()}`);
          }
        }
        return project.id;
      }
    }

    throw new Error(
      `getOrCreateProject: projet "${name}" (normalisé: "${normalized}") introuvable après 406`,
    );
  }

  throw new Error(`getOrCreateProject "${name}": ${createRes.status} — ${await createRes.text()}`);
}

/**
 * Crée une source Connect de type "folder" pointant vers le fichier uploadé.
 * Idempotent : gère le 409 "already exists".
 */
async function createSource(
  baseURL:     string,
  name:        string,
  storagePath: string,
  projectId:   string,
  token:       string,
): Promise<string> {
  const res = await fetch(`${baseURL}/api/connect/source/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({
      name,
      type:       'folder',
      path:       storagePath,
      directLoad: true,
      agentId:    [],
      parent:     projectId,
    }),
  });

  if (res.status === 409) {
    try {
      const body = await res.json() as Record<string, unknown>;
      return (body.id ?? body.sourceId ?? body.existingId) as string;
    } catch {
      throw new Error('createSource 409 — impossible de récupérer le sourceId existant');
    }
  }
  if (!res.ok) throw new Error(`createSource: ${res.status} — ${await res.text()}`);
  const body = await res.json() as Record<string, unknown>;
  return (body.id ?? body.sourceId) as string;
}

async function createDashboard(
  baseURL:     string,
  name:        string,
  description: string,
  projectId:   string,
  token:       string,
): Promise<string> {
  const res = await fetch(`${baseURL}/api/kepler/dashboards/new`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ name, description, parent: projectId }),
  });
  if (!res.ok) throw new Error(`createDashboard: ${res.status} — ${await res.text()}`);
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
 * @param baseURL  - URL de base de la plateforme (ex: "http://localhost:8081")
 * @param industry - Définition du scénario (depuis scenario-factory.ts)
 * @param csvPath  - Chemin absolu vers le fichier CSV à uploader
 */
export async function seedScenario(
  baseURL:  string,
  industry: ScenarioIndustry,
  csvPath:  string,
): Promise<SeedResult> {
  const adminUser = process.env.TEST_USER     ?? 'platform-administrator';
  const adminPass = process.env.TEST_PASSWORD ?? '';

  console.log(`[seed] Scénario "${industry.label}" — début du seed`);

  // 1. Auth admin
  const token = await adminToken(baseURL, adminUser, adminPass);

  // 2. Upload CSV
  console.log(`[seed] Upload CSV : ${path.basename(csvPath)}`);
  const { fileId, storagePath } = await uploadCsv(baseURL, csvPath, token);
  console.log(`[seed] fileId = ${fileId}, storagePath = ${storagePath}`);

  // 3. Analyse IA (best effort)
  console.log(`[seed] Analyse IA du fichier...`);
  await analyzeFile(baseURL, fileId, token);

  // 4. Projet kitab (resource parent)
  const projectName = `Scénario ${industry.label}`;
  console.log(`[seed] Projet : "${projectName}"`);
  const projectId = await getOrCreateProject(baseURL, projectName, token);
  console.log(`[seed] projectId = ${projectId}`);

  // 5. Source Connect
  const sourceName = `Scénario ${industry.label}`;
  console.log(`[seed] Création source : "${sourceName}"`);
  const sourceId = await createSource(baseURL, sourceName, storagePath, projectId, token);
  console.log(`[seed] sourceId = ${sourceId}`);

  // 6. Dashboard KPI
  const dashName = `KPI ${industry.label}`;
  console.log(`[seed] Création dashboard : "${dashName}"`);
  const dashboardId = await createDashboard(
    baseURL, dashName, `Tableau de bord ${industry.label}`, projectId, token,
  );
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
