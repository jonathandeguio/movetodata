package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogDatasetStatsRepository extends JpaRepository<CatalogDatasetStats, String> {

    /** Last 30 snapshots ordered by most-recent first — used for z-score window. */
    List<CatalogDatasetStats> findTop30ByDataProductIdOrderByMeasuredAtDesc(String dataProductId);

    /** Recent N snapshots for UI trend display (most-recent first). */
    List<CatalogDatasetStats> findTop10ByDataProductIdOrderByMeasuredAtDesc(String dataProductId);
}
