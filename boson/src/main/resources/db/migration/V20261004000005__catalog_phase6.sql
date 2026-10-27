-- Phase 6: Glossaire → colonnes mapping
-- Add glossary_term_id FK to catalog_column_meta

ALTER TABLE catalog_column_meta
    ADD COLUMN IF NOT EXISTS glossary_term_id uuid
        REFERENCES catalog_glossary_term(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_column_meta_glossary_term
    ON catalog_column_meta(glossary_term_id);
