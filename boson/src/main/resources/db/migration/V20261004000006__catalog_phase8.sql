-- Phase 8: Audit Log + Subscriptions
-- catalog_audit_log: tracks key actions on Data Products (certify, update, column patch)
CREATE TABLE IF NOT EXISTS catalog_audit_log (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    data_product_id UUID        NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    actor_id        UUID,
    action          VARCHAR(64) NOT NULL,
    detail          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_dp ON catalog_audit_log(data_product_id, created_at DESC);

-- catalog_subscription: users subscribing to change alerts for a Data Product
CREATE TABLE IF NOT EXISTS catalog_subscription (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    data_product_id UUID        NOT NULL REFERENCES catalog_data_product(id) ON DELETE CASCADE,
    subscriber_id   UUID        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sub_dp_user UNIQUE (data_product_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_subscription_subscriber ON catalog_subscription(subscriber_id);
