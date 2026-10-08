import axios, { AxiosResponse } from "axios";
import { isDefined } from "utils/utilities";

/**
 * projectStructure
 * @param id project id
 */
export const getProjectStructure = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/kitab/explorer/projectRoot/${id}`);
};

/**
 * gets resource
 * @param id project id
 */
export const getResourceApi = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/kitab/explorer/resource/${id}`);
};

/**
 * gets resource
 * @param id project id
 */
export const getResourceApi2 = (props: {
  id: string;
}): Promise<AxiosResponse<any, any>> => {
  if (isDefined(props.id)) {
    return axios.get(`/kitab/explorer/resource/${props.id}`);
  }
  throw "Bad request undefined Id";
};

/**
 * updates resource
 * @param id project id
 */
export const putResource = (
  id: string,
  payload: { name?: string; description?: string; parent?: string }
): Promise<AxiosResponse<any, any>> => {
  return axios.put(`/kitab/explorer/resource/${id}`, payload);
};

/**
 * move resource
 * @param id project id
 */
export const moveResource = (
  resourceId: string,
  moveToId: string
): Promise<AxiosResponse<any, any>> => {
  // Update resource parent
  return axios.put(`/kitab/explorer/resource/${resourceId}`, {
    parent: moveToId,
  });
};

/**
 * Adds to favourites
 */
export const addToFavouritesApi = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.post(`/kitab/explorer/favourites/${id}`);
};

/**
 * Adds to favourites
 */
export const removeFromFavouritesApi = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.delete(`/kitab/explorer/favourites/${id}`);
};

/**
 * Get favourites
 */
export const getFavourites = (): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/kitab/explorer/favourites`);
};

/**
 * Get Created By you
 */
export const getCreatedByYou = (
  page: number,
  pageSize: number
): Promise<AxiosResponse<any, any>> => {
  return axios.get(
    `/kitab/explorer/createdByYou?page=${page}&elementPerPage=${pageSize}&direction=dsc&key=createdAt`
  );
};

/**
 * Get Updated By you
 */
export const getUpdatedByYou = (
  page: number,
  pageSize: number
): Promise<AxiosResponse<any, any>> => {
  return axios.get(
    `/kitab/explorer/updatedByYou?page=${page}&elementPerPage=${pageSize}&direction=dsc&key=updatedAt`
  );
};

/**
 * Get recentlyViewed
 */
export const getRecentlyViewed = (): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/kitab/explorer/recent`);
};

/**
 * Get Recycle Bin
 */
export const getRecycleBin = (id: string): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/kitab/explorer/trash/${id}`);
};

/**
 * Delete a resource
 */
export const deleteResourceApi = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.post(`/kitab/explorer/trash/${id}`);
};

/**
 * Delete a resource
 */
export const restoreResourceApi = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.delete(`/kitab/explorer/trash/${id}`);
};

/**
 * getBuildSpec
 */
export const getBuildSpecAPI = (
  id: string,
  branch: string,
  transcationId: string
): Promise<AxiosResponse<any, any>> => {
  return axios.get(
    `/kitab/dataset/${id}/${branch}/${transcationId}/buildSpecification`
  );
};

/**
 * getBuildSpec
 */
export const permanentDelete = (
  id: string
): Promise<AxiosResponse<any, any>> => {
  return axios.delete(`/kitab/explorer/permanentDelete/${id}`);
};
