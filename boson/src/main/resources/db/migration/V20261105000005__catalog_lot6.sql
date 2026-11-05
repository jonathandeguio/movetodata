-- Lot 6 — Ingestion & IA : payload sur les webhooks entrants
-- catalog_webhook_event existe depuis Lot 1 ; on ajoute la colonne payload
-- pour permettre le rejeu en cas d'état FAILED ou PROCESSING.

ALTER TABLE catalog_webhook_event
    ADD COLUMN IF NOT EXISTS payload JSONB;

-- Index partiel pour accélérer la requête « événements non terminés »
CREATE INDEX IF NOT EXISTS idx_webhook_state_pending
    ON catalog_webhook_event(state)
    WHERE state IN ('RECEIVED', 'PROCESSING', 'FAILED');
