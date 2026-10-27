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
// Lineage types
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
// Column / GDPR types
// ---------------------------------------------------------------------------

export interface DataProductColumn {
  columnName: string;
  description?: string;
  piiType?: string;   // null | "PII.Sensitive" | "GDPR.Sensitive" | "GDPR.ID"
  retentionDays?: number;
  datasetId?: string;
  branch?: string;
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
 * Fetch all catalog domains.
 * GET /api/catalog/domains
 */
export async function listDomains(): Promise<CatalogDomain[]> {
  const response = await axios.get<CatalogDomain[]>("/api/catalog/domains");
  return response.data;
}

/**
 * GET /api/catalog/lineage/{id}
 */
export async function getLineage(id: string): Promise<LineageData> {
  const response = await axios.get<LineageData>(`/api/catalog/lineage/${encodeURIComponent(id)}`);
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
