package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogWebhookEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CatalogWebhookEventRepository
        extends JpaRepository<CatalogWebhookEvent, UUID> {

    Optional<CatalogWebhookEvent> findByIdempotencyKey(String idempotencyKey);

    Page<CatalogWebhookEvent> findAllByOrderByReceivedAtDesc(Pageable pageable);

    /** Délai médian en ms sur les 7 derniers jours (uniquement les DONE). */
    @Query(value = "SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY " +
            "EXTRACT(EPOCH FROM (processed_at - received_at)) * 1000) " +
            "FROM catalog_webhook_event " +
            "WHERE state = 'DONE' AND received_at >= :since AND processed_at IS NOT NULL",
            nativeQuery = true)
    Double medianDelayMs(@Param("since") Instant since);

    /** Pourcentage d'événements traités dans les 5 min sur 7 jours. */
    @Query(value = "SELECT CASE WHEN COUNT(*) = 0 THEN 1.0 " +
            "ELSE COUNT(*) FILTER (" +
            "WHERE EXTRACT(EPOCH FROM (processed_at - received_at)) <= 300" +
            ")::float / COUNT(*)::float END " +
            "FROM catalog_webhook_event " +
            "WHERE state = 'DONE' AND received_at >= :since AND processed_at IS NOT NULL",
            nativeQuery = true)
    Double percentInDelay(@Param("since") Instant since);
}
