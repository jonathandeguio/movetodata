-- F4 — Smart Connector
-- Quality score and chart suggestions computed after a source is connected.
--
-- detected_types  : JSON map { "column_name": "time_series|numeric|categorical|geographic|boolean|text" }
-- chart_suggestions: JSON array of suggested chart configurations

CREATE TABLE ai_source_quality (
    id              BIGSERIAL    PRIMARY KEY,
    source_id       UUID         NOT NULL,
    global_score    INTEGER,
    completeness    INTEGER,
    uniqueness      INTEGER,
    consistency     INTEGER,
    outlier_ratio   DECIMAL(5,4),
    detected_types  JSONB,
    chart_suggestions JSONB,
    analyzed_at     TIMESTAMP    DEFAULT NOW(),
    UNIQUE (source_id)
);

CREATE INDEX idx_ai_source_quality_source ON ai_source_quality(source_id);
