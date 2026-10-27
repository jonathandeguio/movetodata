package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogProductView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface CatalogProductViewRepository extends JpaRepository<CatalogProductView, String> {

    /** Count views for a product in the last N days (for usage_score). */
    @Query("SELECT COUNT(v) FROM CatalogProductView v " +
           "WHERE v.dataProductId = :dpId AND v.viewedAt >= :since")
    long countRecentViews(@Param("dpId") String dataProductId, @Param("since") Instant since);

    /** Approximate platform median (average views per product across all products). */
    @Query("SELECT COALESCE(AVG(sub.cnt), 1) FROM " +
           "(SELECT COUNT(v) AS cnt FROM CatalogProductView v " +
           " WHERE v.viewedAt >= :since GROUP BY v.dataProductId) sub")
    double avgViewsPerProduct(@Param("since") Instant since);
}
