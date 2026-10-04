package io.movetodata.ai.library.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.ai.library.models.AiSourceQuality;
import io.movetodata.ai.library.repository.AiSourceQualityRepository;
import io.movetodata.connect.library.models.DatabaseSourceConfig;
import io.movetodata.connect.library.models.Result;
import io.movetodata.connect.library.models.Results;
import io.movetodata.connect.library.services.JDBCService;
import io.movetodata.connect.library.services.SourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SmartConnectorService — F4 (Smart Connector) backend logic.
 *
 * Responsibilities:
 *  1. Fetch a 1 000-row sample from the first table of a JDBC source.
 *  2. Build the payload for movetodata-ai /smart-connector/analyze.
 *  3. Forward the request to the Python service.
 *  4. Persist the result in ai_source_quality (upsert via save()).
 *
 * Sovereignty: only column names, SQL types, and the sample data (max 1 000
 * rows) are forwarded to the self-hosted movetodata-ai service. Nothing leaves
 * the MoveToData infrastructure.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmartConnectorService {

    private static final int SAMPLE_LIMIT = 1_000;

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    private final SourceService sourceService;
    private final JDBCService jdbcService;
    private final AiSourceQualityRepository qualityRepository;
    private final @Qualifier("aiRestTemplate") RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Run Smart Connector analysis on the given source.
     *
     * <ol>
     *   <li>Resolve the source and its JDBC config.</li>
     *   <li>Introspect the first table to obtain columns + SQL types.</li>
     *   <li>Fetch up to {@value #SAMPLE_LIMIT} rows from that table.</li>
     *   <li>Forward to movetodata-ai /smart-connector/analyze.</li>
     *   <li>Persist the result in ai_source_quality.</li>
     * </ol>
     *
     * @param sourceId UUID of the connected source.
     * @return the AI analysis result map (same structure as the Python response).
     */
    public Map<String, Object> analyzeSample(UUID sourceId) {
        // --- 1. Resolve JDBC config ---
        DatabaseSourceConfig config;
        try {
            config = sourceService.getSourceDatabaseSourceConfig(sourceId);
        } catch (Exception e) {
            log.warn("smart-connector: cannot resolve JDBC config for source {} — {}", sourceId, e.getMessage());
            throw new IllegalArgumentException("Source not found or not a JDBC source: " + sourceId);
        }

        // --- 2. Introspect tables ---
        String tableName = resolveFirstTable(config, sourceId);

        // --- 3. Introspect columns ---
        List<Map<String, String>> columns = resolveColumns(config, tableName, sourceId);

        // --- 4. Fetch sample rows ---
        List<List<Object>> sampleData = fetchSample(config, tableName, columns, sourceId);

        // --- 5. Build payload ---
        Map<String, Object> payload = new HashMap<>();
        payload.put("source_id",   sourceId.toString());
        payload.put("columns",     columns);
        payload.put("sample_data", sampleData);
        payload.put("sample_size", sampleData.size());

        // --- 6. Forward to Python service ---
        Map<String, Object> aiResponse = callPythonService(payload, sourceId);

        // --- 7. Persist result ---
        persistQuality(sourceId, aiResponse);

        return aiResponse;
    }

    /**
     * Return the cached quality score for a source, if available.
     */
    public Optional<AiSourceQuality> getQualityScore(UUID sourceId) {
        return qualityRepository.findBySourceId(sourceId);
    }

    /**
     * Batch lookup of quality scores for multiple sources (used by the badge
     * renderer in the Connect source list — one call instead of N).
     */
    public List<AiSourceQuality> getQualityScores(List<UUID> sourceIds) {
        return qualityRepository.findBySourceIdIn(sourceIds);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String resolveFirstTable(DatabaseSourceConfig config, UUID sourceId) {
        try {
            Results tablesResult = sourceService.getSourceTables(config);
            if (tablesResult == null || tablesResult.getResults().isEmpty()) {
                throw new IllegalArgumentException("No tables found in source " + sourceId);
            }

            List<List<String>> rows = tablesResult.getResults().get(0).getData();
            for (List<String> row : rows) {
                // row: [schema, table_name, table_type]
                String name = row.size() > 1 ? row.get(1) : (row.isEmpty() ? null : row.get(0));
                if (name != null && !name.isBlank()) {
                    return name;
                }
            }
            throw new IllegalArgumentException("No non-empty table found in source " + sourceId);

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Table listing failed for source " + sourceId + ": " + e.getMessage(), e);
        }
    }

    private List<Map<String, String>> resolveColumns(
            DatabaseSourceConfig config, String tableName, UUID sourceId) {
        try {
            Results schemaResult = sourceService.getSourceTableSchema(config, tableName);
            if (schemaResult == null || schemaResult.getResults().isEmpty()) {
                return List.of();
            }

            List<Map<String, String>> columns = new ArrayList<>();
            for (List<String> row : schemaResult.getResults().get(0).getData()) {
                // row: [column_name, data_type, ...]
                if (row.isEmpty()) continue;
                String colName = row.get(0);
                String sqlType = row.size() > 1 ? row.get(1) : "varchar";
                Map<String, String> col = new HashMap<>();
                col.put("name", colName);
                col.put("sql_type", sqlType != null ? sqlType : "varchar");
                columns.add(col);
            }
            return columns;

        } catch (Exception e) {
            log.warn("smart-connector: column introspection failed for source {} table {} — {}",
                    sourceId, tableName, e.getMessage());
            return List.of();
        }
    }

    private List<List<Object>> fetchSample(
            DatabaseSourceConfig config,
            String tableName,
            List<Map<String, String>> columns,
            UUID sourceId) {

        try {
            String safeTable = tableName.replaceAll("[^\\w.]", "");
            String sql = "SELECT * FROM " + safeTable + " LIMIT " + SAMPLE_LIMIT;

            log.info("smart-connector: fetching sample — source={} sql={}", sourceId, sql);

            Results results = jdbcService.executeJdbc(config, sql);
            if (results == null || results.getResults().isEmpty()) {
                return List.of();
            }

            List<List<Object>> data = new ArrayList<>();
            for (Result result : results.getResults()) {
                if (result.getData() == null) continue;
                for (List<String> row : result.getData()) {
                    List<Object> converted = new ArrayList<>(row);
                    data.add(converted);
                }
            }
            return data;

        } catch (Exception e) {
            log.warn("smart-connector: sample fetch failed for source {} — {}", sourceId, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPythonService(Map<String, Object> payload, UUID sourceId) {
        try {
            String url = aiServiceUrl + "/smart-connector/analyze";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Object> response =
                    restTemplate.exchange(url, HttpMethod.POST, entity, Object.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof Map) {
                return (Map<String, Object>) response.getBody();
            }

            log.warn("smart-connector: Python service returned {} for source {}", response.getStatusCode(), sourceId);
            return fallbackResponse(sourceId);

        } catch (ResourceAccessException e) {
            log.warn("smart-connector: movetodata-ai unreachable for source {} — {}", sourceId, e.getMessage());
            return fallbackResponse(sourceId);
        } catch (Exception e) {
            log.error("smart-connector: unexpected error calling Python for source {} — {}", sourceId, e.getMessage(), e);
            return fallbackResponse(sourceId);
        }
    }

    @SuppressWarnings("unchecked")
    private void persistQuality(UUID sourceId, Map<String, Object> aiResponse) {
        try {
            Map<String, Object> qualityScore =
                    (Map<String, Object>) aiResponse.getOrDefault("quality_score", Map.of());

            AiSourceQuality entity = qualityRepository.findBySourceId(sourceId)
                    .orElse(AiSourceQuality.builder().sourceId(sourceId).build());

            entity.setGlobalScore(toInt(qualityScore.get("global")));
            entity.setCompleteness(toInt(qualityScore.get("completeness")));
            entity.setUniqueness(toInt(qualityScore.get("uniqueness")));
            entity.setConsistency(toInt(qualityScore.get("consistency")));

            Object outlierRaw = qualityScore.get("outlier_ratio");
            if (outlierRaw != null) {
                try {
                    entity.setOutlierRatio(new BigDecimal(outlierRaw.toString()));
                } catch (NumberFormatException ignored) {}
            }

            Object detectedTypesRaw = aiResponse.get("detected_types");
            if (detectedTypesRaw instanceof Map) {
                entity.setDetectedTypes((Map<String, Object>) detectedTypesRaw);
            }

            Object suggestionsRaw = aiResponse.get("chart_suggestions");
            if (suggestionsRaw instanceof List) {
                entity.setChartSuggestions((List<Map<String, Object>>) suggestionsRaw);
            }

            entity.setAnalyzedAt(Instant.now());
            qualityRepository.save(entity);
            log.info("smart-connector: quality persisted for source {} — global={}", sourceId, entity.getGlobalScore());

        } catch (Exception e) {
            log.error("smart-connector: failed to persist quality for source {} — {}", sourceId, e.getMessage(), e);
            // Non-fatal — the AI response is still returned to the caller
        }
    }

    private static Integer toInt(Object value) {
        if (value == null) return null;
        try {
            return ((Number) value).intValue();
        } catch (ClassCastException e) {
            try {
                return Integer.parseInt(value.toString());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
    }

    private static Map<String, Object> fallbackResponse(UUID sourceId) {
        Map<String, Object> quality = new HashMap<>();
        quality.put("global", null);
        quality.put("completeness", null);
        quality.put("uniqueness", null);
        quality.put("consistency", null);
        quality.put("outlier_ratio", null);

        Map<String, Object> response = new HashMap<>();
        response.put("quality_score", quality);
        response.put("detected_types", Map.of());
        response.put("chart_suggestions", List.of());
        response.put("analyzed_at", Instant.now().toString());
        response.put("model", "unavailable");
        response.put("error", "AI service unreachable — analysis could not be completed");
        return response;
    }
}
