-- Lot 7 — Gouvernance & Text-to-SQL contextuel

-- Table de jointure glossaire ↔ Data Products
CREATE TABLE IF NOT EXISTS catalog_glossary_data_product (
    glossary_term_id UUID        NOT NULL,
    data_product_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (glossary_term_id, data_product_name)
);

-- Index pour lookup inverse (retrouver les termes liés à un Data Product)
CREATE INDEX IF NOT EXISTS idx_glossary_dp_name ON catalog_glossary_data_product(data_product_name);
