package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.dto.LineageGraph;
import io.movetodata.catalog.library.services.CatalogLineageGraphService;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Lineage endpoint for the native Data Catalog (Lot 5).
 *
 * <pre>
 *   GET /api/catalog/lineage/{dataProductName}
 *       ?depthUpstream=2&amp;depthDownstream=2
 *       → LineageGraph
 * </pre>
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog/lineage")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Lineage", description = "Compute enriched data lineage graphs for Data Products.")
public class CatalogLineageController {

    private final CatalogLineageGraphService catalogLineageGraphService;

    // -------------------------------------------------------------------------
    // GET /api/catalog/lineage/{dataProductName}
    // -------------------------------------------------------------------------

    @Operation(summary = "Get enriched lineage graph for a Data Product.")
    @GetMapping("/{dataProductName}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<LineageGraph> getLineage(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("dataProductName") String dataProductName,
            @RequestParam(name = "depthUpstream",   defaultValue = "2") int depthUpstream,
            @RequestParam(name = "depthDownstream", defaultValue = "2") int depthDownstream) {

        try {
            LineageGraph graph = catalogLineageGraphService.buildLineageGraph(
                    dataProductName, depthUpstream, depthDownstream);
            log.debug("Lineage graph for '{}' requested by user={}: {} nodes, {} edges",
                    dataProductName, authUser.getId(), graph.getNodes().size(), graph.getEdges().size());
            return ResponseEntity.ok(graph);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error building lineage graph for '{}'", dataProductName, e);
            throw e;
        }
    }
}
