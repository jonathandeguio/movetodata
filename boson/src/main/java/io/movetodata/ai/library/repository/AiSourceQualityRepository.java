package io.movetodata.ai.library.repository;

import io.movetodata.ai.library.models.AiSourceQuality;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link AiSourceQuality} — F4 Smart Connector.
 */
@Repository
public interface AiSourceQualityRepository extends JpaRepository<AiSourceQuality, Long> {

    Optional<AiSourceQuality> findBySourceId(UUID sourceId);

    /** Batch lookup used by the frontend quality badge (one call for all visible sources). */
    List<AiSourceQuality> findBySourceIdIn(List<UUID> sourceIds);
}
