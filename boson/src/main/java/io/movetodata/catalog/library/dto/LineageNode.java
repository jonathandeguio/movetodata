package io.movetodata.catalog.library.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * A node in the enriched lineage graph (Lot 5).
 *
 * {@code type}: DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD
 */
@Getter
@Builder
public class LineageNode {

    private String id;
    private String name;
    /** DATASET | TRANSFORMATION | DATA_PRODUCT | DASHBOARD */
    private String type;
    /** BRONZE | SILVER | GOLD — only set for DATA_PRODUCT nodes. */
    private String qualityLevel;
    private boolean isFocus;

    // Transformation metadata (populated from adjacent edge, null otherwise)
    private String engine;
    private String lastRunAt;
    private Long durationMs;
    private Long inputRows;
    private Long outputRows;

    /** IDs of nodes that feed into this node. */
    private List<String> inputIds;
    /** IDs of nodes this node feeds into. */
    private List<String> outputIds;
}
