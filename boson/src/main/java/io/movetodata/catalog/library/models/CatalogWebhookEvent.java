package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Représente un événement webhook d'ingestion de dataset entrant.
 * Fournit l'idempotence (clé unique {@code idempotency_key}) et le suivi d'état.
 *
 * États : RECEIVED → PROCESSING → DONE | FAILED
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_webhook_event")
public class CatalogWebhookEvent {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Clé d'idempotence : {@code datasetId:version} ou header X-Idempotency-Key. */
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 512)
    private String idempotencyKey;

    @Column(name = "dataset_id", length = 255)
    private String datasetId;

    @Column(name = "dataset_version", length = 100)
    private String datasetVersion;

    /** RECEIVED | PROCESSING | DONE | FAILED */
    @Column(name = "state", nullable = false, length = 50)
    private String state;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    /** Corps JSON brut du webhook — stocké pour permettre le rejeu. */
    @Column(name = "payload", columnDefinition = "jsonb")
    private String payload;

    @CreationTimestamp
    @Column(name = "received_at", updatable = false)
    private Instant receivedAt;

    @Column(name = "processed_at")
    private Instant processedAt;
}
