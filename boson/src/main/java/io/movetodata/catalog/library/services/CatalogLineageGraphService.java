package io.movetodata.catalog.library.services;

import io.movetodata.catalog.library.dto.LineageEdge;
import io.movetodata.catalog.library.dto.LineageGraph;
import io.movetodata.catalog.library.dto.LineageNode;
import io.movetodata.catalog.library.models.CatalogLineageEdge;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogLineageEdgeRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds enriched lineage graphs for the Data Catalog (Lot 5).
 *
 * <p>Traversal strategy: recursive DFS from the focus DataProduct node,
 * bounded by {@code depthUpstream} / {@code depthDownstream}. A visited-node
 * set prevents cycles. Each edge is added at most once (deduplicated by id).</p>
 *
 * <p>Source of truth: {@code catalog_lineage_edge} table, populated by
 * pipeline orchestration (ETL, dbt, Spark jobs…).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogLineageGraphService {

    public static final int MAX_DEPTH = 5;

    private final CatalogLineageEdgeRepository lineageEdgeRepository;
    private final DataProductRepository dataProductRepository;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Build a {@link LineageGraph} centred on the DataProduct identified by name.
     *
     * @param dataProductName name (slug) of the focal DataProduct
     * @param depthUpstream   max upstream hops (capped at {@value MAX_DEPTH})
     * @param depthDownstream max downstream hops (capped at {@value MAX_DEPTH})
     * @return complete lineage graph
     * @throws ResponseStatusException 404 if the DataProduct is not found
     */
    public LineageGraph buildLineageGraph(String dataProductName,
                                          int depthUpstream,
                                          int depthDownstream) {

        int effUp   = Math.min(Math.max(depthUpstream,   0), MAX_DEPTH);
        int effDown = Math.min(Math.max(depthDownstream, 0), MAX_DEPTH);

        DataProduct dp = dataProductRepository.findByName(dataProductName)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "DataProduct not found: " + dataProductName));

        String focusId = dp.getId();

        // Mutable node map: id → NodeData (preserves insertion order)
        Map<String, NodeData> nodeMap = new LinkedHashMap<>();
        // Collected edges (deduplicated by edge id)
        List<LineageEdge> edges = new ArrayList<>();
        Set<String> addedEdgeIds = new HashSet<>();

        // Insert focus node
        NodeData focusData = new NodeData();
        focusData.id           = focusId;
        focusData.name         = dp.getName();
        focusData.type         = "DATA_PRODUCT";
        focusData.qualityLevel = dp.getQualityLevel();
        focusData.isFocus      = true;
        nodeMap.put(focusId, focusData);

        // Traverse
        collectUpstream(focusId, 0, effUp, nodeMap, edges, addedEdgeIds, focusId);
        collectDownstream(focusId, 0, effDown, nodeMap, edges, addedEdgeIds, focusId);

        // Enrich qualityLevel for non-focus DATA_PRODUCT nodes
        for (NodeData nd : nodeMap.values()) {
            if (!nd.isFocus && "DATA_PRODUCT".equals(nd.type) && nd.qualityLevel == null) {
                dataProductRepository.findById(nd.id)
                        .ifPresent(p -> nd.qualityLevel = p.getQualityLevel());
            }
        }

        // Populate inputIds / outputIds from collected edges
        for (LineageEdge e : edges) {
            NodeData src = nodeMap.get(e.getSourceId());
            NodeData tgt = nodeMap.get(e.getTargetId());
            if (src != null) src.outputIds.add(e.getTargetId());
            if (tgt != null) tgt.inputIds.add(e.getSourceId());
        }

        // Build result nodes
        List<LineageNode> resultNodes = nodeMap.values().stream()
                .map(nd -> LineageNode.builder()
                        .id(nd.id)
                        .name(nd.name)
                        .type(nd.type)
                        .qualityLevel(nd.qualityLevel)
                        .isFocus(nd.isFocus)
                        .engine(nd.engine)
                        .lastRunAt(nd.lastRunAt != null ? nd.lastRunAt.toString() : null)
                        .durationMs(nd.durationMs)
                        .inputRows(nd.inputRows)
                        .outputRows(nd.outputRows)
                        .inputIds(List.copyOf(nd.inputIds))
                        .outputIds(List.copyOf(nd.outputIds))
                        .build())
                .collect(Collectors.toList());

        log.debug("LineageGraph built for '{}': {} nodes, {} edges", dataProductName,
                resultNodes.size(), edges.size());

        return LineageGraph.builder()
                .nodes(resultNodes)
                .edges(edges)
                .focusNodeId(focusId)
                .build();
    }

    // -------------------------------------------------------------------------
    // Private traversal
    // -------------------------------------------------------------------------

    private void collectUpstream(String nodeId, int depth, int maxDepth,
                                  Map<String, NodeData> nodeMap,
                                  List<LineageEdge> edges,
                                  Set<String> addedEdgeIds,
                                  String focusId) {
        if (depth >= maxDepth) return;

        List<CatalogLineageEdge> upEdges = lineageEdgeRepository.findByDownstreamId(nodeId);
        for (CatalogLineageEdge le : upEdges) {
            if (addedEdgeIds.contains(le.getId())) continue;
            addedEdgeIds.add(le.getId());

            String sourceId     = le.getUpstreamId();
            boolean onFocusPath = nodeId.equals(focusId) || sourceId.equals(focusId);

            edges.add(LineageEdge.builder()
                    .id(le.getId())
                    .sourceId(sourceId)
                    .targetId(nodeId)
                    .isOnFocusPath(onFocusPath)
                    .build());

            boolean isNew = !nodeMap.containsKey(sourceId);
            if (isNew) {
                NodeData nd = buildNodeData(sourceId, le.getUpstreamName(), le.getUpstreamType(), le);
                nodeMap.put(sourceId, nd);
            }

            if (isNew) {
                collectUpstream(sourceId, depth + 1, maxDepth, nodeMap, edges, addedEdgeIds, focusId);
            }
        }
    }

    private void collectDownstream(String nodeId, int depth, int maxDepth,
                                    Map<String, NodeData> nodeMap,
                                    List<LineageEdge> edges,
                                    Set<String> addedEdgeIds,
                                    String focusId) {
        if (depth >= maxDepth) return;

        List<CatalogLineageEdge> downEdges = lineageEdgeRepository.findByUpstreamId(nodeId);
        for (CatalogLineageEdge le : downEdges) {
            if (addedEdgeIds.contains(le.getId())) continue;
            addedEdgeIds.add(le.getId());

            String targetId     = le.getDownstreamId();
            boolean onFocusPath = nodeId.equals(focusId) || targetId.equals(focusId);

            edges.add(LineageEdge.builder()
                    .id(le.getId())
                    .sourceId(nodeId)
                    .targetId(targetId)
                    .isOnFocusPath(onFocusPath)
                    .build());

            boolean isNew = !nodeMap.containsKey(targetId);
            if (isNew) {
                NodeData nd = buildNodeData(targetId, le.getDownstreamName(), le.getDownstreamType(), le);
                nodeMap.put(targetId, nd);
            }

            if (isNew) {
                collectDownstream(targetId, depth + 1, maxDepth, nodeMap, edges, addedEdgeIds, focusId);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Build a mutable NodeData from an edge's entity fields.
     * Transformation metadata is copied from the edge for TRANSFORMATION nodes.
     */
    private static NodeData buildNodeData(String id, String name, String type,
                                           CatalogLineageEdge edge) {
        NodeData nd   = new NodeData();
        nd.id         = id;
        nd.name       = name;
        nd.type       = type;
        nd.isFocus    = false;
        // Populate transformation metadata regardless of type — the UI filters
        nd.engine     = edge.getTransformationEngine();
        nd.lastRunAt  = edge.getLastRunAt();
        nd.durationMs = edge.getDurationMs();
        nd.inputRows  = edge.getInputRows();
        nd.outputRows = edge.getOutputRows();
        return nd;
    }

    // -------------------------------------------------------------------------
    // Inner class — mutable node state during graph construction
    // -------------------------------------------------------------------------

    private static class NodeData {
        String id;
        String name;
        String type;
        String qualityLevel;
        boolean isFocus;
        String engine;
        Instant lastRunAt;
        Long durationMs;
        Long inputRows;
        Long outputRows;
        final List<String> inputIds  = new ArrayList<>();
        final List<String> outputIds = new ArrayList<>();
    }
}
