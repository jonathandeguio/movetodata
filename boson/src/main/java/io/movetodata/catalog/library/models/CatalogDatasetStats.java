package io.movetodata.catalog.library.models;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Volume + column distribution snapshot for a Data Product.
 * Used to compute z-score drift detection over a rolling 30-snapshot window.
 *
 * driftScore: z-score of recordCount vs last 30 snapshots (|z| > 2 → driftAlert = true)
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_dataset_stats")
public class CatalogDatasetStats {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private String id;

    @Column(name = "data_product_id", columnDefinition = "uuid", nullable = false)
    private String dataProductId;

    @Column(name = "record_count", nullable = false)
    private long recordCount;

    /** JSON map: {columnName: {nullCount, distinctCount, min, max}} */
    @Column(name = "column_stats", columnDefinition = "TEXT")
    private String columnStats;

    @Column(name = "drift_score", precision = 6, scale = 3)
    private BigDecimal driftScore;

    @Column(name = "drift_alert", nullable = false)
    private boolean driftAlert;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;
}
