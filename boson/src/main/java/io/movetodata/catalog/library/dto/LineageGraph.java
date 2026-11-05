package io.movetodata.catalog.library.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Full lineage graph centered on a DataProduct (Lot 5).
 *
 * Returned by {@code GET /api/catalog/lineage/{dataProductName}}.
 */
@Getter
@Builder
public class LineageGraph {

    private List<LineageNode> nodes;
    private List<LineageEdge> edges;
    /** ID of the DataProduct node that is the focus of the graph. */
    private String focusNodeId;
}
