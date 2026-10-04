-- F3 — Assistant IA conversationnel
-- Tables de persistance des sessions et messages de chat IA.
--
-- source_id est stocké en VARCHAR(36) (UUID) pour rester cohérent avec
-- le modèle de données des sources connectées (io.movetodata.connect).

CREATE TABLE ai_chat_session (
    id          BIGSERIAL    PRIMARY KEY,
    uuid        VARCHAR(36)  NOT NULL UNIQUE,
    user_id     UUID         NOT NULL REFERENCES passport_users(id),
    source_id   VARCHAR(36),
    created_at  TIMESTAMP    DEFAULT NOW(),
    deleted_at  TIMESTAMP
);

CREATE TABLE ai_chat_message (
    id           BIGSERIAL    PRIMARY KEY,
    session_uuid VARCHAR(36)  NOT NULL REFERENCES ai_chat_session(uuid),
    role         VARCHAR(10)  NOT NULL CHECK (role IN ('user', 'assistant')),
    content      TEXT         NOT NULL,
    model        VARCHAR(100),
    tokens_used  INTEGER,
    created_at   TIMESTAMP    DEFAULT NOW(),
    deleted_at   TIMESTAMP
);

CREATE INDEX idx_ai_chat_message_session ON ai_chat_message(session_uuid);
CREATE INDEX idx_ai_chat_session_user    ON ai_chat_session(user_id);
