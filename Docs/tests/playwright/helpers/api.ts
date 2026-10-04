/**
 * api.ts — REST API helpers for E2E test setup / teardown.
 *
 * These helpers call the Boson backend directly so tests can create the
 * fixtures they need without going through the UI. All functions accept an
 * Playwright `APIRequestContext` (available as `request` in tests).
 *
 * Conventions:
 *   - Functions prefixed with `create` return the newly created resource.
 *   - Functions prefixed with `delete` clean up after tests.
 *   - No production data is ever used; all resources are tagged with the
 *     prefix "e2e-" so they can be bulk-deleted in teardown.
 */

import type { APIRequestContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types (minimal subset — expand as needed)
// ---------------------------------------------------------------------------

export interface SourcePayload {
  name: string;
  type: string;
  jdbcUrl?: string;
  username?: string;
  password?: string;
}

export interface SourceResource {
  id: string;
  name: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Sources (Connect)
// ---------------------------------------------------------------------------

/**
 * Creates a test data source via POST /api/sources.
 * Returns the created source object (including its generated `id`).
 */
export async function createTestSource(
  request: APIRequestContext,
  overrides: Partial<SourcePayload> = {}
): Promise<SourceResource> {
  const payload: SourcePayload = {
    name: 'e2e-test-source',
    type: 'CSV',
    ...overrides,
  };

  const response = await request.post('/api/sources', {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok()) {
    throw new Error(
      `createTestSource failed: ${response.status()} ${await response.text()}`
    );
  }

  return response.json();
}

/**
 * Deletes a source by id via DELETE /api/sources/:id.
 */
export async function deleteTestSource(
  request: APIRequestContext,
  sourceId: string
): Promise<void> {
  await request.delete(`/api/sources/${sourceId}`);
}

// ---------------------------------------------------------------------------
// AI mock helpers
// ---------------------------------------------------------------------------

/**
 * Returns a mock TextToSqlResponse for use with page.route().
 */
export function mockTextToSqlResponse() {
  return {
    sql: 'SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 30 DAY',
    confidence: 0.87,
    model: 'qwen2.5-coder:7b',
    tokensUsed: 312,
    sourceId: 'mock-source-id',
  };
}

/**
 * Returns a mock InsightsResponse (summary type) for use with page.route().
 */
export function mockInsightsResponse() {
  return {
    type: 'summary',
    results: [{ text: 'The dataset contains 1 200 rows with no missing values.' }],
    model: 'IsolationForest (scikit-learn)',
    row_count: 1200,
    warning: null,
  };
}

/**
 * Returns a mock SmartConnectorResponse for use with page.route().
 */
export function mockSmartConnectorResponse() {
  return {
    quality_score: {
      global: 0.82,
      completeness: 0.91,
      uniqueness: 0.88,
      consistency: 0.79,
      outlier_ratio: 0.03,
    },
    detected_types: {
      id: 'numeric',
      created_at: 'time_series',
      country: 'categorical',
      amount: 'numeric',
    },
    chart_suggestions: [
      {
        chartType: 'line',
        columnX: 'created_at',
        columnY: 'amount',
        title: 'Amount over time',
        reason: 'Time-series column paired with a numeric metric.',
      },
    ],
    analyzed_at: new Date().toISOString(),
    model: 'qwen2.5-coder:7b',
    sample_size: 500,
  };
}

/**
 * Returns a mock file analysis response for use with page.route().
 */
export function mockFileAnalysisResponse() {
  return {
    summary: 'CSV file with 3 columns and 200 rows. No quality issues detected.',
    detectedColumns: [
      { name: 'id', type: 'numeric' },
      { name: 'label', type: 'categorical' },
      { name: 'value', type: 'numeric' },
    ],
    rowCount: 200,
    fileType: 'CSV',
  };
}
