package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogRestrictedAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CatalogRestrictedAccessLogRepository
        extends JpaRepository<CatalogRestrictedAccessLog, UUID> {

    List<CatalogRestrictedAccessLog> findByAssetIdOrderByCreatedAtDesc(String assetId);

    List<CatalogRestrictedAccessLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<CatalogRestrictedAccessLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            Instant start, Instant end);
}
