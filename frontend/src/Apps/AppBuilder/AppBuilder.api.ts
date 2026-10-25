import axios, { AxiosResponse } from 'axios';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  showInList: boolean;
  options?: string[];
}

export interface AppDefinition {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  fieldsJson: string;
  icon?: string;
  resourceUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const listAppsAPI = (): Promise<AxiosResponse<AppDefinition[]>> =>
  axios.get('/api/apps');

export const getAppAPI = (uuid: string): Promise<AxiosResponse<AppDefinition>> =>
  axios.get(`/api/apps/${uuid}`);

export const createAppAPI = (data: Partial<AppDefinition>): Promise<AxiosResponse<AppDefinition>> =>
  axios.post('/api/apps', data);

export const updateAppAPI = (uuid: string, data: Partial<AppDefinition>): Promise<AxiosResponse<AppDefinition>> =>
  axios.put(`/api/apps/${uuid}`, data);

export const deleteAppAPI = (uuid: string): Promise<AxiosResponse<void>> =>
  axios.delete(`/api/apps/${uuid}`);
