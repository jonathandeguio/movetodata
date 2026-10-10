import axios, { AxiosResponse } from "axios";

/**
 *  send  a  call to zoro service to changeNameOrType
 * @param datasetId Dataset Id
 * @param branch Branch
 * @param table table Payload
 */
export const changeColumnNameOrTypeAPI = (
  datasetId: string,
  branch: string,
  transcationId: string,
  tablePayload: any
): Promise<AxiosResponse<any, any>> => {
  return axios.post(
    `/dataset/schema/${datasetId}/${branch}/${transcationId}/rename`,
    tablePayload
  );
};

/**
 *  re-Uploads the current Dataset
 * @param datasetId Dataset Id
 * @param branch Branch
 */
export const reUploadDatasetAPI = (
  datasetId: string,
  branch: string
): Promise<AxiosResponse<any, any>> => {
  return axios.get(`/dataset/deleteCSV/${datasetId}/${branch}`);
};

/**
 *  get Dataset type Api
 * @param datasetId Dataset Id
 * @param branch Branch
 * @param table table Payload
 */
export const getDatasetTypeAPI = (
  datasetId: string,
  branch: string,
  transcationId: string
): Promise<AxiosResponse<any, any>> => {
  return axios.get(
    `/kitab/dataset/${datasetId}/${branch}/${transcationId}/type`
  );
};
