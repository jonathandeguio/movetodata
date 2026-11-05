-- Lot 1 — Socle & sécurité Data Catalog
-- Réutilise les tables existantes : catalog_data_product, catalog_domain, catalog_glossary_term

-- Table journalisation des accès restreints
CREATE TABLE IF NOT EXISTS catalog_restricted_access_log (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id    VARCHAR(255) NOT NULL,
    user_id     UUID,
    user_email  VARCHAR(255),
    user_role   VARCHAR(100),
    ip_address  VARCHAR(45),
    result      VARCHAR(50)  NOT NULL,  -- ALLOWED / DENIED / ALLOWED_PII_MASKED
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_restricted_log_asset   ON catalog_restricted_access_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_restricted_log_created ON catalog_restricted_access_log(created_at);

-- Table déclarations RGPD par Data Product
CREATE TABLE IF NOT EXISTS catalog_gdpr_declaration (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    data_product_name   VARCHAR(255) NOT NULL UNIQUE,
    data_controller     VARCHAR(255),
    purpose             TEXT,
    legal_basis         VARCHAR(100),
    retention_days      INTEGER,
    pii_columns         JSONB        DEFAULT '[]',
    created_by          UUID,
    updated_by          UUID,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Table idempotence webhooks (Lot 6 — F13.1)
CREATE TABLE IF NOT EXISTS catalog_webhook_event (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key   VARCHAR(512) NOT NULL UNIQUE,
    dataset_id        VARCHAR(255),
    dataset_version   VARCHAR(100),
    state             VARCHAR(50)  NOT NULL DEFAULT 'RECEIVED',
    attempts          INTEGER      NOT NULL DEFAULT 0,
    last_error        TEXT,
    received_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    processed_at      TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_idempotency ON catalog_webhook_event(idempotency_key);

-- Colonnes manquantes sur catalog_domain
ALTER TABLE catalog_domain ADD COLUMN IF NOT EXISTS owner_id   UUID;
ALTER TABLE catalog_domain ADD COLUMN IF NOT EXISTS steward_id UUID;
ALTER TABLE catalog_domain ADD COLUMN IF NOT EXISTS default_access_policy VARCHAR(50) DEFAULT 'INTERNAL';

-- Colonnes manquantes sur catalog_data_product
ALTER TABLE catalog_data_product ADD COLUMN IF NOT EXISTS steward_id          UUID;
ALTER TABLE catalog_data_product ADD COLUMN IF NOT EXISTS description_source  VARCHAR(50) DEFAULT 'manual';
ALTER TABLE catalog_data_product ADD COLUMN IF NOT EXISTS policy_inherited     BOOLEAN     DEFAULT TRUE;
ALTER TABLE catalog_data_product ADD COLUMN IF NOT EXISTS view_count           BIGINT      DEFAULT 0;

-- Colonne view_count sur catalog_glossary_term
ALTER TABLE catalog_glossary_term ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
