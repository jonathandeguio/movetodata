-- Phase 2 : Studio de Webapps IA — tables de persistance
-- Toutes les colonnes definition sont TEXT (JSON valide) pour compatibilité multi-bases.

CREATE TABLE IF NOT EXISTS studio_app (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    datasource_id   UUID         NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'DRAFT',
    created_by      UUID,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP    NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_app_deleted_at ON studio_app(deleted_at);

CREATE TABLE IF NOT EXISTS studio_app_version (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id      UUID    NOT NULL REFERENCES studio_app(id),
    version     INT     NOT NULL,
    definition  TEXT    NOT NULL,
    created_by  UUID,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    published   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_studio_app_version_app_version   ON studio_app_version(app_id, version);
CREATE INDEX IF NOT EXISTS idx_studio_app_version_app_published ON studio_app_version(app_id, published);

CREATE TABLE IF NOT EXISTS studio_ai_message (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id      UUID        NOT NULL REFERENCES studio_app(id),
    role        VARCHAR(16) NOT NULL,
    text        TEXT        NOT NULL,
    patch       TEXT        NULL,
    applied     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_ai_message_app_id ON studio_ai_message(app_id, created_at);

CREATE TABLE IF NOT EXISTS studio_query_audit (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id      UUID         NOT NULL,
    version     INT          NOT NULL,
    query_id    VARCHAR(128) NOT NULL,
    user_id     UUID,
    params      TEXT,
    row_count   INT,
    duration_ms INT,
    error       TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_query_audit_app_id ON studio_query_audit(app_id, created_at DESC);
