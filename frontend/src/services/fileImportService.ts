/**
 * fileImportService.ts — API calls for F5 (File Import & AI Analysis).
 *
 * All calls go through the Boson proxy:
 *   POST /api/files/upload       — multipart upload
 *   GET  /api/files/{id}         — file metadata
 *   GET  /api/files/{id}/sheets  — Excel sheet names
 *   POST /api/ai/analyze-file    — AI analysis (delegated to movetodata-ai)
 *   POST /api/connect/source/create — create a FILE source in Connect
 */

import axios, { AxiosResponse } from "axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadedFileDto {
  fileId: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  sheetName: string | null;
  uploadedAt: string;
}

export interface FileStats {
  rows: number;
  columns: number;
  missingByColumn: Record<string, number>;
  duplicates: number;
  detectedTypes: Record<string, "time_series" | "numeric" | "categorical" | "boolean">;
  topCorrelations: Array<{ col1: string; col2: string; r: number }>;
  sampleStats: Record<
    string,
    { min: number; max: number; mean: number; std: number; p25: number; p75: number }
  >;
}

export interface Recommendation {
  action: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface ChartSuggestion {
  chartType: string;
  columnX: string;
  columnY?: string;
  title: string;
}

export interface AnalyzeFileResponse {
  fileId: string;
  filename: string;
  stats: FileStats;
  summary: string;
  recommendations: Recommendation[];
  chartSuggestions: ChartSuggestion[];
  model: string;
}

export interface CreateSourceFromFileRequest {
  fileId: string;
  sourceName: string;
  sheet?: string;
}

export interface CreateSourceResponse {
  sourceId: string;
  sourceName: string;
  type: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Upload a file to Boson storage.
 * Returns file metadata including the fileId to use for subsequent calls.
 */
export const uploadFileAPI = (
  file: File,
  onUploadProgress?: (progressEvent: any) => void
): Promise<AxiosResponse<UploadedFileDto>> => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post("/api/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
};

/**
 * Retrieve metadata for an uploaded file.
 */
export const getFileMetadataAPI = (
  fileId: string
): Promise<AxiosResponse<UploadedFileDto>> => {
  return axios.get(`/api/files/${fileId}`);
};

/**
 * List Excel sheet names for a given fileId.
 * Returns an empty array for non-Excel files.
 */
export const getFileSheetsAPI = (
  fileId: string
): Promise<AxiosResponse<string[]>> => {
  return axios.get(`/api/files/${fileId}/sheets`);
};

/**
 * Trigger AI analysis for an uploaded file.
 * The analysis runs in the movetodata-ai Python service (proxied by Boson).
 */
export const analyzeFileAPI = (
  fileId: string,
  sheet?: string
): Promise<AxiosResponse<AnalyzeFileResponse>> => {
  return axios.post("/api/ai/analyze-file", { fileId, sheet: sheet || null });
};

/**
 * Create a Connect source of type FILE from an uploaded file.
 */
export const createSourceFromFileAPI = (
  payload: CreateSourceFromFileRequest
): Promise<AxiosResponse<CreateSourceResponse>> => {
  return axios.post("/api/sources/from-file", payload);
};
