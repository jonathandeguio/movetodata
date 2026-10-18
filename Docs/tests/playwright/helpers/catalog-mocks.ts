/**
 * catalog-mocks.ts — Shared mock data for F-AI-06 through F-AI-10.
 *
 * Imported by every Data Catalog / RAG spec to avoid duplication and keep
 * the mock shape consistent across test files.
 */

// ---------------------------------------------------------------------------
// Data Product
// ---------------------------------------------------------------------------

export const MOCK_DATA_PRODUCT = {
  id: 'dp-e2e-001',
  fqn: 'e2e.catalog.SalesDataProduct',
  name: 'SalesDataProduct',
  displayName: 'Sales Data Product',
  description: 'Dataset de ventes anonymisé, certifié Gold.',
  dataProductType: 'CONSUMER_ALIGNED',
  qualityLevel: 'GOLD',
  accessPolicy: 'INTERNAL',
  owners: [{ name: 'e2e-owner' }],
  tags: [{ tagFQN: 'Finance' }, { tagFQN: 'PII.Sensitive' }],
  domain: { name: 'Finance' },
  columns: [
    { name: 'order_id', dataType: 'INTEGER', tags: [] },
    { name: 'customer_email', dataType: 'VARCHAR', tags: [{ tagFQN: 'PII.Sensitive' }] },
  ],
  extension: { qualityLevel: 'GOLD', dataController: 'DPO MoveToData' },
};

// ---------------------------------------------------------------------------
// OpenMetadata full-text search
// ---------------------------------------------------------------------------

export const MOCK_SEARCH_RESPONSE = {
  hits: {
    hits: [{ _source: MOCK_DATA_PRODUCT, _score: 0.95 }],
    total: { value: 1 },
  },
};

export const MOCK_SEARCH_EMPTY_RESPONSE = {
  hits: {
    hits: [],
    total: { value: 0 },
  },
};

// ---------------------------------------------------------------------------
// Lineage
// ---------------------------------------------------------------------------

export const MOCK_LINEAGE = {
  entity: { id: 'dp-e2e-001', name: 'SalesDataProduct' },
  upstreamEdges: [
    {
      fromEntity: { id: 'src-001', name: 'RawSalesCSV', type: 'table' },
      toEntity: { id: 'dp-e2e-001', name: 'SalesDataProduct', type: 'dataProduct' },
    },
  ],
  downstreamEdges: [
    {
      fromEntity: { id: 'dp-e2e-001', name: 'SalesDataProduct', type: 'dataProduct' },
      toEntity: { id: 'dash-001', name: 'SalesDashboard', type: 'dashboard' },
    },
  ],
};

// ---------------------------------------------------------------------------
// RAG (Recherche Sémantique)
// ---------------------------------------------------------------------------

export const MOCK_RAG_RESULTS = {
  results: [
    {
      fqn: 'e2e.catalog.SalesDataProduct',
      name: 'SalesDataProduct',
      description: 'Dataset de ventes anonymisé.',
      domain: 'Finance',
      qualityLevel: 'GOLD',
      accessPolicy: 'INTERNAL',
      score: 0.92,
    },
  ],
  count: 1,
};

export const MOCK_RAG_STATUS = {
  collection: 'catalog_data_products',
  document_count: 42,
  embedding_model: 'nomic-embed-text',
};

export const MOCK_RAG_INDEX_RESPONSE = {
  status: 'ok',
  indexed: 42,
  errors: 0,
  collection_count: 42,
};
