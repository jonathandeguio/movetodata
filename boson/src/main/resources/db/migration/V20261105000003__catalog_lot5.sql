-- Lot 5 — Lignage Data Catalog
-- Table d'associations de lignage enrichie (nœuds : DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD)

CREATE TABLE IF NOT EXISTS catalog_lineage_edge (
    id                     VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
    upstream_id            VARCHAR(255)  NOT NULL,
    upstream_type          VARCHAR(50)   NOT NULL,
    upstream_name          VARCHAR(255)  NOT NULL,
    downstream_id          VARCHAR(255)  NOT NULL,
    downstream_type        VARCHAR(50)   NOT NULL,
    downstream_name        VARCHAR(255)  NOT NULL,
    transformation_engine  VARCHAR(100),
    transformation_script  TEXT,
    last_run_at            TIMESTAMPTZ,
    duration_ms            BIGINT,
    input_rows             BIGINT,
    output_rows            BIGINT,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lineage_upstream   ON catalog_lineage_edge(upstream_id);
CREATE INDEX IF NOT EXISTS idx_lineage_downstream ON catalog_lineage_edge(downstream_id);
