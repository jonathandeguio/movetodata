package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.models.LineageResult;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.library.services.CatalogLineageService;
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

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Lineage endpoint for the native Data Catalog (Phase 2).
 *
 * Endpoints:
 *   GET /api/catalog/lineage/{dataProductName} — compute and return lineage for a DataProduct
 *
 * Phase 2 approximation: the DataProduct's own {@code id} is used as the dataset pivot.
 * Phase 3 will resolve the real linked dataset UUID from {@code catalog_data_product_dataset}.
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog/lineage")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Lineage", description = "Compute data lineage for Data Products.")
public class CatalogLineageController {

    private final DataProductRepository dataProductRepository;
    private final CatalogLineageService catalogLineageService;

    // -------------------------------------------------------------------------
    // GET /api/catalog/lineage/{dataProductName}
    // -------------------------------------------------------------------------

    @Operation(summary = "Get lineage graph for a data product.")
    @GetMapping("/{dataProductName}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<LineageResult> getLineage(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("dataProductName") String dataProductName) {

        Optional<DataProduct> opt = dataProductRepository.findByName(dataProductName);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DataProduct dp = opt.get();

        // If the DataProduct has no id (should not happen in practice), return an empty result.
        if (dp.getId() == null || dp.getId().isBlank()) {
            LineageResult empty = LineageResult.builder()
                    .entity(LineageResult.EntityRef.builder()
                            .id(null)
                            .name(dp.getName())
                            .type("dataProduct")
                            .build())
                    .upstreamEdges(Collections.emptyList())
                    .downstreamEdges(Collections.emptyList())
                    .build();
            return ResponseEntity.ok(empty);
        }

        UUID pivotId = UUID.fromString(dp.getId());

        // Phase 2: use the DataProduct id as the dataset pivot.
        // The service returns an EntityRef typed "dataset" for the pivot; we override the central
        // entity here to reflect the DataProduct semantic.
        LineageResult result = catalogLineageService.getLineageForDataset(pivotId, "master", 3);

        // Replace the central entity with DataProduct-typed ref for clarity in the response.
        LineageResult.EntityRef central = LineageResult.EntityRef.builder()
                .id(dp.getId())
                .name(dp.getName())
                .type("dataProduct")
                .build();

        LineageResult response = LineageResult.builder()
                .entity(central)
                .upstreamEdges(result.getUpstreamEdges())
                .downstreamEdges(result.getDownstreamEdges())
                .build();

        log.debug("Lineage requested for dataProduct={} by user={}", dataProductName, authUser.getId());
        return ResponseEntity.ok(response);
    }
}
