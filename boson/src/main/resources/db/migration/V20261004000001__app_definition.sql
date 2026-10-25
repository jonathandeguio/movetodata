CREATE TABLE app_definition (
    id          BIGSERIAL    PRIMARY KEY,
    uuid        VARCHAR(36)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    fields_json TEXT         NOT NULL DEFAULT '[]',
    icon        VARCHAR(100),
    created_by  UUID         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
