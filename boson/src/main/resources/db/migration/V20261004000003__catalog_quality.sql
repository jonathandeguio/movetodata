-- Phase 4: Data quality rules + dataset stats for drift detection

-- Quality rules per DataProduct / column
CREATE TABLE catalog_quality_rule (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    data_product_id uuid        NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    column_name     varchar(255),          -- NULL = table-level rule
    rule_type       varchar(50) NOT NULL,  -- NOT_NULL | RANGE | REGEX | UNIQUENESS | CUSTOM
    expression      text        NOT NULL,  -- human-readable or machine rule expression
    enabled         boolean     NOT NULL DEFAULT true,
    created_by      uuid        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_quality_rule_product ON catalog_quality_rule(data_product_id);

-- Dataset volume + column stats snapshots (used for drift detection)
CREATE TABLE catalog_dataset_stats (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    data_product_id uuid        NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    record_count    bigint      NOT NULL DEFAULT 0,
    column_stats    text,                  -- JSON: {col: {nullCount, distinctCount, min, max}}
    drift_score     numeric(6,3),          -- z-score of record_count vs last 30 snapshots
    drift_alert     boolean     NOT NULL DEFAULT false,
    measured_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_dataset_stats_product_time
    ON catalog_dataset_stats(data_product_id, measured_at DESC);
