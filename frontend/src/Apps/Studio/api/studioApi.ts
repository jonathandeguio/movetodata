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

export const listSources = (): Promise<SourceItem[]> =>
  axios.get<SourceItem[]>('/connect/source/Getall').then((r) => r.data);
