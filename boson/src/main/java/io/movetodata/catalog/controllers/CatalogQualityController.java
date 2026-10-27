package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import io.movetodata.catalog.library.models.CatalogQualityRule;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import io.movetodata.catalog.library.repository.CatalogQualityRuleRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.library.services.DataDriftService;
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

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Endpoints for data quality rules and dataset stats / drift detection.
 *
 *   GET    /api/catalog/data-products/{name}/quality-rules        — list rules
 *   POST   /api/catalog/data-products/{name}/quality-rules        — create rule
 *   DELETE /api/catalog/data-products/{name}/quality-rules/{id}   — delete rule
 *   GET    /api/catalog/data-products/{name}/stats                — list snapshots (last 10)
 *   POST   /api/catalog/data-products/{name}/stats                — record a snapshot + compute drift
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog/data-products")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Quality", description = "Quality rules and drift detection for Data Products.")
public class CatalogQualityController {

    private final DataProductRepository        dataProductRepository;
    private final CatalogQualityRuleRepository qualityRuleRepository;
    private final CatalogDatasetStatsRepository statsRepository;
    private final DataDriftService             driftService;

    // =========================================================================
    // Quality rules
    // =========================================================================

    @Operation(summary = "List quality rules for a Data Product.")
    @GetMapping("/{name}/quality-rules")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CatalogQualityRule>> listQualityRules(
            @PathVariable("name") String name) {

        Optional<DataProduct> dp = dataProductRepository.findByName(name);
        if (dp.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(
                qualityRuleRepository.findByDataProductIdOrderByCreatedAtAsc(dp.get().getId()));
    }

    @Operation(summary = "Create a quality rule for a Data Product.")
    @PostMapping("/{name}/quality-rules")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogQualityRule> createQualityRule(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestBody Map<String, Object> body) {

        Optional<DataProduct> dp = dataProductRepository.findByName(name);
        if (dp.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String ruleType   = body.getOrDefault("ruleType", "CUSTOM").toString();
        String expression = body.getOrDefault("expression", "").toString().trim();
        if (expression.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        CatalogQualityRule rule = CatalogQualityRule.builder()
                .id(UUID.randomUUID().toString())
                .dataProductId(dp.get().getId())
                .columnName(body.containsKey("columnName") && body.get("columnName") != null
                        ? body.get("columnName").toString() : null)
                .ruleType(ruleType)
                .expression(expression)
                .enabled(true)
                .createdBy(authUser.getId())
                .build();

        CatalogQualityRule saved = qualityRuleRepository.save(rule);
        log.info("quality-rule created: id={} product={} type={}", saved.getId(), name, ruleType);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @Operation(summary = "Delete a quality rule.")
    @DeleteMapping("/{name}/quality-rules/{ruleId}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteQualityRule(
            @PathVariable("name") String name,
            @PathVariable("ruleId") String ruleId) {

        Optional<CatalogQualityRule> rule = qualityRuleRepository.findById(ruleId);
        if (rule.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        qualityRuleRepository.delete(rule.get());
        log.info("quality-rule deleted: id={} product={}", ruleId, name);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Dataset stats + drift detection
    // =========================================================================

    @Operation(summary = "List recent stats snapshots for a Data Product (last 10).")
    @GetMapping("/{name}/stats")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CatalogDatasetStats>> listStats(
            @PathVariable("name") String name) {

        Optional<DataProduct> dp = dataProductRepository.findByName(name);
        if (dp.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(
                statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.get().getId()));
    }

    @Operation(summary = "Record a new stats snapshot and compute drift score.")
    @PostMapping("/{name}/stats")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogDatasetStats> recordStats(
            @PathVariable("name") String name,
            @RequestBody Map<String, Object> body) {

        Optional<DataProduct> dp = dataProductRepository.findByName(name);
        if (dp.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        long recordCount = 0L;
        Object rcRaw = body.get("recordCount");
        if (rcRaw instanceof Number) {
            recordCount = ((Number) rcRaw).longValue();
        }
        String columnStats = body.containsKey("columnStats") && body.get("columnStats") != null
                ? body.get("columnStats").toString() : null;

        DataDriftService.DriftResult drift =
                driftService.computeDrift(dp.get().getId(), recordCount);

        CatalogDatasetStats snapshot = CatalogDatasetStats.builder()
                .id(UUID.randomUUID().toString())
                .dataProductId(dp.get().getId())
                .recordCount(recordCount)
                .columnStats(columnStats)
                .driftScore(drift.score())
                .driftAlert(drift.alert())
                .measuredAt(Instant.now())
                .build();

        CatalogDatasetStats saved = statsRepository.save(snapshot);
        if (drift.alert()) {
            log.warn("drift-alert: product={} recordCount={} z={}", name, recordCount, drift.score());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
