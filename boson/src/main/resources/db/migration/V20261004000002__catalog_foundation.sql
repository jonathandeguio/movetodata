-- Domaine métier
CREATE TABLE catalog_domain (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color       VARCHAR(32),
    created_by  UUID         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Data Product
CREATE TABLE catalog_data_product (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(255) NOT NULL UNIQUE,
    display_name      VARCHAR(255),
    description       TEXT,
    data_product_type VARCHAR(50),   -- SOURCE_ALIGNED / AGGREGATE / CONSUMER_ALIGNED
    access_policy     VARCHAR(20),   -- PUBLIC / INTERNAL / RESTRICTED
    quality_level     VARCHAR(10),   -- BRONZE / SILVER / GOLD
    trust_score       NUMERIC(5,2),
    domain_id         UUID REFERENCES catalog_domain(id) ON DELETE SET NULL,
    owner_id          UUID,
    use_cases         TEXT,          -- JSON array string
    created_by        UUID         NOT NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Jointure DataProduct ↔ Dataset (kitab_folder uuid)
CREATE TABLE catalog_data_product_dataset (
    data_product_id UUID NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    dataset_id      UUID NOT NULL,
    branch          VARCHAR(255) NOT NULL DEFAULT 'master',
    role            VARCHAR(30) NOT NULL DEFAULT 'PRIMARY',  -- PRIMARY / SECONDARY
    PRIMARY KEY (data_product_id, dataset_id, branch)
);

-- Jointure DataProduct ↔ Tag (docket_tags id)
CREATE TABLE catalog_data_product_tag (
    data_product_id UUID   NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    tag_id          BIGINT NOT NULL,
    PRIMARY KEY (data_product_id, tag_id)
);

-- Historique certifications
CREATE TABLE catalog_certification_history (
    id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    data_product_id UUID      NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    quality_level   VARCHAR(10) NOT NULL,
    comment         TEXT,
    certified_by    UUID      NOT NULL,
    certified_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Métadonnées colonnes
CREATE TABLE catalog_column_meta (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id     UUID         NOT NULL,
    branch         VARCHAR(255) NOT NULL DEFAULT 'master',
    column_name    VARCHAR(255) NOT NULL,
    description    TEXT,
    pii_type       VARCHAR(50), -- NULL / PII.Sensitive / GDPR.Sensitive / GDPR.ID
    retention_days INT,
    UNIQUE (dataset_id, branch, column_name)
);

CREATE INDEX idx_catalog_dp_domain ON catalog_data_product(domain_id);
CREATE INDEX idx_catalog_dp_quality ON catalog_data_product(quality_level);
CREATE INDEX idx_catalog_col_dataset ON catalog_column_meta(dataset_id, branch);
