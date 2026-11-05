-- Lot 4 — Workflow de certification (demandes, critères Gold, SLA)

-- Table de demandes de certification
CREATE TABLE IF NOT EXISTS catalog_certification_request (
    id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    data_product_name        VARCHAR(255)  NOT NULL,
    target_level             VARCHAR(20)   NOT NULL,
    status                   VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    submitted_by             UUID          NOT NULL,
    reviewed_by              UUID,
    comment                  TEXT,
    sla_freshness_hours      INTEGER,
    sla_availability_percent NUMERIC(5,2),
    sla_support              VARCHAR(100),
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_request_dp     ON catalog_certification_request(data_product_name);
CREATE INDEX IF NOT EXISTS idx_cert_request_status ON catalog_certification_request(status);

-- Seuil Gold (score de confiance minimum) sur catalog_data_product
ALTER TABLE catalog_data_product
    ADD COLUMN IF NOT EXISTS gold_threshold INTEGER DEFAULT 80;
