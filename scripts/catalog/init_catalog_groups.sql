-- =============================================================================
-- Init des groupes Data Catalog dans passport_groups
-- À exécuter UNE SEULE FOIS sur la base de données.
-- Idempotent : chaque INSERT est gardé par un WHERE NOT EXISTS.
-- =============================================================================
-- Usage (depuis le serveur) :
--   psql -U movetodata -d boson -f scripts/catalog/init_catalog_groups.sql
-- Ou via Docker :
--   docker exec -i movetodata-boson-db \
--     psql -U movetodata -d boson < scripts/catalog/init_catalog_groups.sql
-- =============================================================================

BEGIN;

INSERT INTO passport_groups (id, name, description, status, created_at, updated_at)
SELECT gen_random_uuid(),
       'CATALOG_READER',
       'Lecture des Data Products publics et internes',
       'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM passport_groups WHERE name = 'CATALOG_READER');

INSERT INTO passport_groups (id, name, description, status, created_at, updated_at)
SELECT gen_random_uuid(),
       'CATALOG_OWNER',
       'Propriétaire d''un ou plusieurs Data Products — peut soumettre une demande de certification',
       'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM passport_groups WHERE name = 'CATALOG_OWNER');

INSERT INTO passport_groups (id, name, description, status, created_at, updated_at)
SELECT gen_random_uuid(),
       'CATALOG_STEWARD',
       'Data Steward — valide les certifications, accès aux assets RESTRICTED',
       'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM passport_groups WHERE name = 'CATALOG_STEWARD');

INSERT INTO passport_groups (id, name, description, status, created_at, updated_at)
SELECT gen_random_uuid(),
       'CATALOG_DPO',
       'DPO — accès aux déclarations RGPD, colonnes PII non masquées, journal RESTRICTED',
       'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM passport_groups WHERE name = 'CATALOG_DPO');

INSERT INTO passport_groups (id, name, description, status, created_at, updated_at)
SELECT gen_random_uuid(),
       'CATALOG_DATAOPS',
       'DataOps — administration, webhooks, brouillons IA à relire',
       'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM passport_groups WHERE name = 'CATALOG_DATAOPS');

COMMIT;

-- Vérification
SELECT id, name, description, status
FROM passport_groups
WHERE name LIKE 'CATALOG_%'
ORDER BY name;
