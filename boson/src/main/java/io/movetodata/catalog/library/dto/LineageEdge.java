package io.movetodata.catalog.library.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * A directed edge in the enriched lineage graph (Lot 5).
 *
 * {@code isOnFocusPath} is true when this edge is directly connected to the
 * central DataProduct node (depth 1 from focus in either direction).
 */
@Getter
@Builder
public class LineageEdge {

    private String id;
    private String sourceId;
    private String targetId;
    private boolean isOnFocusPath;
}
