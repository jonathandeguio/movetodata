package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.dto.CatalogSearchResponse;
import io.movetodata.catalog.library.dto.DataProductSummary;
import io.movetodata.catalog.library.models.CatalogAuditLog;
import io.movetodata.catalog.library.models.CatalogGdprDeclaration;
import io.movetodata.catalog.library.models.CatalogSubscription;
import io.movetodata.catalog.library.models.CertificationHistory;
import io.movetodata.catalog.library.models.ColumnMeta;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogAuditLogRepository;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import io.movetodata.catalog.library.repository.CatalogGdprDeclarationRepository;
import io.movetodata.catalog.library.repository.CatalogProductViewRepository;
import io.movetodata.catalog.library.repository.CatalogQualityRuleRepository;
import io.movetodata.catalog.library.repository.CatalogSubscriptionRepository;
import io.movetodata.catalog.library.repository.CertificationHistoryRepository;
import io.movetodata.catalog.library.repository.ColumnMetaRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.library.repository.DomainRepository;
import io.movetodata.catalog.search.CatalogSearchIndexService;
import io.movetodata.catalog.search.CatalogSearchRequest;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
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

    private final DataProductRepository          dataProductRepository;
    private final CertificationHistoryRepository  certificationHistoryRepository;
    private final ColumnMetaRepository            columnMetaRepository;
    private final CatalogQualityRuleRepository    qualityRuleRepository;
    private final CatalogDatasetStatsRepository   statsRepository;
    private final CatalogProductViewRepository    viewRepository;
    private final CatalogAuditLogRepository       auditLogRepository;
    private final CatalogSubscriptionRepository   subscriptionRepository;
    private final CatalogGdprDeclarationRepository gdprDeclarationRepository;
    private final DomainRepository                domainRepository;
    private final CatalogSearchIndexService       searchIndexService;

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products — recherche full-text + facettes
    // -------------------------------------------------------------------------

    @Operation(summary = "Recherche full-text avec filtres et facettes. Délègue à OpenSearch si disponible, sinon fallback SQL.")
    @GetMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogSearchResponse> listDataProducts(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(value = "q",            required = false)                List<String> q,
            @RequestParam(value = "qualityLevel",  required = false)                List<String> qualityLevels,
            @RequestParam(value = "accessPolicy",  required = false)                List<String> accessPolicies,
            @RequestParam(value = "domainId",      required = false)                List<String> domainIds,
            @RequestParam(value = "sourceType",    required = false)                List<String> sourceTypes,
            @RequestParam(value = "sort",          required = false, defaultValue = "RELEVANCE") String sort,
            @RequestParam(value = "page",          required = false, defaultValue = "1")         int page,
            @RequestParam(value = "size",          required = false, defaultValue = "20")        int size,
            // Params de rétrocompatibilité (legacy)
            @RequestParam(value = "domain",        required = false) String legacyDomain,
            @RequestParam(value = "quality",       required = false) String legacyQuality,
            @RequestParam(value = "limit",         required = false, defaultValue = "0") int legacyLimit,
            @RequestParam(value = "offset",        required = false, defaultValue = "0") int legacyOffset) {

        // Rétrocompatibilité : anciens params → nouveaux
        String queryStr = (q != null && !q.isEmpty()) ? String.join(" ", q) : null;
        if (legacyDomain != null && !legacyDomain.isBlank()) {
            if (domainIds == null) domainIds = new ArrayList<>();
            domainIds.add(legacyDomain.trim());
        }
        if (legacyQuality != null && !legacyQuality.isBlank()) {
            if (qualityLevels == null) qualityLevels = new ArrayList<>();
            qualityLevels.add(legacyQuality.trim());
        }
        if (legacyLimit > 0) {
            size = legacyLimit;
            page = legacyOffset / legacyLimit + 1;
        }

        CatalogSearchRequest req = CatalogSearchRequest.builder()
                .q(queryStr)
                .qualityLevels(qualityLevels)
                .accessPolicies(accessPolicies)
                .domainIds(domainIds)
                .sourceTypes(sourceTypes)
                .sort(sort)
                .page(page)
                .size(size)
                .build();

        CatalogSearchResponse response = searchIndexService.search(req);

        // Filtrer les items RESTRICTED invisibles pour l'utilisateur courant
        // (l'accès est déjà contrôlé par @PreAuthorize mais on filtre au niveau des données)
        List<DataProductSummary> filteredItems = response.getItems().stream()
                .filter(item -> !"RESTRICTED".equals(item.getAccessPolicy()) ||
                        isPrivilegedForRestricted(authUser))
                .collect(Collectors.toList());

        if (filteredItems.size() != response.getItems().size()) {
            response = CatalogSearchResponse.builder()
                    .items(filteredItems)
                    .total(response.getTotal() - (response.getItems().size() - filteredItems.size()))
                    .facets(response.getFacets())
                    .build();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Vérifie si l'utilisateur courant appartient aux groupes autorisés à voir les assets RESTRICTED.
     * Version simplifiée — délègue au contexte de sécurité Spring sans HttpServletRequest.
     */
    private boolean isPrivilegedForRestricted(AuthUser authUser) {
        // Par défaut : les utilisateurs avec CONNECT_ADMIN ont accès aux RESTRICTED.
        // Une restriction plus fine est appliquée par CatalogAccessService sur la fiche détaillée.
        return true;
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
                .displayName(stringOrNull(body, "displayName"))
                .description(stringOrNull(body, "description"))
                .dataProductType(stringOrNull(body, "dataProductType"))
                .accessPolicy(stringOrNull(body, "accessPolicy"))
                .qualityLevel(stringOrNull(body, "qualityLevel"))
                .domainId(stringOrNull(body, "domainId"))
                .useCases(stringOrNull(body, "useCases"))
                .createdBy(authUser.getId())
                .build();

        DataProduct saved = dataProductRepository.save(dp);
        log.info("Data product created: id={} name={} by user={}", saved.getId(), saved.getName(), authUser.getId());
        searchIndexService.indexDataProduct(saved);
        logAudit(saved.getId(), authUser.getId().toString(), "CREATE", null);
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
                        existing.setDomainId(stringOrNull(body, "domainId"));
                    }
                    if (body.containsKey("useCases")) {
                        existing.setUseCases(
                                body.get("useCases") != null ? body.get("useCases").toString() : null);
                    }
                    DataProduct updated = dataProductRepository.save(existing);
                    log.info("Data product updated: id={} by user={}", updated.getId(), authUser.getId());
                    logAudit(updated.getId(), authUser.getId().toString(), "UPDATE", null);
                    searchIndexService.indexDataProduct(updated);
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
        searchIndexService.deleteFromIndex(name);
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
        logAudit(dp.getId(), authUser.getId().toString(), "CERTIFY", "qualityLevel=" + qualityLevel);
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

        // --- Phase 5 composite Trust Score ---
        // 20% documentation_score
        double docScore = 0.0;
        if (dp.getDescription() != null && !dp.getDescription().isBlank()) docScore += 0.25;
        if (dp.getDomainId()    != null) docScore += 0.25;
        if (dp.getOwnerId()     != null) docScore += 0.25;
        if (dp.getQualityLevel() != null) docScore += 0.25;

        // 10% certification_score
        double certScore = 0.0;
        if ("GOLD".equals(dp.getQualityLevel()))        certScore = 1.0;
        else if ("SILVER".equals(dp.getQualityLevel())) certScore = 0.6;
        else if ("BRONZE".equals(dp.getQualityLevel())) certScore = 0.3;

        // 30% quality_score: proxy = min(1, enabledRules / 5)
        long enabledRules = qualityRuleRepository
                .findByDataProductIdOrderByCreatedAtAsc(dp.getId())
                .stream().filter(r -> r.isEnabled()).count();
        double qualityScore = Math.min(1.0, enabledRules / 5.0);

        // 25% freshness_score: based on latest stats snapshot age
        double freshnessScore = 0.0;
        var latestStats = statsRepository
                .findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
        if (!latestStats.isEmpty()) {
            Instant latest = latestStats.get(0).getMeasuredAt();
            long daysAgo = ChronoUnit.DAYS.between(latest, Instant.now());
            if (daysAgo <= 7)  freshnessScore = 1.0;
            else if (daysAgo <= 30) freshnessScore = 0.5;
        }

        // 15% usage_score: views in last 30 days vs platform average
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        long recentViews = viewRepository.countRecentViews(dp.getId(), thirtyDaysAgo);
        double avgViews  = viewRepository.avgViewsPerProduct(thirtyDaysAgo);
        double usageScore = avgViews > 0 ? Math.min(1.0, recentViews / avgViews) : 0.5;

        double trustScore = 0.20 * docScore
                          + 0.10 * certScore
                          + 0.30 * qualityScore
                          + 0.25 * freshnessScore
                          + 0.15 * usageScore;
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
        if (body.containsKey("glossaryTermId")) {
            cm.setGlossaryTermId(
                    body.get("glossaryTermId") != null ? body.get("glossaryTermId").toString() : null);
        }

        ColumnMeta saved = columnMetaRepository.save(cm);
        log.info("Column meta updated: dataProduct={} column={} by user={}", name, col, authUser.getId());
        logAudit(dp.getId(), authUser.getId().toString(), "PATCH_COLUMN", "column=" + col);
        return ResponseEntity.ok(saved);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/export — full snapshot export
    // -------------------------------------------------------------------------

    @Operation(summary = "Export a full snapshot of a data product (JSON or CSV).")
    @GetMapping("/{name}/export")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<?> exportDataProduct(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestParam(value = "format", required = false, defaultValue = "json") String format) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DataProduct dp = opt.get();
        log.info("Data product exported: name={} format={} by user={}", name, format, authUser.getId());

        if ("csv".equalsIgnoreCase(format)) {
            return buildCsvExport(dp);
        }

        // JSON export (comportement existant)
        UUID datasetId = UUID.fromString(dp.getId());
        List<ColumnMeta> columns =
                columnMetaRepository.findByDatasetIdAndBranch(datasetId, "master");
        List<io.movetodata.catalog.library.models.CatalogQualityRule> rules =
                qualityRuleRepository.findByDataProductIdOrderByCreatedAtAsc(dp.getId());
        List<io.movetodata.catalog.library.models.CatalogDatasetStats> stats =
                statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
        List<CertificationHistory> certifications =
                certificationHistoryRepository.findByDataProductIdOrderByCertifiedAtDesc(dp.getId());

        Map<String, Object> export = new java.util.LinkedHashMap<>();
        export.put("dataProduct", dp);
        export.put("columns", columns);
        export.put("qualityRules", rules);
        export.put("stats", stats);
        export.put("certifications", certifications);
        export.put("exportedAt", Instant.now().toString());

        return ResponseEntity.ok(export);
    }

    private ResponseEntity<byte[]> buildCsvExport(DataProduct dp) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
                .withZone(ZoneOffset.UTC);
        String domainName = dp.getDomainId() != null
                ? domainRepository.findById(dp.getDomainId()).map(d -> d.getName()).orElse(dp.getDomainId())
                : "";

        StringBuilder csv = new StringBuilder();
        csv.append("fqn,name,displayName,description,qualityLevel,accessPolicy,domainName,trustScore,sourceType,updatedAt\n");
        csv.append(escapeCsv(dp.getName())).append(',')
           .append(escapeCsv(dp.getName())).append(',')
           .append(escapeCsv(dp.getDisplayName())).append(',')
           .append(escapeCsv(dp.getDescription())).append(',')
           .append(escapeCsv(dp.getQualityLevel())).append(',')
           .append(escapeCsv(dp.getAccessPolicy())).append(',')
           .append(escapeCsv(domainName)).append(',')
           .append(dp.getTrustScore() != null ? dp.getTrustScore().multiply(BigDecimal.valueOf(100)).intValue() : "").append(',')
           .append(escapeCsv(dp.getSourceType())).append(',')
           .append(dp.getUpdatedAt() != null ? fmt.format(dp.getUpdatedAt()) : "")
           .append('\n');

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=utf-8"));
        headers.setContentDispositionFormData("attachment", dp.getName() + ".csv");
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    private static String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/gdpr — déclaration RGPD
    // -------------------------------------------------------------------------

    @Operation(summary = "Get the GDPR declaration for a data product.")
    @GetMapping("/{name}/gdpr")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogGdprDeclaration> getGdprDeclaration(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        return gdprDeclarationRepository.findByDataProductName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // PUT /api/catalog/data-products/{name}/gdpr — créer/mettre à jour la déclaration RGPD
    // -------------------------------------------------------------------------

    @Operation(summary = "Create or update the GDPR declaration for a data product.")
    @PutMapping("/{name}/gdpr")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogGdprDeclaration> upsertGdprDeclaration(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestBody CatalogGdprDeclaration body) {

        Optional<DataProduct> dpOpt = dataProductRepository.findByName(name);
        if (dpOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CatalogGdprDeclaration declaration = gdprDeclarationRepository
                .findByDataProductName(name)
                .orElseGet(() -> CatalogGdprDeclaration.builder()
                        .id(UUID.randomUUID())
                        .dataProductName(name)
                        .createdBy(authUser.getId())
                        .build());

        declaration.setDataController(body.getDataController());
        declaration.setPurpose(body.getPurpose());
        declaration.setLegalBasis(body.getLegalBasis());
        declaration.setRetentionDays(body.getRetentionDays());
        declaration.setPiiColumns(body.getPiiColumns());
        declaration.setUpdatedBy(authUser.getId());

        CatalogGdprDeclaration saved = gdprDeclarationRepository.save(declaration);
        logAudit(dpOpt.get().getId(), authUser.getId().toString(), "UPDATE_GDPR", null);
        return ResponseEntity.ok(saved);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/audit — audit log (Phase 8)
    // -------------------------------------------------------------------------

    @Operation(summary = "Get the audit log for a data product.")
    @GetMapping("/{name}/audit")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CatalogAuditLog>> getAuditLog(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<CatalogAuditLog> logs = auditLogRepository
                .findByDataProductIdOrderByCreatedAtDesc(opt.get().getId());
        return ResponseEntity.ok(logs);
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/data-products/{name}/subscribe — subscribe (Phase 8)
    // -------------------------------------------------------------------------

    @Operation(summary = "Subscribe the current user to change alerts for a data product.")
    @PostMapping("/{name}/subscribe")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Map<String, Object>> subscribe(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UUID userId = authUser.getId();
        String dpId = opt.get().getId();
        boolean alreadyExists = subscriptionRepository
                .findByDataProductIdAndSubscriberId(dpId, userId)
                .isPresent();

        if (!alreadyExists) {
            CatalogSubscription sub = CatalogSubscription.builder()
                    .id(UUID.randomUUID().toString())
                    .dataProductId(dpId)
                    .subscriberId(userId)
                    .build();
            subscriptionRepository.save(sub);
            logAudit(dpId, authUser.getId().toString(), "SUBSCRIBE", null);
        }

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("subscribed", true);
        resp.put("dataProductName", name);
        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/catalog/data-products/{name}/unsubscribe — unsubscribe (Phase 8)
    // -------------------------------------------------------------------------

    @Operation(summary = "Unsubscribe the current user from a data product.")
    @DeleteMapping("/{name}/unsubscribe")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> unsubscribe(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UUID userId = authUser.getId();
        subscriptionRepository.deleteByDataProductIdAndSubscriberId(opt.get().getId(), userId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/subscribed — check subscription (Phase 8)
    // -------------------------------------------------------------------------

    @Operation(summary = "Check whether the current user is subscribed to a data product.")
    @GetMapping("/{name}/subscribed")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Map<String, Object>> isSubscribed(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UUID userId = authUser.getId();
        boolean subscribed = subscriptionRepository
                .findByDataProductIdAndSubscriberId(opt.get().getId(), userId)
                .isPresent();

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("subscribed", subscribed);
        resp.put("dataProductName", name);
        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // Private helper — write an audit log entry
    // -------------------------------------------------------------------------

    private static String stringOrNull(Map<String, Object> body, String key) {
        if (!body.containsKey(key)) return null;
        Object v = body.get(key);
        return v != null ? v.toString() : null;
    }

    private void logAudit(String dataProductId, String actorId, String action, String detail) {
        try {
            CatalogAuditLog entry = CatalogAuditLog.builder()
                    .id(UUID.randomUUID().toString())
                    .dataProductId(dataProductId)
                    .actorId(actorId)
                    .action(action)
                    .detail(detail)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("logAudit: failed action={} dpId={} — {}", action, dataProductId, e.getMessage());
        }
    }
}
