package io.movetodata.catalog.library.services;

import io.movetodata.bezier.library.models.PipelineModel;
import io.movetodata.bezier.library.repository.PipelineRepository;
import io.movetodata.catalog.library.models.LineageResult;
import io.movetodata.catalog.library.models.LineageResult.EntityRef;
import io.movetodata.catalog.library.models.LineageResult.LineageEdge;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Computes lineage for a dataset pivot by walking {@code bezier_pipeline} edges.
 *
 * <p>Phase 2 constraint: dataset names are not resolved here (would require a
 * call to kitab). The {@code EntityRef.name} field is set to the UUID string.</p>
 *
 * <p>Cycle protection: a {@code Set<UUID> visited} is maintained across the
 * recursive walk so each node is expanded at most once per direction.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogLineageService {

    /** Maximum recursion depth — prevents runaway traversal on cyclic graphs. */
    public static final int MAX_DEPTH = 3;

    private final PipelineRepository pipelineRepository;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Build a {@link LineageResult} centred on {@code datasetId}.
     *
     * @param datasetId pivot dataset UUID
     * @param branch    branch name (e.g. "master") — passed through for future use
     * @param depth     maximum traversal depth, capped at {@value MAX_DEPTH}
     * @return lineage graph relative to the pivot
     */
    public LineageResult getLineageForDataset(UUID datasetId, String branch, int depth) {
        int effectiveDepth = Math.min(depth, MAX_DEPTH);

        EntityRef central = datasetRef(datasetId);

        List<LineageEdge> upstreamEdges   = new ArrayList<>();
        List<LineageEdge> downstreamEdges = new ArrayList<>();

        Set<UUID> visitedUp   = new HashSet<>();
        Set<UUID> visitedDown = new HashSet<>();
        visitedUp.add(datasetId);
        visitedDown.add(datasetId);

        collectUpstream(datasetId, effectiveDepth, visitedUp, upstreamEdges);
        collectDownstream(datasetId, effectiveDepth, visitedDown, downstreamEdges);

        log.debug("Lineage for dataset={}: upstream={} downstream={}",
                datasetId, upstreamEdges.size(), downstreamEdges.size());

        return LineageResult.builder()
                .entity(central)
                .upstreamEdges(upstreamEdges)
                .downstreamEdges(downstreamEdges)
                .build();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void collectUpstream(UUID targetId, int remainingDepth,
                                 Set<UUID> visited, List<LineageEdge> edges) {
        if (remainingDepth <= 0) {
            return;
        }
        List<PipelineModel> pipelines = pipelineRepository.findAllByTargetDataset(targetId);
        for (PipelineModel pipeline : pipelines) {
            UUID sourceId = pipeline.getSourceDataset();
            if (sourceId == null) {
                continue;
            }
            edges.add(LineageEdge.builder()
                    .fromEntity(datasetRef(sourceId))
                    .toEntity(datasetRef(targetId))
                    .build());
            if (!visited.contains(sourceId)) {
                visited.add(sourceId);
                collectUpstream(sourceId, remainingDepth - 1, visited, edges);
            }
        }
    }

    private void collectDownstream(UUID sourceId, int remainingDepth,
                                   Set<UUID> visited, List<LineageEdge> edges) {
        if (remainingDepth <= 0) {
            return;
        }
        List<PipelineModel> pipelines = pipelineRepository.findAllBySourceDataset(sourceId);
        for (PipelineModel pipeline : pipelines) {
            UUID targetId = pipeline.getTargetDataset();
            if (targetId == null) {
                continue;
            }
            edges.add(LineageEdge.builder()
                    .fromEntity(datasetRef(sourceId))
                    .toEntity(datasetRef(targetId))
                    .build());
            if (!visited.contains(targetId)) {
                visited.add(targetId);
                collectDownstream(targetId, remainingDepth - 1, visited, edges);
            }
        }
    }

    private static EntityRef datasetRef(UUID id) {
        String s = id.toString();
        return EntityRef.builder()
                .id(s)
                .name(s)
                .type("dataset")
                .build();
    }
}
