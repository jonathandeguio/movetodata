package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;

/**
 * Edge in the Data Catalog lineage graph (Lot 5).
 *
 * Each row represents a directed data-flow link between two entities.
 * Both upstream and downstream entities are identified by their id (string UUID)
 * and typed as DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_lineage_edge")
public class CatalogLineageEdge {

    @Id
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "upstream_id", length = 255, nullable = false)
    private String upstreamId;

    /** DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD */
    @Column(name = "upstream_type", length = 50, nullable = false)
    private String upstreamType;

    @Column(name = "upstream_name", length = 255, nullable = false)
    private String upstreamName;

    @Column(name = "downstream_id", length = 255, nullable = false)
    private String downstreamId;

    /** DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD */
    @Column(name = "downstream_type", length = 50, nullable = false)
    private String downstreamType;

    @Column(name = "downstream_name", length = 255, nullable = false)
    private String downstreamName;

    /** e.g. Spark, dbt, Python, SQL */
    @Column(name = "transformation_engine", length = 100)
    private String transformationEngine;

    @Column(name = "transformation_script", columnDefinition = "TEXT")
    private String transformationScript;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "input_rows")
    private Long inputRows;

    @Column(name = "output_rows")
    private Long outputRows;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
