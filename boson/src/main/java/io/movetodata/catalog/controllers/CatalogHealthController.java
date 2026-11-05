package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import io.movetodata.catalog.library.repository.CatalogGlossaryTermRepository;
import io.movetodata.catalog.library.repository.CatalogQualityRuleRepository;
import io.movetodata.catalog.library.repository.ColumnMetaRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.library.services.CatalogJobStatusService;
import io.movetodata.catalog.search.CatalogSearchIndexService;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Endpoint de santé et de métriques du Data Catalog.
 *
 * GET /api/catalog/health — retourne :
 *   - les métriques catalogue habituelles (backward-compatible)
 *   - un bloc {@code dependencies} avec le statut en temps réel de :
 *       database (ping SQL SELECT 1)
 *       opensearch (ping cluster health)
 *       llm (ping movetodata-ai /health)
 *       trustScoreJob (dernier run + nb alertes)
 */
@Slf4j
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
    private final CatalogSearchIndexService      searchIndexService;
    private final CatalogJobStatusService        jobStatusService;
    private final JdbcTemplate                   jdbcTemplate;

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // =========================================================================
    // GET /api/catalog/health
    // =========================================================================

    @Operation(summary = "Get platform-wide Data Catalog health metrics and dependency status.")
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
        long totalRules    = qualityRuleRepository.count();
        long totalGlossary = glossaryTermRepository.count();

        // Products with low trust score (< 30%)
        long lowTrust = all.stream()
                .filter(dp -> dp.getTrustScore() != null && dp.getTrustScore().doubleValue() < 0.30)
                .count();

        // =====================================================================
        // Dépendances système
        // =====================================================================

        Map<String, Object> deps = new LinkedHashMap<>();
        deps.put("database",     checkDatabase());
        deps.put("opensearch",   checkOpenSearch());
        deps.put("llm",          checkLlm());
        deps.put("trustScoreJob", buildJobStatus());

        // Statut global
        String overallStatus = computeOverallStatus(deps);

        // =====================================================================
        // Réponse
        // =====================================================================

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status",             overallStatus);
        health.put("dependencies",       deps);

        // Métriques catalogue (backward-compatible)
        health.put("totalProducts",        total);
        health.put("withDescription",      withDescription);
        health.put("descriptionCoverage",  round(descriptionCoverage));
        health.put("qualityDistribution",  qualityDist);
        health.put("avgTrustScore",        round(avgTrust));
        health.put("productsInDrift",      productsInDrift);
        health.put("productsWithLowTrust", lowTrust);
        health.put("totalColumns",         totalColumns);
        health.put("piiColumns",           piiColumns);
        health.put("piiCoverage",          totalColumns > 0 ? round((double) piiColumns / totalColumns) : 0.0);
        health.put("glossaryMappedColumns",   mappedColumns);
        health.put("glossaryCoverage",        totalColumns > 0 ? round((double) mappedColumns / totalColumns) : 0.0);
        health.put("totalQualityRules",       totalRules);
        health.put("totalGlossaryTerms",      totalGlossary);

        return ResponseEntity.ok(health);
    }

    // =========================================================================
    // Pings des dépendances
    // =========================================================================

    /** Ping SQL : SELECT 1 avec mesure du temps de réponse. */
    private Map<String, Object> checkDatabase() {
        long start = System.currentTimeMillis();
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            long ms = System.currentTimeMillis() - start;
            return depStatus("UP", ms, null, null);
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            log.warn("CatalogHealthController: database ping failed — {}", e.getMessage());
            return depStatus("DOWN", ms, null, null);
        }
    }

    /** Ping OpenSearch via le service de recherche. */
    private Map<String, Object> checkOpenSearch() {
        long start = System.currentTimeMillis();
        try {
            boolean available = searchIndexService.isOpenSearchAvailable();
            long ms = System.currentTimeMillis() - start;
            return depStatus(available ? "UP" : "DOWN", ms, null, null);
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            log.warn("CatalogHealthController: opensearch ping failed — {}", e.getMessage());
            return depStatus("DOWN", ms, null, null);
        }
    }

    /** Ping LLM : GET {MOVETODATA_AI_URL}/health avec timeout 5 s. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> checkLlm() {
        long start = System.currentTimeMillis();
        try {
            // Timeout court : on ne veut pas bloquer la réponse health
            String url = aiServiceUrl + "/health";
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            long ms = System.currentTimeMillis() - start;
            String model = (response != null && response.containsKey("model"))
                    ? response.get("model").toString() : null;
            return depStatus("UP", ms, "model", model);
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            log.debug("CatalogHealthController: llm ping failed — {}", e.getMessage());
            return depStatus("DOWN", ms, null, null);
        }
    }

    /** Statut du dernier run du TrustScoreRefreshJob. */
    private Map<String, Object> buildJobStatus() {
        Map<String, Object> m = new LinkedHashMap<>();

        CatalogJobStatusService.JobStatus s = jobStatusService.getLastStatus();
        Instant lastRun = jobStatusService.getLastRunAt();

        // Évaluation du statut
        String status;
        if (s == CatalogJobStatusService.JobStatus.FAILED) {
            status = "DOWN";
        } else if (s == CatalogJobStatusService.JobStatus.UNKNOWN) {
            status = "UNKNOWN";
        } else if (lastRun != null
                && ChronoUnit.HOURS.between(lastRun, Instant.now()) > 8) {
            // Plus de 8h sans run → DEGRADED
            status = "DEGRADED";
        } else {
            status = "OK";
        }

        m.put("status",     status);
        m.put("lastRun",    lastRun != null ? lastRun.toString() : null);
        m.put("alertCount", jobStatusService.getLastAlertCount());
        return m;
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private static Map<String, Object> depStatus(String status, long responseTimeMs,
                                                  String extraKey, Object extraVal) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", status);
        m.put("responseTimeMs", responseTimeMs);
        if (extraKey != null) {
            m.put(extraKey, extraVal);
        }
        return m;
    }

    /**
     * Statut global : DOWN si au moins une dépendance critique est DOWN,
     * DEGRADED si OpenSearch ou trustScoreJob est DEGRADED/UNKNOWN,
     * UP sinon.
     */
    private static String computeOverallStatus(Map<String, Object> deps) {
        for (Map.Entry<String, Object> entry : deps.entrySet()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> dep = (Map<String, Object>) entry.getValue();
            String s = dep.getOrDefault("status", "UNKNOWN").toString();
            // database ou llm DOWN → tout DOWN
            if ("DOWN".equals(s) && ("database".equals(entry.getKey()))) {
                return "DOWN";
            }
            if ("DEGRADED".equals(s) || "UNKNOWN".equals(s)) {
                return "DEGRADED";
            }
        }
        return "UP";
    }

    private static double round(double v) {
        return BigDecimal.valueOf(v).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }
}
