package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CertificationHistory;
import io.movetodata.catalog.library.models.ColumnMeta;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CertificationHistoryRepository;
import io.movetodata.catalog.library.repository.ColumnMetaRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CRUD controller for Data Catalog — Data Products.
 *
 * Endpoints:
 *   GET    /api/catalog/data-products               — list (with optional ?q=, ?domain=, ?quality=, ?limit=, ?offset=)
 *   GET    /api/catalog/data-products/{name}        — get by name
 *   POST   /api/catalog/data-products               — create
 *   PUT    /api/catalog/data-products/{name}        — update
 *   DELETE /api/catalog/data-products/{name}        — delete
 *   POST   /api/catalog/data-products/{name}/certify           — certify (updates qualityLevel + appends history)
 *   GET    /api/catalog/data-products/{name}/certifications    — certification history
 *
 * All endpoints require CONNECT_ADMIN role.
 * No service layer — direct repository access following established project patterns.
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog/data-products")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Data Products", description = "Manage Data Products in the native Data Catalog.")
public class CatalogController {

    private final DataProductRepository dataProductRepository;
    private final CertificationHistoryRepository certificationHistoryRepository;
    private final ColumnMetaRepository columnMetaRepository;

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products — list with optional filters
    // -------------------------------------------------------------------------

    @Operation(summary = "List data products with optional search and filters.")
    @GetMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<DataProduct>> listDataProducts(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(value = "q",       required = false) String q,
            @RequestParam(value = "domain",  required = false) String domain,
            @RequestParam(value = "quality", required = false) String quality,
            @RequestParam(value = "limit",   required = false, defaultValue = "20") int limit,
            @RequestParam(value = "offset",  required = false, defaultValue = "0")  int offset) {

        List<DataProduct> results;

        if (q != null && !q.trim().isEmpty()) {
            results = dataProductRepository.search(q.trim());
        } else if (domain != null && !domain.trim().isEmpty()) {
            results = dataProductRepository.findByDomainIdOrderByCreatedAtDesc(domain.trim());
        } else if (quality != null && !quality.trim().isEmpty()) {
            results = dataProductRepository.findByQualityLevelOrderByCreatedAtDesc(quality.trim());
        } else {
            results = dataProductRepository.findAll();
        }

        // Apply secondary filters when q was used as primary (domain + quality are independent axes)
        if (q != null && !q.trim().isEmpty()) {
            if (domain != null && !domain.trim().isEmpty()) {
                final String domainFilter = domain.trim();
                results = results.stream()
                        .filter(dp -> domainFilter.equals(dp.getDomainId()))
                        .collect(Collectors.toList());
            }
            if (quality != null && !quality.trim().isEmpty()) {
                final String qualityFilter = quality.trim();
                results = results.stream()
                        .filter(dp -> qualityFilter.equals(dp.getQualityLevel()))
                        .collect(Collectors.toList());
            }
        }

        // Apply pagination
        int total = results.size();
        int from  = Math.min(offset, total);
        int to    = Math.min(from + limit, total);
        results = results.subList(from, to);

        return ResponseEntity.ok(results);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name} — get one by name
    // -------------------------------------------------------------------------

    @Operation(summary = "Get a data product by name.")
    @GetMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<DataProduct> getDataProduct(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        return dataProductRepository.findByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/data-products — create
    // -------------------------------------------------------------------------

    @Operation(summary = "Create a new data product.")
    @PostMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<DataProduct> createDataProduct(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        String name = body.getOrDefault("name", "").toString().trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        DataProduct dp = DataProduct.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .displayName(body.containsKey("displayName")
                        ? body.get("displayName") != null ? body.get("displayName").toString() : null
                        : null)
                .description(body.containsKey("description")
                        ? body.get("description") != null ? body.get("description").toString() : null
                        : null)
                .dataProductType(body.containsKey("dataProductType")
                        ? body.get("dataProductType") != null ? body.get("dataProductType").toString() : null
                        : null)
                .accessPolicy(body.containsKey("accessPolicy")
                        ? body.get("accessPolicy") != null ? body.get("accessPolicy").toString() : null
                        : null)
                .qualityLevel(body.containsKey("qualityLevel")
                        ? body.get("qualityLevel") != null ? body.get("qualityLevel").toString() : null
                        : null)
                .domainId(body.containsKey("domainId")
                        ? body.get("domainId") != null ? body.get("domainId").toString() : null
                        : null)
                .useCases(body.containsKey("useCases")
                        ? body.get("useCases") != null ? body.get("useCases").toString() : null
                        : null)
                .createdBy(authUser.getId())
                .build();

        DataProduct saved = dataProductRepository.save(dp);
        log.info("Data product created: id={} name={} by user={}", saved.getId(), saved.getName(), authUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // -------------------------------------------------------------------------
    // PUT /api/catalog/data-products/{name} — update
    // -------------------------------------------------------------------------

    @Operation(summary = "Update an existing data product.")
    @PutMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<DataProduct> updateDataProduct(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestBody Map<String, Object> body) {

        return dataProductRepository.findByName(name)
                .map(existing -> {
                    if (body.containsKey("name")) {
                        String newName = body.get("name") != null ? body.get("name").toString().trim() : "";
                        if (!newName.isEmpty()) {
                            existing.setName(newName);
                        }
                    }
                    if (body.containsKey("displayName")) {
                        existing.setDisplayName(
                                body.get("displayName") != null ? body.get("displayName").toString() : null);
                    }
                    if (body.containsKey("description")) {
                        existing.setDescription(
                                body.get("description") != null ? body.get("description").toString() : null);
                    }
                    if (body.containsKey("dataProductType")) {
                        existing.setDataProductType(
                                body.get("dataProductType") != null ? body.get("dataProductType").toString() : null);
                    }
                    if (body.containsKey("accessPolicy")) {
                        existing.setAccessPolicy(
                                body.get("accessPolicy") != null ? body.get("accessPolicy").toString() : null);
                    }
                    if (body.containsKey("qualityLevel")) {
                        existing.setQualityLevel(
                                body.get("qualityLevel") != null ? body.get("qualityLevel").toString() : null);
                    }
                    if (body.containsKey("domainId")) {
                        existing.setDomainId(
                                body.get("domainId") != null ? body.get("domainId").toString() : null);
                    }
                    if (body.containsKey("useCases")) {
                        existing.setUseCases(
                                body.get("useCases") != null ? body.get("useCases").toString() : null);
                    }
                    DataProduct updated = dataProductRepository.save(existing);
                    log.info("Data product updated: id={} by user={}", updated.getId(), authUser.getId());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/catalog/data-products/{name} — delete
    // -------------------------------------------------------------------------

    @Operation(summary = "Delete a data product.")
    @DeleteMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteDataProduct(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        dataProductRepository.delete(opt.get());
        log.info("Data product deleted: name={} by user={}", name, authUser.getId());
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/data-products/{name}/certify — certify quality level
    // -------------------------------------------------------------------------

    @Operation(summary = "Certify a data product's quality level.")
    @PostMapping("/{name}/certify")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<DataProduct> certifyDataProduct(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestBody Map<String, Object> body) {

        String qualityLevel = body.containsKey("qualityLevel") && body.get("qualityLevel") != null
                ? body.get("qualityLevel").toString().trim()
                : "";
        if (qualityLevel.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DataProduct dp = opt.get();

        // Append certification history
        CertificationHistory history = CertificationHistory.builder()
                .id(UUID.randomUUID().toString())
                .dataProductId(dp.getId())
                .qualityLevel(qualityLevel)
                .comment(body.containsKey("comment") && body.get("comment") != null
                        ? body.get("comment").toString()
                        : null)
                .certifiedBy(authUser.getId())
                .build();
        certificationHistoryRepository.save(history);

        // Update the data product's current quality level
        dp.setQualityLevel(qualityLevel);
        DataProduct updated = dataProductRepository.save(dp);

        log.info("Data product certified: id={} qualityLevel={} by user={}", dp.getId(), qualityLevel, authUser.getId());
        return ResponseEntity.ok(updated);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/certifications — certification history
    // -------------------------------------------------------------------------

    @Operation(summary = "Get the certification history of a data product.")
    @GetMapping("/{name}/certifications")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CertificationHistory>> getCertifications(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<CertificationHistory> history =
                certificationHistoryRepository.findByDataProductIdOrderByCertifiedAtDesc(opt.get().getId());
        return ResponseEntity.ok(history);
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/data-products/{name}/compute-trust-score
    // -------------------------------------------------------------------------

    @Operation(summary = "Compute and persist the trust score for a data product.")
    @PostMapping("/{name}/compute-trust-score")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<DataProduct> computeTrustScore(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DataProduct dp = opt.get();

        // documentation_score: one point per non-null/non-blank metadata field (max 4)
        double docScore = 0.0;
        if (dp.getDescription() != null && !dp.getDescription().isBlank()) docScore += 0.25;
        if (dp.getDomainId() != null) docScore += 0.25;
        if (dp.getOwnerId() != null) docScore += 0.25;
        if (dp.getQualityLevel() != null) docScore += 0.25;

        // certification_score: derived from qualityLevel
        double certScore = 0.0;
        if ("GOLD".equals(dp.getQualityLevel()))        certScore = 1.0;
        else if ("SILVER".equals(dp.getQualityLevel())) certScore = 0.6;
        else if ("BRONZE".equals(dp.getQualityLevel())) certScore = 0.3;

        // trust_score = 40% doc + 30% cert + 30% fixed placeholder
        // (quality/freshness metrics require Phase 4 integration)
        double trustScore = 0.40 * docScore + 0.30 * certScore + 0.30 * 0.5;
        dp.setTrustScore(BigDecimal.valueOf(trustScore).setScale(2, java.math.RoundingMode.HALF_UP));
        dataProductRepository.save(dp);

        log.info("Trust score computed: id={} score={} by user={}", dp.getId(), dp.getTrustScore(), authUser.getId());
        return ResponseEntity.ok(dp);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/columns — list column metadata
    // -------------------------------------------------------------------------

    @Operation(summary = "List column metadata for a data product.")
    @GetMapping("/{name}/columns")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<ColumnMeta>> listColumns(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DataProduct dp = opt.get();
        // Phase 2: DataProduct id is used as the dataset pivot UUID.
        List<ColumnMeta> columns =
                columnMetaRepository.findByDatasetIdAndBranch(UUID.fromString(dp.getId()), "master");
        return ResponseEntity.ok(columns);
    }

    // -------------------------------------------------------------------------
    // PATCH /api/catalog/data-products/{name}/columns/{col} — update column meta
    // -------------------------------------------------------------------------

    @Operation(summary = "Update column metadata for a data product.")
    @PatchMapping("/{name}/columns/{col}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<ColumnMeta> updateColumn(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @PathVariable("col") String col,
            @RequestBody Map<String, Object> body) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DataProduct dp = opt.get();
        UUID datasetId = UUID.fromString(dp.getId());

        // Find or create the ColumnMeta row
        ColumnMeta cm = columnMetaRepository
                .findByDatasetIdAndBranchAndColumnName(datasetId, "master", col)
                .orElseGet(() -> ColumnMeta.builder()
                        .id(UUID.randomUUID().toString())
                        .datasetId(datasetId)
                        .branch("master")
                        .columnName(col)
                        .build());

        if (body.containsKey("description")) {
            cm.setDescription(body.get("description") != null ? body.get("description").toString() : null);
        }
        if (body.containsKey("piiType")) {
            cm.setPiiType(body.get("piiType") != null ? body.get("piiType").toString() : null);
        }
        if (body.containsKey("retentionDays")) {
            if (body.get("retentionDays") != null) {
                cm.setRetentionDays(Integer.valueOf(body.get("retentionDays").toString()));
            } else {
                cm.setRetentionDays(null);
            }
        }

        ColumnMeta saved = columnMetaRepository.save(cm);
        log.info("Column meta updated: dataProduct={} column={} by user={}", name, col, authUser.getId());
        return ResponseEntity.ok(saved);
    }
}
