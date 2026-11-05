-- Lot 2 — Catalogue & fiche : ajout source_type sur catalog_data_product
-- Les autres tables (catalog_restricted_access_log, catalog_gdpr_declaration, etc.) existent depuis Lot 1.

ALTER TABLE catalog_data_product ADD COLUMN IF NOT EXISTS source_type VARCHAR(100);

-- Index pour les filtres full-text courants (OpenSearch prend le relais quand disponible,
-- cet index sert aussi au fallback SQL).
CREATE INDEX IF NOT EXISTS idx_dp_source_type    ON catalog_data_product(source_type);
CREATE INDEX IF NOT EXISTS idx_dp_quality_level  ON catalog_data_product(quality_level);
CREATE INDEX IF NOT EXISTS idx_dp_access_policy  ON catalog_data_product(access_policy);
CREATE INDEX IF NOT EXISTS idx_dp_domain_id      ON catalog_data_product(domain_id);
