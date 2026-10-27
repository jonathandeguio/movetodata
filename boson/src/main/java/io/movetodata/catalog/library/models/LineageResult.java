package io.movetodata.catalog.library.models;

import lombok.*;

import java.util.List;

/**
 * Result structure for Data Catalog lineage queries (Phase 2).
 *
 * Holds the central entity (dataset or dataProduct pivot) and the directed
 * edges that connect it to upstream (producers) and downstream (consumers).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineageResult {

    /** The entity whose lineage is being represented. */
    private EntityRef entity;

    /** Pipelines whose target is this entity (producers). */
    private List<LineageEdge> upstreamEdges;

    /** Pipelines whose source is this entity (consumers). */
    private List<LineageEdge> downstreamEdges;

    // -------------------------------------------------------------------------
    // Inner classes
    // -------------------------------------------------------------------------

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntityRef {
        /** UUID as string. */
        private String id;
        /** Human-readable label. In Phase 2 this is the UUID string when no name is available. */
        private String name;
        /** "dataset" or "dataProduct". */
        private String type;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineageEdge {
        private EntityRef fromEntity;
        private EntityRef toEntity;
    }
}
