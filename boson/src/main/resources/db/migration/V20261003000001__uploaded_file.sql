-- F5 — Import de fichiers & analyse IA
-- Table pour les fichiers uploadés via la feature d'import IA
CREATE TABLE IF NOT EXISTS uploaded_file (
    id            BIGSERIAL PRIMARY KEY,
    uuid          VARCHAR(36)   NOT NULL UNIQUE,
    filename      VARCHAR(500)  NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    content_type  VARCHAR(100),
    size_bytes    BIGINT,
    storage_path  VARCHAR(1000) NOT NULL,
    sheet_name    VARCHAR(200),
    user_id       UUID REFERENCES passport_users(id),
    created_at    TIMESTAMP DEFAULT NOW(),
    deleted_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_file_uuid    ON uploaded_file(uuid);
CREATE INDEX IF NOT EXISTS idx_uploaded_file_user_id ON uploaded_file(user_id);
