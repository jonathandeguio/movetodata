import axios from 'axios';

export interface AppListItem {
  id: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED';
  datasourceId: string;
  nodeCount: number;
  updatedAt: string;
}

export interface DraftResponse {
  id: string;
  appId: string;
  version: number;
  definition: string;
  createdAt: string;
}

export interface SourceItem {
  id: string;
  name: string;
  type: string;
}

export const listApps = (q?: string): Promise<AppListItem[]> =>
  axios
    .get<AppListItem[]>('/api/studio/apps', { params: q ? { q } : undefined })
    .then((r) => r.data);

export const createApp = (req: {
  name: string;
  datasourceId: string;
  definition?: string;
}): Promise<{ id: string }> =>
  axios.post<{ id: string }>('/api/studio/apps', req).then((r) => r.data);

export const deleteApp = (id: string): Promise<void> =>
  axios.delete(`/api/studio/apps/${id}`).then(() => undefined);

export const getDraft = (id: string): Promise<DraftResponse> =>
  axios.get<DraftResponse>(`/api/studio/apps/${id}/draft`).then((r) => r.data);

export const publishApp = (id: string): Promise<void> =>
  axios.post(`/api/studio/apps/${id}/publish`).then(() => undefined);

export const saveDraft = (
  id: string,
  definition: string,
  expectedVersion: number,
): Promise<DraftResponse> =>
  axios
    .put<DraftResponse>(`/api/studio/apps/${id}/draft`, { definition, expectedVersion })
    .then((r) => r.data);

export const listSources = (): Promise<SourceItem[]> =>
  axios.get<SourceItem[]>('/connect/source/Getall').then((r) => r.data);

export interface QueryRunResponse {
  rows: unknown[];
  rowsAffected: number;
  durationMs: number;
}

/**
 * Exécute une requête d'une application Studio côté serveur.
 * Le front n'envoie JAMAIS de SQL — seulement queryId + params (SPEC §6).
 */
export const runQuery = (
  appId: string,
  queryId: string,
  params: Record<string, unknown>,
  mode: 'draft' | 'published',
): Promise<QueryRunResponse> =>
  axios
    .post<QueryRunResponse>(`/api/studio/apps/${appId}/queries/${queryId}/run`, {
      params,
      mode,
    })
    .then((r) => r.data);

// ---------------------------------------------------------------------------
// Assistant IA
// ---------------------------------------------------------------------------

export interface AiChatResponse {
  explanation: string;
  /** PatchOp[] sérialisés — à dispatcher via applyOps() */
  patch: Record<string, unknown>[];
}

export const sendAiMessage = (
  appId: string,
  prompt: string,
  selectedNodeId?: string | null,
): Promise<AiChatResponse> =>
  axios
    .post<AiChatResponse>(`/api/studio/apps/${appId}/ai`, {
      prompt,
      selectedNodeId: selectedNodeId ?? undefined,
    })
    .then((r) => r.data);

export interface GenerateAppRequest {
  name: string;
  description: string;
  datasourceId: string;
  tableName: string;
}

export const generateApp = (req: GenerateAppRequest): Promise<DraftResponse> =>
  axios.post<DraftResponse>('/api/studio/apps/generate', req).then((r) => r.data);

/**
 * Récupère la version publiée d'une application (runtime).
 * Renvoie la même structure que DraftResponse.
 */
export const getPublished = (id: string): Promise<DraftResponse> =>
  axios.get<DraftResponse>(`/api/studio/apps/${id}/published`).then((r) => r.data);
