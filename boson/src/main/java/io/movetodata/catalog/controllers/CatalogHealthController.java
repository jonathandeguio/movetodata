package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import io.movetodata.catalog.library.repository.CatalogGlossaryTermRepository;
import io.movetodata.catalog.library.repository.CatalogQualityRuleRepository;
import io.movetodata.catalog.library.repository.ColumnMetaRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Read-only health/metrics endpoint for the Data Catalog.
 *
 * GET /api/catalog/health — returns platform-wide catalog metrics.
 */
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog")
@SecurityRequirement(name = "bearerAuth")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Data Catalog — Health", description = "Catalog-wide health metrics.")
public class CatalogHealthController {

    private final DataProductRepository         dataProductRepository;
    private final ColumnMetaRepository           columnMetaRepository;
    private final CatalogQualityRuleRepository   qualityRuleRepository;
    private final CatalogDatasetStatsRepository  statsRepository;
    private final CatalogGlossaryTermRepository  glossaryTermRepository;

    @Operation(summary = "Get platform-wide Data Catalog health metrics.")
    @GetMapping("/health")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Map<String, Object>> getHealth(
            @AuthenticationPrincipal AuthUser authUser) {

        List<DataProduct> all = dataProductRepository.findAll();
        int total = all.size();

        // Documentation coverage
        long withDescription = all.stream()
                .filter(dp -> dp.getDescription() != null && !dp.getDescription().isBlank())
                .count();
        double descriptionCoverage = total > 0 ? (double) withDescription / total : 0.0;

        // Quality distribution
        Map<String, Long> qualityDist = all.stream()
                .collect(Collectors.groupingBy(
                        dp -> dp.getQualityLevel() != null ? dp.getQualityLevel() : "NONE",
                        Collectors.counting()
                ));

        // Average trust score
        double avgTrust = all.stream()
                .filter(dp -> dp.getTrustScore() != null)
                .mapToDouble(dp -> dp.getTrustScore().doubleValue())
                .average()
                .orElse(0.0);

        // Products with active drift alert (latest snapshot)
        long productsInDrift = 0;
        for (DataProduct dp : all) {
            List<CatalogDatasetStats> stats =
                    statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
            if (!stats.isEmpty() && stats.get(0).isDriftAlert()) {
                productsInDrift++;
            }
        }

        // PII column count vs total columns
        long totalColumns  = columnMetaRepository.count();
        long piiColumns    = columnMetaRepository.countPiiColumns();
        long mappedColumns = columnMetaRepository.countMappedToGlossary();

        // Quality rules and glossary
        long totalRules      = qualityRuleRepository.count();
        long totalGlossary   = glossaryTermRepository.count();

        // Products with low trust score (< 30%)
        long lowTrust = all.stream()
                .filter(dp -> dp.getTrustScore() != null && dp.getTrustScore().doubleValue() < 0.30)
                .count();

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("totalProducts",        total);
        health.put("withDescription",      withDescription);
        health.put("descriptionCoverage",  round(descriptionCoverage));
        health.put("qualityDistribution",  qualityDist);
        health.put("avgTrustScore",        round(avgTrust));
        health.put("productsInDrift",      productsInDrift);
        health.put("productsWithLowTrust", lowTrust);
        health.put("totalColumns",         totalColumns);
        health.put("piiColumns",           piiColumns);
        health.put("piiCoverage",             totalColumns > 0 ? round((double) piiColumns / totalColumns) : 0.0);
        health.put("glossaryMappedColumns",   mappedColumns);
        health.put("glossaryCoverage",        totalColumns > 0 ? round((double) mappedColumns / totalColumns) : 0.0);
        health.put("totalQualityRules",       totalRules);
        health.put("totalGlossaryTerms",      totalGlossary);

        return ResponseEntity.ok(health);
    }

    private static double round(double v) {
        return BigDecimal.valueOf(v).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }
}
