/**
 * aiService.ts — API calls for the MoveToData AI features.
 *
 * All calls are proxied through Boson (/api/ai/**) which forwards them to
 * the movetodata-ai Python service. No direct browser-to-Python calls are
 * made; authentication is handled by the Boson proxy.
 *
 * Sovereignty note: no data leaves the MoveToData infrastructure — the Boson
 * proxy validates ownership and the Python service calls a self-hosted Ollama
 * instance (qwen2.5-coder:7b for SQL generation).
 */

import axios, { AxiosResponse } from "axios";

// ---------------------------------------------------------------------------
// F1 — Text-to-SQL types
// ---------------------------------------------------------------------------

export interface TextToSqlRequest {
  /** Dataset resource UUID. */
  datasetId: string;
  /** Branch name (defaults to "master"). */
  branch: string;
  /** User question in French or English. */
  question: string;
}

export interface TextToSqlResponse {
  /** The generated SQL SELECT query. */
  sql: string;
  /**
   * Heuristic confidence score (0.0 – 1.0).
   *  >= 0.8  → high (green)
   *  >= 0.6  → medium (orange)
   *   < 0.6  → low (red, warning shown)
   */
  confidence: number;
  /** LLM model used for generation (e.g. "qwen2.5-coder:7b"). */
  model: string;
  /** Approximate number of prompt tokens consumed. */
  tokensUsed: number;
  /**
   * UUID of the JDBC source — returned by Boson so the client can call
   * previewSourceAPI without an extra lookup.
   */
  sourceId: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Call the Text-to-SQL endpoint.
 *
 * Sends the datasetId + branch + question to Boson, which introspects the
 * source schema, calls the LLM, validates the SQL, and returns the result.
 */
export const textToSqlAPI = (
  request: TextToSqlRequest
): Promise<AxiosResponse<TextToSqlResponse>> => {
  return axios.post("/api/ai/text-to-sql", request);
};

// ---------------------------------------------------------------------------
// F2 — Augmented Analytics types
// ---------------------------------------------------------------------------

/** Analytics computation type. */
export type InsightsType = "anomaly" | "forecast" | "cluster" | "summary";

export interface InsightsOptions {
  /** Number of periods to forecast (days). Default: 30. */
  forecast_horizon?: number;
  /** Number of clusters for K-Means. null = auto via elbow method. */
  cluster_k?: number | null;
  /** Fraction of expected anomalies (0.01–0.50). Default: 0.05. */
  anomaly_contamination?: number;
}

export interface InsightsRequest {
  /** Dataset resource UUID. */
  datasetId: string;
  /** Branch name (defaults to "master"). */
  branch: string;
  /** Name of the X-axis column (date or numeric). */
  columnX: string;
  /** Name of the metric / Y-axis column (must be numeric). */
  columnY: string;
  /** Analytics type to run. */
  type: InsightsType;
  /** Optional computation parameters. */
  options?: InsightsOptions;
}

// --- Per-type result shapes ---

export interface AnomalyResult {
  row_index: number;
  x_value: string | number;
  y_value: number;
  /** Normalised anomaly score [0, 1]. 1 = most anomalous. */
  score: number;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lower_80: number;
  upper_80: number;
}

export interface ClusterPoint {
  row_index: number;
  x_value: string | number;
  y_value: number;
  cluster: number;
}

export interface SummaryResult {
  text: string;
}

export interface InsightsResponse {
  type: InsightsType;
  /** Typed differently per InsightsType — cast as needed. */
  results: AnomalyResult[] | ForecastPoint[] | ClusterPoint[] | SummaryResult[];
  /** Model / library used, e.g. "IsolationForest (scikit-learn)". */
  model: string;
  /** Number of rows actually processed (after truncation). */
  row_count: number;
  /** Non-fatal warning (e.g. data truncation notice). */
  warning: string | null;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// F3 — Chat types (SSE streaming is handled directly in AiAssistantSidebar
// via fetch() + ReadableStream; these types document the wire format)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatHistoryMessage extends ChatMessage {
  id: number;
  sessionUuid: string;
  model: string | null;
  tokensUsed: number | null;
  createdAt: string;
}

export interface ChatSseTokenEvent {
  type: "token";
  content: string;
}

export interface ChatSseDoneEvent {
  type: "done";
  model: string;
  tokens_used: number;
}

export interface ChatSseErrorEvent {
  type: "error";
  error: string;
}

export type ChatSseEvent = ChatSseTokenEvent | ChatSseDoneEvent | ChatSseErrorEvent;

// ---------------------------------------------------------------------------
// F4 — Smart Connector types
// ---------------------------------------------------------------------------

export interface QualityScore {
  global: number | null;
  completeness: number | null;
  uniqueness: number | null;
  consistency: number | null;
  outlier_ratio: number | null;
}

export type ColumnSemanticType =
  | "time_series"
  | "numeric"
  | "categorical"
  | "geographic"
  | "boolean"
  | "text";

export interface ChartSuggestion {
  chartType: "line" | "bar" | "scatter" | "pie" | "histogram" | "map";
  columnX: string;
  columnY: string | null;
  title: string;
  reason: string;
}

export interface SmartConnectorResponse {
  quality_score: QualityScore;
  detected_types: Record<string, ColumnSemanticType>;
  chart_suggestions: ChartSuggestion[];
  analyzed_at: string;
  model: string;
  sample_size: number;
  error?: string;
}

/** Cached quality score stored in ai_source_quality (Java entity shape). */
export interface AiSourceQuality {
  id: number;
  sourceId: string;
  globalScore: number | null;
  completeness: number | null;
  uniqueness: number | null;
  consistency: number | null;
  outlierRatio: number | null;
  detectedTypes: Record<string, ColumnSemanticType> | null;
  chartSuggestions: ChartSuggestion[] | null;
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// F6 — AI Import Panel types
// ---------------------------------------------------------------------------

export interface DescribeDatasetRequest {
  /** Original file name (used to suggest a dataset name). */
  fileName: string;
  /** Column headers extracted from the file. */
  columns: string[];
  /** First rows of data (up to 200) as arrays of strings. */
  sampleRows: string[][];
}

export interface DescribeDatasetResponse {
  /** Suggested human-readable dataset name. */
  name: string;
  /** Auto-generated French description of the dataset. */
  description: string;
  /** Suggested tags (e.g. "financier", "géo", "RH"). */
  tags: string[];
}

/**
 * POST /api/ai/describe-dataset
 * Generates a name, description and tags from column headers and a data sample.
 * The request body is processed by the movetodata-ai Python service (self-hosted).
 * No external AI provider is called — all processing happens within the infrastructure.
 */
export const describeDatasetAPI = (
  request: DescribeDatasetRequest
): Promise<import("axios").AxiosResponse<DescribeDatasetResponse>> => {
  return axios.post("/api/ai/describe-dataset", request);
};

// ---------------------------------------------------------------------------

/**
 * POST /api/ai/smart-connector/analyze
 * Triggers analysis of a source: quality score + type detection + chart suggestions.
 */
export const analyzeSourceAPI = (
  sourceId: string
): Promise<import("axios").AxiosResponse<SmartConnectorResponse>> => {
  return axios.post("/api/ai/smart-connector/analyze", { sourceId });
};

/**
 * GET /api/ai/smart-connector/score/{sourceId}
 * Returns the cached quality analysis for a source (404 if not yet analysed).
 */
export const getSourceQualityAPI = (
  sourceId: string
): Promise<import("axios").AxiosResponse<AiSourceQuality>> => {
  return axios.get(`/api/ai/smart-connector/score/${sourceId}`);
};

/**
 * POST /api/ai/smart-connector/scores/batch
 * Batch fetch quality scores for multiple sources.
 * Used by the Connect source list badge (one call instead of N).
 */
export const getSourceQualitiesBatchAPI = (
  sourceIds: string[]
): Promise<import("axios").AxiosResponse<AiSourceQuality[]>> => {
  return axios.post("/api/ai/smart-connector/scores/batch", { sourceIds });
};

// ---------------------------------------------------------------------------

/**
 * DELETE /api/ai/chat/session/{sessionId}
 * Soft-deletes a chat session and all its messages.
 */
export const deleteChatSessionAPI = (sessionId: string): Promise<void> => {
  return axios.delete(`/api/ai/chat/session/${sessionId}`);
};

/**
 * GET /api/ai/chat/history
 * Retrieve message history for a chat session.
 */
export const getChatHistoryAPI = (
  sessionId: string,
  limit = 50
): Promise<import("axios").AxiosResponse<ChatHistoryMessage[]>> => {
  return axios.get("/api/ai/chat/history", { params: { sessionId, limit } });
};

// ---------------------------------------------------------------------------
// Augmented Analytics API calls
// ---------------------------------------------------------------------------

/**
 * Call the Augmented Analytics endpoint.
 *
 * Boson fetches the data from the JDBC source and forwards it — together with
 * the analytics parameters — to the movetodata-ai Python service.
 * No raw data is ever sent through the browser.
 */
export const insightsAPI = (
  request: InsightsRequest
): Promise<AxiosResponse<InsightsResponse>> => {
  return axios.post("/api/ai/insights", request);
};
