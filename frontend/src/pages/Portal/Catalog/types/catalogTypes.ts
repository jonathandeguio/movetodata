/**
 * Types Lot 2 — Catalogue & fiche.
 * Correspondent aux DTOs du backend (CatalogSearchResponse, DataProductSummary, etc.)
 */

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface DataProductSummary {
  name: string;
  fqn: string;
  displayName?: string;
  description?: string;
  /** BRONZE | SILVER | GOLD */
  qualityLevel?: 'BRONZE' | 'SILVER' | 'GOLD';
  /** PUBLIC | INTERNAL | RESTRICTED */
  accessPolicy?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  hasPii: boolean;
  domainName?: string;
  domainId?: string;
  sourceType?: string;
  tags: string[];
  /** 0–100, null si non calculé. */
  trustScore?: number;
  ownerName?: string;
  updatedAt?: string;
  viewCount: number;
  driftAlert: boolean;
  trustLowAlert: boolean;
}

export interface CatalogFacets {
  qualityLevel: Record<string, number>;
  accessPolicy: Record<string, number>;
  domainName: Record<string, number>;
  sourceType: Record<string, number>;
}

export interface CatalogSearchResult {
  items: DataProductSummary[];
  total: number;
  facets: CatalogFacets;
}

export interface CatalogSearchParams {
  q?: string;
  qualityLevel?: string[];
  accessPolicy?: string[];
  domainId?: string[];
  sourceType?: string[];
  sort?: 'RELEVANCE' | 'TRUST_SCORE' | 'UPDATED_AT' | 'POPULARITY';
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------------------
// GDPR
// ---------------------------------------------------------------------------

export interface CatalogGdprDeclaration {
  id?: string;
  dataProductName: string;
  dataController?: string;
  purpose?: string;
  legalBasis?: string;
  retentionDays?: number;
  piiColumns?: string[];
  createdAt?: string;
  updatedAt?: string;
}
