/**
 * catalogService.ts — Boson native Data Catalog API integration.
 *
 * Uses the global axios instance (configured in axiosInterceptors.ts) which
 * injects the MoveToData Bearer token and targets REACT_APP_BASE_URL_API
 * (Boson). No dedicated OpenMetadata client is needed.
 *
 * Sovereignty note: all calls target the self-hosted Boson service.
 * No data leaves the European infrastructure.
 */

import axios from "axios";

// ---------------------------------------------------------------------------
// Types — Boson native catalog format
// ---------------------------------------------------------------------------

export interface CatalogDataProduct {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  /** SOURCE_ALIGNED | AGGREGATE | CONSUMER_ALIGNED */
  dataProductType?: string;
  /** PUBLIC | INTERNAL | RESTRICTED */
  accessPolicy?: "PUBLIC" | "INTERNAL" | "RESTRICTED";
  /** BRONZE | SILVER | GOLD */
  qualityLevel?: "BRONZE" | "SILVER" | "GOLD";
  trustScore?: number;
  domainId?: string;
  ownerId?: string;
  /** Nombre de consultations cumulées (catalog_data_product.view_count). */
  viewCount?: number;
  /** JSON-encoded string of use-case descriptions */
  useCases?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogDomain {
  id: string;
  name: string;
  description?: string;
  color?: string;
  /** UUID du Data Owner */
  ownerId?: string;
  /** Nom résolu du Data Owner */
  ownerName?: string;
  /** UUID du Data Steward */
  stewardId?: string;
  /** Nom résolu du Data Steward */
  stewardName?: string;
  /** PUBLIC | INTERNAL | RESTRICTED */
  defaultAccessPolicy?: string;
  /** Nombre de Data Products associés */
  dataProductCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogDataProductPage {
  content: CatalogDataProduct[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

export interface CatalogCertifyRequest {
  qualityLevel: "BRONZE" | "SILVER" | "GOLD";
  comment?: string;
}

// ---------------------------------------------------------------------------
// Lineage types (legacy — kept for backward compat)
// ---------------------------------------------------------------------------

export interface LineageEntityRef {
  id: string;
  name: string;
  type: string; // "dataProduct" | "dataset" | "pipeline"
}

export interface LineageEdge {
  fromEntity: LineageEntityRef;
  toEntity: LineageEntityRef;
}

export interface LineageData {
  entity: LineageEntityRef;
  upstreamEdges: LineageEdge[];
  downstreamEdges: LineageEdge[];
}

// ---------------------------------------------------------------------------
// Lineage types — Lot 5 (enriched graph)
// ---------------------------------------------------------------------------

export interface LineageGraphNode {
  id: string;
  name: string;
  /** DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD */
  type: string;
  qualityLevel?: string;
  isFocus: boolean;
  engine?: string;
  lastRunAt?: string;
  durationMs?: number;
  inputRows?: number;
  outputRows?: number;
  inputIds: string[];
  outputIds: string[];
}

export interface LineageGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  /** true when this edge is directly connected to the focus DataProduct node */
  isOnFocusPath: boolean;
}

export interface LineageGraph {
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
  /** ID of the focus DataProduct node */
  focusNodeId: string;
}

// ---------------------------------------------------------------------------
// Column / GDPR types
// ---------------------------------------------------------------------------

export interface DataProductColumn {
  columnName: string;
  description?: string;
  piiType?: string;   // null | "PII.Sensitive" | "GDPR.Sensitive" | "GDPR.ID"
  retentionDays?: number;
  datasetId?: string;
  branch?: string;
  glossaryTermId?: string;
}

// ---------------------------------------------------------------------------
// Backward-compatible alias (used by existing page components)
// ---------------------------------------------------------------------------

/** Legacy OpenMetadata column shape — kept for DataProduct backward compat. */
interface LegacyColumn {
  name: string;
  tags?: Array<{ tagFQN: string }>;
}

/** @deprecated Use CatalogDataProduct instead. Kept for page-component compatibility. */
export type DataProduct = CatalogDataProduct & {
  /** Alias for `name` — some page components still reference fqn. */
  fqn?: string;
  /** Source de la description : 'manual' | 'ai' | 'imported'. */
  descriptionSource?: 'manual' | 'ai' | 'imported';
  /** Si la politique d'accès est héritée du domaine parent. */
  policyInherited?: boolean;
  /** Legacy OpenMetadata optional fields — may be absent from Boson responses. */
  columns?: LegacyColumn[];
  domain?: { name: string };
  owners?: Array<{ name: string }>;
  tags?: Array<{ tagFQN: string }>;
  extension?: { qualityLevel?: string; dataController?: string };
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Full-text / keyword search across Data Products.
 * GET /api/catalog/data-products?q={query}
 */
export async function searchDataProducts(
  query: string,
  limit = 20,
  offset = 0
): Promise<CatalogDataProduct[]> {
  const response = await axios.get<CatalogDataProduct[] | CatalogDataProductPage>(
    "/api/catalog/data-products",
    {
      params: { q: query, limit, offset },
    }
  );
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  }
  return (data as CatalogDataProductPage).content ?? [];
}

/**
 * Fetch the paginated list of all Data Products.
 * GET /api/catalog/data-products
 */
export async function listDataProducts(
  limit = 20,
  offset = 0
): Promise<CatalogDataProduct[]> {
  const response = await axios.get<CatalogDataProduct[] | CatalogDataProductPage>(
    "/api/catalog/data-products",
    {
      params: { limit, offset },
    }
  );
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  }
  return (data as CatalogDataProductPage).content ?? [];
}

/**
 * Fetch a single Data Product by its name (slug).
 * GET /api/catalog/data-products/{name}
 */
export async function getDataProduct(name: string): Promise<CatalogDataProduct> {
  const response = await axios.get<CatalogDataProduct>(
    `/api/catalog/data-products/${encodeURIComponent(name)}`
  );
  return response.data;
}

/**
 * Create a new Data Product.
 * POST /api/catalog/data-products
 */
export async function createDataProduct(
  payload: Omit<CatalogDataProduct, "id" | "createdAt" | "updatedAt">
): Promise<CatalogDataProduct> {
  const response = await axios.post<CatalogDataProduct>(
    "/api/catalog/data-products",
    payload
  );
  return response.data;
}

/**
 * Update an existing Data Product.
 * PUT /api/catalog/data-products/{name}
 */
export async function updateDataProduct(
  name: string,
  payload: Partial<Omit<CatalogDataProduct, "id" | "createdAt" | "updatedAt">>
): Promise<CatalogDataProduct> {
  const response = await axios.put<CatalogDataProduct>(
    `/api/catalog/data-products/${encodeURIComponent(name)}`,
    payload
  );
  return response.data;
}

/**
 * Promote the certification (quality) level of a Data Product.
 * POST /api/catalog/data-products/{name}/certify
 */
export async function certifyDataProduct(
  name: string,
  level: "BRONZE" | "SILVER" | "GOLD",
  comment?: string
): Promise<CatalogDataProduct> {
  const body: CatalogCertifyRequest = { qualityLevel: level };
  if (comment) {
    body.comment = comment;
  }
  const response = await axios.post<CatalogDataProduct>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/certify`,
    body
  );
  return response.data;
}

/**
 * Fetch all catalog domains (enriched: ownerName, stewardName, dataProductCount).
 * GET /api/catalog/domains
 */
export async function listDomains(): Promise<CatalogDomain[]> {
  const response = await axios.get<CatalogDomain[]>("/api/catalog/domains");
  return response.data;
}

export async function createDomain(
  payload: Pick<CatalogDomain, "name" | "description" | "color" | "ownerId" | "stewardId" | "defaultAccessPolicy">
): Promise<CatalogDomain> {
  const response = await axios.post<CatalogDomain>("/api/catalog/domains", payload);
  return response.data;
}

export async function updateDomain(
  name: string,
  payload: Partial<CatalogDomain>
): Promise<CatalogDomain> {
  const response = await axios.put<CatalogDomain>(
    `/api/catalog/domains/${encodeURIComponent(name)}`,
    payload
  );
  return response.data;
}

export async function deleteDomain(name: string): Promise<void> {
  await axios.delete(`/api/catalog/domains/${encodeURIComponent(name)}`);
}

/**
 * GET /api/catalog/lineage/{id}
 * @deprecated Use getLineageGraph instead.
 */
export async function getLineage(id: string): Promise<LineageData> {
  const response = await axios.get<LineageData>(`/api/catalog/lineage/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * GET /api/catalog/lineage/{name}?depthUpstream=N&depthDownstream=N
 * Returns the enriched lineage graph (Lot 5).
 */
export async function getLineageGraph(
  name: string,
  depthUpstream = 2,
  depthDownstream = 2
): Promise<LineageGraph> {
  const response = await axios.get<LineageGraph>(
    `/api/catalog/lineage/${encodeURIComponent(name)}`,
    { params: { depthUpstream, depthDownstream } }
  );
  return response.data;
}

/**
 * GET /api/catalog/data-products/{name}/columns
 */
export async function getDataProductColumns(name: string): Promise<DataProductColumn[]> {
  const response = await axios.get<DataProductColumn[]>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/columns`
  );
  return response.data;
}

/**
 * PATCH /api/catalog/data-products/{name}/columns/{columnName}
 * Alias: addPiiTag (backward compat with CatalogDataProduct.tsx)
 */
export async function updateColumnMeta(
  name: string,
  columnName: string,
  meta: Partial<DataProductColumn>
): Promise<DataProductColumn> {
  const response = await axios.patch<DataProductColumn>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/columns/${encodeURIComponent(columnName)}`,
    meta
  );
  return response.data;
}

/** @deprecated Use updateColumnMeta instead */
export async function addPiiTag(
  fqn: string,
  columnName: string,
  tagFqn: string
): Promise<void> {
  await updateColumnMeta(fqn, columnName, { piiType: tagFqn });
}

// ---------------------------------------------------------------------------
// Quality rules (Phase 4)
// ---------------------------------------------------------------------------

export interface CatalogQualityRule {
  id: string;
  dataProductId: string;
  columnName?: string;
  /** NOT_NULL | RANGE | REGEX | UNIQUENESS | CUSTOM */
  ruleType: string;
  expression: string;
  enabled: boolean;
  createdAt?: string;
}

export interface CreateQualityRuleRequest {
  ruleType: string;
  expression: string;
  columnName?: string;
}

export async function listQualityRules(name: string): Promise<CatalogQualityRule[]> {
  const response = await axios.get<CatalogQualityRule[]>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/quality-rules`
  );
  return response.data;
}

export async function createQualityRule(
  name: string,
  payload: CreateQualityRuleRequest
): Promise<CatalogQualityRule> {
  const response = await axios.post<CatalogQualityRule>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/quality-rules`,
    payload
  );
  return response.data;
}

export async function deleteQualityRule(name: string, ruleId: string): Promise<void> {
  await axios.delete(
    `/api/catalog/data-products/${encodeURIComponent(name)}/quality-rules/${encodeURIComponent(ruleId)}`
  );
}

// ---------------------------------------------------------------------------
// Dataset stats + drift detection (Phase 4)
// ---------------------------------------------------------------------------

export interface CatalogDatasetStats {
  id: string;
  dataProductId: string;
  recordCount: number;
  columnStats?: string;
  driftScore?: number;
  driftAlert: boolean;
  measuredAt: string;
}

export async function listDatasetStats(name: string): Promise<CatalogDatasetStats[]> {
  const response = await axios.get<CatalogDatasetStats[]>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/stats`
  );
  return response.data;
}

export async function recordDatasetStats(
  name: string,
  recordCount: number,
  columnStats?: string
): Promise<CatalogDatasetStats> {
  const response = await axios.post<CatalogDatasetStats>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/stats`,
    { recordCount, columnStats }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// View tracking (Phase 5)
// ---------------------------------------------------------------------------

export async function recordProductView(name: string): Promise<void> {
  await axios.post(
    `/api/catalog/data-products/${encodeURIComponent(name)}/view`
  );
}

// ---------------------------------------------------------------------------
// Glossaire métier (Phase 5)
// ---------------------------------------------------------------------------

export interface CatalogGlossaryTerm {
  id: string;
  term: string;
  definition: string;
  domain?: string;
  synonyms?: string;
  viewCount?: number;
  linkedDataProducts?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export async function listGlossaryTerms(domain?: string): Promise<CatalogGlossaryTerm[]> {
  const response = await axios.get<CatalogGlossaryTerm[]>("/api/catalog/glossary", {
    params: domain ? { domain } : {},
  });
  return response.data;
}

export async function createGlossaryTerm(
  payload: Pick<CatalogGlossaryTerm, "term" | "definition" | "domain" | "synonyms">
): Promise<CatalogGlossaryTerm> {
  const response = await axios.post<CatalogGlossaryTerm>("/api/catalog/glossary", payload);
  return response.data;
}

export async function updateGlossaryTerm(
  id: string,
  payload: Partial<CatalogGlossaryTerm>
): Promise<CatalogGlossaryTerm> {
  const response = await axios.put<CatalogGlossaryTerm>(
    `/api/catalog/glossary/${encodeURIComponent(id)}`,
    payload
  );
  return response.data;
}

export async function deleteGlossaryTerm(id: string): Promise<void> {
  await axios.delete(`/api/catalog/glossary/${encodeURIComponent(id)}`);
}

export async function linkGlossaryToDataProduct(
  termId: string,
  dataProductName: string
): Promise<void> {
  await axios.post(`/api/catalog/glossary/${encodeURIComponent(termId)}/link-data-product`, {
    dataProductName,
  });
}

export async function unlinkGlossaryFromDataProduct(
  termId: string,
  dataProductName: string
): Promise<void> {
  await axios.delete(
    `/api/catalog/glossary/${encodeURIComponent(termId)}/link-data-product/${encodeURIComponent(dataProductName)}`
  );
}

// ---------------------------------------------------------------------------
// Export DataProduct (Phase 6)
// ---------------------------------------------------------------------------

export interface DataProductExport {
  dataProduct: CatalogDataProduct;
  columns: DataProductColumn[];
  qualityRules: unknown[];
  stats: unknown[];
  certifications: unknown[];
  exportedAt: string;
}

export async function exportDataProduct(name: string): Promise<DataProductExport> {
  const response = await axios.get<DataProductExport>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/export`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Catalog Health Metrics (Phase 7)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Catalog Health — dépendances système (Lot 3)
// ---------------------------------------------------------------------------

export type DependencyStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';

export interface DependencyInfo {
  status: DependencyStatus;
  responseTimeMs?: number;
  model?: string;
}

export interface JobStatusInfo {
  status: 'OK' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
  lastRun: string | null;
  alertCount: number;
}

export interface CatalogHealthDependencies {
  database: DependencyInfo;
  opensearch: DependencyInfo;
  llm: DependencyInfo;
  trustScoreJob: JobStatusInfo;
}

export interface CatalogHealthMetrics {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  dependencies: CatalogHealthDependencies;
  totalProducts: number;
  withDescription: number;
  descriptionCoverage: number;
  qualityDistribution: Record<string, number>;
  avgTrustScore: number;
  productsInDrift: number;
  productsWithLowTrust: number;
  totalColumns: number;
  piiColumns: number;
  piiCoverage: number;
  glossaryMappedColumns: number;
  glossaryCoverage: number;
  totalQualityRules: number;
  totalGlossaryTerms: number;
}

export async function getCatalogHealth(): Promise<CatalogHealthMetrics> {
  const response = await axios.get<CatalogHealthMetrics>("/api/catalog/health");
  return response.data;
}

// ---------------------------------------------------------------------------
// Audit Log (Phase 8)
// ---------------------------------------------------------------------------

export interface CatalogAuditLog {
  id: string;
  dataProductId: string;
  actorId?: string;
  action: string;
  detail?: string;
  createdAt: string;
}

export async function listAuditLog(name: string): Promise<CatalogAuditLog[]> {
  const response = await axios.get<CatalogAuditLog[]>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/audit`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Subscriptions (Phase 8)
// ---------------------------------------------------------------------------

export async function subscribeToProduct(name: string): Promise<void> {
  await axios.post(`/api/catalog/data-products/${encodeURIComponent(name)}/subscribe`);
}

export async function unsubscribeFromProduct(name: string): Promise<void> {
  await axios.delete(`/api/catalog/data-products/${encodeURIComponent(name)}/unsubscribe`);
}

export async function isSubscribedToProduct(name: string): Promise<boolean> {
  const response = await axios.get<{ subscribed: boolean }>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/subscribed`
  );
  return response.data.subscribed;
}

// ---------------------------------------------------------------------------
// Lot 2 — Search avec facettes
// ---------------------------------------------------------------------------

import type {
  CatalogSearchResult,
  CatalogSearchParams,
  CatalogGdprDeclaration as GdprDeclaration,
} from '../pages/Portal/Catalog/types/catalogTypes';

export type { CatalogSearchResult, CatalogSearchParams };

/**
 * Recherche full-text avec facettes (nouveau endpoint Lot 2).
 * GET /api/catalog/data-products?q=...&qualityLevel=...&accessPolicy=...&domainId=...&sourceType=...&sort=...&page=...&size=...
 */
export async function searchDataProductsFaceted(
  params: CatalogSearchParams
): Promise<CatalogSearchResult> {
  const urlParams: Record<string, string | string[]> = {};
  if (params.q)              urlParams['q']            = params.q;
  if (params.qualityLevel?.length) urlParams['qualityLevel'] = params.qualityLevel;
  if (params.accessPolicy?.length) urlParams['accessPolicy'] = params.accessPolicy;
  if (params.domainId?.length)     urlParams['domainId']     = params.domainId;
  if (params.sourceType?.length)   urlParams['sourceType']   = params.sourceType;
  if (params.sort)           urlParams['sort']          = params.sort;
  if (params.page != null)   urlParams['page']          = String(params.page);
  if (params.size != null)   urlParams['size']          = String(params.size);

  const response = await axios.get<CatalogSearchResult>('/api/catalog/data-products', {
    params: urlParams,
    paramsSerializer: (p) => {
      const parts: string[] = [];
      for (const [key, value] of Object.entries(p)) {
        if (Array.isArray(value)) {
          value.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
        } else {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`);
        }
      }
      return parts.join('&');
    },
  });
  return response.data;
}

/**
 * Export CSV d'un Data Product.
 * GET /api/catalog/data-products/{name}/export?format=csv
 */
export async function exportDataProductCsv(name: string): Promise<void> {
  const response = await axios.get(
    `/api/catalog/data-products/${encodeURIComponent(name)}/export`,
    { params: { format: 'csv' }, responseType: 'blob' }
  );
  const url = URL.createObjectURL(response.data as Blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Récupère la déclaration RGPD d'un Data Product.
 * GET /api/catalog/data-products/{name}/gdpr
 */
export async function getGdprDeclaration(name: string): Promise<GdprDeclaration | null> {
  try {
    const response = await axios.get<GdprDeclaration>(
      `/api/catalog/data-products/${encodeURIComponent(name)}/gdpr`
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Met à jour la déclaration RGPD d'un Data Product.
 * PUT /api/catalog/data-products/{name}/gdpr
 */
export async function upsertGdprDeclaration(
  name: string,
  payload: Omit<GdprDeclaration, 'id' | 'dataProductName' | 'createdAt' | 'updatedAt'>
): Promise<GdprDeclaration> {
  const response = await axios.put<GdprDeclaration>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/gdpr`,
    { dataProductName: name, ...payload }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Lot 4 — Workflow de certification Gold
// ---------------------------------------------------------------------------

export interface CriterionCheck {
  key: string;
  label: string;
  passed: boolean;
  explanation: string;
  link?: string;
}

export interface GoldCriteriaSummary {
  criteria: CriterionCheck[];
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  /** Vrai si l'utilisateur authentifié est CATALOG_STEWARD. */
  canReview: boolean;
}

export type CertificationLevel = 'BRONZE' | 'SILVER' | 'GOLD';
export type CertificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUESTED';

export interface CertificationSlaData {
  freshnessHours?: number;
  availabilityPercent?: number;
  support?: string;
}

export interface CertificationRequest {
  id: string;
  dataProductName: string;
  targetLevel: CertificationLevel;
  status: CertificationStatus;
  submittedBy: string;
  reviewedBy?: string;
  comment?: string;
  slaFreshnessHours?: number;
  slaAvailabilityPercent?: number;
  slaSupport?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Évalue les critères Gold d'un Data Product.
 * GET /api/catalog/data-products/{name}/certification/criteria
 */
export async function getGoldCriteria(name: string): Promise<GoldCriteriaSummary> {
  const response = await axios.get<GoldCriteriaSummary>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/certification/criteria`
  );
  return response.data;
}

/**
 * Soumet une demande de certification.
 * POST /api/catalog/data-products/{name}/certification/submit
 */
export async function submitCertificationRequest(
  name: string,
  targetLevel: CertificationLevel,
  slaData?: CertificationSlaData
): Promise<CertificationRequest> {
  const response = await axios.post<CertificationRequest>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/certification/submit`,
    { targetLevel, slaData }
  );
  return response.data;
}

/**
 * Historique des demandes de certification d'un Data Product.
 * GET /api/catalog/data-products/{name}/certification/history
 */
export async function getCertificationHistory(name: string): Promise<CertificationRequest[]> {
  const response = await axios.get<CertificationRequest[]>(
    `/api/catalog/data-products/${encodeURIComponent(name)}/certification/history`
  );
  return response.data;
}

/**
 * Revue d'une demande de certification (approve / reject / correction_requested).
 * POST /api/catalog/certification-requests/{id}/review
 */
export async function reviewCertificationRequest(
  requestId: string,
  decision: Exclude<CertificationStatus, 'PENDING'>,
  comment?: string
): Promise<CertificationRequest> {
  const response = await axios.post<CertificationRequest>(
    `/api/catalog/certification-requests/${encodeURIComponent(requestId)}/review`,
    { decision, comment }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Lot 6 — Administration : webhook events, brouillons IA, journaux accès
// ---------------------------------------------------------------------------

export interface WebhookEventDto {
  id: string;
  datasetId: string | null;
  version: string | null;
  /** RECEIVED | PROCESSING | DONE | FAILED */
  state: string;
  attempts: number;
  receivedAt: string | null;
  processedAt: string | null;
  lastError: string | null;
  delayMs: number | null;
}

export interface WebhookEventsPage {
  items: WebhookEventDto[];
  total: number;
  medianDelayMs: number | null;
  percentInDelay: number | null;
}

export interface AiDraftDto {
  name: string;
  displayName: string | null;
  fqn: string;
  description: string | null;
  qualityLevel: string | null;
  descriptionSource: string | null;
  accessPolicy: string | null;
  dataProductType: string | null;
  useCases: string | null;
  updatedAt: string | null;
}

export interface RestrictedAccessLog {
  id: string;
  assetId: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  ipAddress: string | null;
  /** ALLOWED | DENIED | ALLOWED_PII_MASKED */
  result: string;
  createdAt: string;
}

/** GET /api/catalog/admin/webhook-events */
export async function listWebhookEvents(
  page = 0,
  size = 20
): Promise<WebhookEventsPage> {
  const response = await axios.get<WebhookEventsPage>(
    '/api/catalog/admin/webhook-events',
    { params: { page, size } }
  );
  return response.data;
}

/** GET /api/catalog/admin/ai-drafts */
export async function listAiDrafts(): Promise<AiDraftDto[]> {
  const response = await axios.get<AiDraftDto[]>('/api/catalog/admin/ai-drafts');
  return response.data;
}

/** PUT /api/catalog/admin/ai-drafts/{name}/validate */
export async function validateAiDraft(name: string): Promise<CatalogDataProduct> {
  const response = await axios.put<CatalogDataProduct>(
    `/api/catalog/admin/ai-drafts/${encodeURIComponent(name)}/validate`
  );
  return response.data;
}

/** POST /api/catalog/admin/ai-drafts/{name}/regenerate */
export async function regenerateAiDraft(name: string): Promise<{ status: string; name: string }> {
  const response = await axios.post<{ status: string; name: string }>(
    `/api/catalog/admin/ai-drafts/${encodeURIComponent(name)}/regenerate`
  );
  return response.data;
}

/** GET /api/catalog/admin/restricted-access-logs */
export async function listRestrictedAccessLogs(
  startDate?: string,
  endDate?: string
): Promise<RestrictedAccessLog[]> {
  const response = await axios.get<RestrictedAccessLog[]>(
    '/api/catalog/admin/restricted-access-logs',
    { params: { startDate, endDate } }
  );
  return response.data;
}

/** GET /api/catalog/admin/restricted-access-logs/export — déclenche le téléchargement */
export function buildRestrictedAccessLogsExportUrl(
  startDate?: string,
  endDate?: string
): string {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate)   params.set('endDate',   endDate);
  const qs = params.toString();
  return `/api/catalog/admin/restricted-access-logs/export${qs ? `?${qs}` : ''}`;
}
