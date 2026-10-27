-- Phase 5: Glossaire métier + tracking des vues de DataProducts

-- Glossaire métier : termes partagés entre domaines
CREATE TABLE catalog_glossary_term (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    term        varchar(255) NOT NULL UNIQUE,
    definition  text         NOT NULL,
    domain      varchar(255),
    synonyms    text,           -- JSON array of synonym strings
    created_by  uuid         NOT NULL,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_glossary_term_domain ON catalog_glossary_term(domain);

-- Tracking des consultations de fiches DataProduct (pour usage_score)
CREATE TABLE catalog_product_view (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    data_product_id uuid        NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    viewer_id       uuid,       -- NULL = anonymous / external
    viewed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_product_view_product_time
    ON catalog_product_view(data_product_id, viewed_at DESC);
