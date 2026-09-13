import { ResourceType } from "Apps/explorer/explorer.utils";
import axios, { AxiosResponse } from "axios";

/**
 * ping
 * @param path path we are calling ping from
 */
export const ping = (path: string): Promise<AxiosResponse<any, any>> => {
  return axios.post("/ping", { path });
};

/**
 * Get Connect Admin
 */
export const getIsConnectAdmin = (): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/api/passport/users/isConnectAdministrator`);
};

/**
 * Get Resource Permission for current user
 */
export const getResourcePermissionAPI = (
  resourceId: string
): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/api/passport/authz/resourcePermission/${resourceId}`);
};

/**
 * Creates a new folder in backend
 */
export const createFolderApi = (folder: {
  name: string;
  description: string;
  parent: string;
  type: ResourceType;
}) => {
  return axios.post(`/kitab/explorer/folder`, JSON.stringify(folder));
};
