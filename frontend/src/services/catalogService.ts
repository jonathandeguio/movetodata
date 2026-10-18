/**
 * catalogService.ts — OpenMetadata API integration for the Data Catalog.
 *
 * This service uses a DEDICATED axios instance with REACT_APP_OPENMETADATA_URL
 * as baseURL, intentionally bypassing the global MoveToData interceptor
 * (which would inject a MoveToData Bearer token incompatible with OpenMetadata).
 *
 * Sovereignty note: all calls target a self-hosted OpenMetadata instance.
 * No data leaves the European infrastructure.
 */

import axios, { AxiosInstance } from "axios";

// ---------------------------------------------------------------------------
// Dedicated axios instance — does NOT inherit the global interceptors
// ---------------------------------------------------------------------------

const openmetadataClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_OPENMETADATA_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataProductOwner {
  name: string;
}

export interface DataProductTag {
  tagFQN: string;
}

export interface DataProductDomain {
  name: string;
}

export interface DataProductColumn {
  name: string;
  dataType?: string;
  tags?: DataProductTag[];
}

export interface DataProductExtension {
  qualityLevel?: string;
  dataController?: string;
  certificationComment?: string;
}

export interface DataProduct {
  id?: string;
  fqn: string;
  name: string;
  description?: string;
  displayName?: string;
  owners?: DataProductOwner[];
  tags?: DataProductTag[];
  dataProductType?: string;
  domain?: DataProductDomain;
  accessPolicy?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  qualityLevel?: 'BRONZE' | 'SILVER' | 'GOLD';
  columns?: DataProductColumn[];
  extension?: DataProductExtension;
}

export interface SearchHit {
  _source: DataProduct;
  _score: number;
}

export interface SearchResult {
  hits: {
    hits: SearchHit[];
    total: {
      value: number;
    };
  };
}

export interface LineageEntityRef {
  id: string;
  name: string;
  type: string;
}

export interface LineageEdge {
  fromEntity: LineageEntityRef;
  toEntity: LineageEntityRef;
}

export interface LineageData {
  entity: {
    id: string;
    name: string;
  };
  upstreamEdges?: LineageEdge[];
  downstreamEdges?: LineageEdge[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Full-text search across Data Products.
 * GET {REACT_APP_OPENMETADATA_URL}/api/v1/search/query
 */
export async function searchDataProducts(
  query: string,
  from = 0,
  size = 20
): Promise<SearchResult> {
  const response = await openmetadataClient.get<SearchResult>(
    "/api/v1/search/query",
    {
      params: {
        q: query,
        index: "dataProduct",
        from,
        size,
      },
    }
  );
  return response.data;
}

/**
 * Fetch a single Data Product by fully-qualified name.
 * GET {REACT_APP_OPENMETADATA_URL}/api/v1/dataProducts/name/{fqn}
 */
export async function getDataProduct(fqn: string): Promise<DataProduct> {
  const response = await openmetadataClient.get<DataProduct>(
    `/api/v1/dataProducts/name/${encodeURIComponent(fqn)}`,
    {
      params: {
        fields: "owners,tags,domain,columns,extension",
      },
    }
  );
  return response.data;
}

/**
 * Promote the certification level of a Data Product.
 * PATCH {REACT_APP_OPENMETADATA_URL}/api/v1/dataProducts/name/{fqn}
 */
export async function certifyDataProduct(
  fqn: string,
  level: 'BRONZE' | 'SILVER' | 'GOLD',
  comment: string
): Promise<DataProduct> {
  const response = await openmetadataClient.patch<DataProduct>(
    `/api/v1/dataProducts/name/${encodeURIComponent(fqn)}`,
    { extension: { qualityLevel: level, certificationComment: comment } }
  );
  return response.data;
}

/**
 * Attach a PII/GDPR tag to a specific column of a Data Product.
 * PATCH {REACT_APP_OPENMETADATA_URL}/api/v1/dataProducts/name/{fqn}/columns/{columnName}/tags
 */
export async function addPiiTag(
  fqn: string,
  columnName: string,
  tagFqn: string
): Promise<void> {
  await openmetadataClient.patch(
    `/api/v1/dataProducts/name/${encodeURIComponent(fqn)}/columns/${columnName}/tags`,
    { tagFQN: tagFqn }
  );
}

/**
 * Fetch lineage graph for an entity.
 * GET {REACT_APP_OPENMETADATA_URL}/api/v1/lineage/{entityType}/{id}
 */
export async function getLineage(
  id: string,
  entityType = "dataProduct",
  upstreamDepth = 3,
  downstreamDepth = 3
): Promise<LineageData> {
  const response = await openmetadataClient.get<LineageData>(
    `/api/v1/lineage/${entityType}/${id}`,
    {
      params: {
        upstreamDepth,
        downstreamDepth,
      },
    }
  );
  return response.data;
}
