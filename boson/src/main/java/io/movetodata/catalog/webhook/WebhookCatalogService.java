package io.movetodata.catalog.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.catalog.library.models.CatalogWebhookEvent;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogWebhookEventRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.search.CatalogSearchIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

/**
 * Service asynchrone pour le traitement des webhooks d'ingestion de dataset.
 *
 * Pipeline :
 *   1. Créer ou mettre à jour le DataProduct en brouillon (qualityLevel=BRONZE, descriptionSource='manual').
 *   2. Appeler movetodata-ai /catalog/generate-data-product pour obtenir la description IA.
 *   3. Mettre à jour le DataProduct avec les métadonnées générées (descriptionSource='ai').
 *   4. Indexer dans OpenSearch.
 *   5. Marquer l'événement DONE (ou FAILED + lastError en cas d'erreur).
 *
 * Le délai total est loggué ; une alerte WARN est émise si > 5 minutes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookCatalogService {

    private static final long MAX_DELAY_SECONDS = 300L;

    private final CatalogWebhookEventRepository webhookEventRepository;
    private final DataProductRepository         dataProductRepository;
    private final CatalogSearchIndexService     searchIndexService;
    private final ObjectMapper                  objectMapper;

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // -------------------------------------------------------------------------
    // Pipeline principal (exécuté de façon asynchrone par le contrôleur)
    // -------------------------------------------------------------------------

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processWebhookAsync(UUID eventId, Map<String, Object> body) {
        Instant start = Instant.now();

        CatalogWebhookEvent event = webhookEventRepository.findById(eventId).orElseThrow(
                () -> new IllegalStateException("WebhookEvent not found: " + eventId));

        event.setState("PROCESSING");
        event.setAttempts(event.getAttempts() + 1);
        webhookEventRepository.save(event);

        try {
            // 1. Créer ou mettre à jour le DataProduct brouillon
            DataProduct dp = upsertDataProduct(body);

            // 2. Générer les métadonnées via l'IA
            DataProduct enriched = generateAiMetadata(dp, body);

            // 3. Indexer dans OpenSearch
            searchIndexService.indexDataProduct(enriched);

            // 4. Marquer DONE
            event.setState("DONE");
            event.setProcessedAt(Instant.now());
            event.setLastError(null);
            webhookEventRepository.save(event);

            long delaySeconds = ChronoUnit.SECONDS.between(start, Instant.now());
            if (delaySeconds > MAX_DELAY_SECONDS) {
                log.warn("WebhookCatalogService: pipeline délai {} s > 5 min pour datasetId={}",
                        delaySeconds, body.getOrDefault("datasetId", "?"));
            } else {
                log.info("WebhookCatalogService: pipeline DONE en {} s pour datasetId={}",
                        delaySeconds, body.getOrDefault("datasetId", "?"));
            }
        } catch (Exception ex) {
            log.error("WebhookCatalogService: erreur pipeline datasetId={} — {}",
                    body.getOrDefault("datasetId", "?"), ex.getMessage(), ex);
            event.setState("FAILED");
            event.setLastError(truncate(ex.getMessage(), 1000));
            webhookEventRepository.save(event);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers privés
    // -------------------------------------------------------------------------

    private DataProduct upsertDataProduct(Map<String, Object> body) {
        String name = safeStr(body, "name");
        String datasetId = safeStr(body, "datasetId");
        String description = safeStr(body, "description");
        String sourceType = safeStr(body, "sourceType");
        String domainId = safeStr(body, "domainId");

        if (name == null || name.isBlank()) {
            name = datasetId != null ? datasetId : "dataset_" + UUID.randomUUID();
        }

        // Cherche par name (clé naturelle du catalogue)
        DataProduct dp = dataProductRepository.findByName(name)
                .orElseGet(() -> DataProduct.builder()
                        .id(UUID.randomUUID().toString())
                        .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                        .build());

        dp.setName(name);
        dp.setDisplayName(name);
        if (description != null && !description.isBlank()) {
            dp.setDescription(description);
        }
        if (sourceType != null) dp.setSourceType(sourceType);
        if (domainId != null)   dp.setDomainId(domainId);
        dp.setQualityLevel("BRONZE");
        dp.setAccessPolicy("INTERNAL");
        dp.setDescriptionSource("manual");

        return dataProductRepository.save(dp);
    }

    @SuppressWarnings("unchecked")
    private DataProduct generateAiMetadata(DataProduct dp, Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Corps envoyé à movetodata-ai : métadonnées uniquement, jamais de valeurs de cellules
            Map<String, Object> aiPayload = Map.of(
                    "datasetId", safeStrOrEmpty(body, "datasetId"),
                    "name",      dp.getName(),
                    "description", dp.getDescription() != null ? dp.getDescription() : "",
                    "sourceType", dp.getSourceType() != null ? dp.getSourceType() : "UNKNOWN",
                    "columns",   body.getOrDefault("columns", java.util.List.of())
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(aiPayload, headers);
            String url = aiServiceUrl + "/catalog/generate-data-product";

            @SuppressWarnings("unchecked")
            Map<String, Object> result = restTemplate.postForObject(url, request, Map.class);

            if (result != null) {
                if (result.containsKey("description") && result.get("description") != null) {
                    dp.setDescription(result.get("description").toString());
                }
                if (result.containsKey("accessPolicy") && result.get("accessPolicy") != null) {
                    dp.setAccessPolicy(result.get("accessPolicy").toString());
                }
                if (result.containsKey("dataProductType") && result.get("dataProductType") != null) {
                    dp.setDataProductType(result.get("dataProductType").toString());
                }
                if (result.containsKey("useCases") && result.get("useCases") != null) {
                    dp.setUseCases(result.get("useCases").toString());
                }
                dp.setDescriptionSource("ai");
                dp.setQualityLevel("BRONZE"); // toujours BRONZE après génération initiale
            }
        } catch (Exception ex) {
            log.warn("WebhookCatalogService: génération IA échouée pour {} — {} (brouillon conservé)",
                    dp.getName(), ex.getMessage());
        }
        return dataProductRepository.save(dp);
    }

    private static String safeStr(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private static String safeStrOrEmpty(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : "";
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
