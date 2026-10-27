package io.movetodata.catalog.library.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

/**
 * Weekly Quartz-backed job that triggers a full RAG re-index of the Data Catalog.
 *
 * Calls movetodata-ai POST /catalog/rag/index directly (no auth — internal network).
 * Runs every Sunday at 03:00.
 */
@Slf4j
@Component
public class RagReindexJob {

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Scheduled(cron = "0 0 3 * * SUN")
    public void reindex() {
        String url = aiServiceUrl + "/catalog/rag/index";
        log.info("RagReindexJob: starting weekly RAG re-index at {}", url);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(Collections.emptyMap(), headers);

            Map<?, ?> response = restTemplate.postForObject(url, request, Map.class);
            int indexed = response != null && response.containsKey("indexed")
                    ? ((Number) response.get("indexed")).intValue() : -1;
            int errors  = response != null && response.containsKey("errors")
                    ? ((Number) response.get("errors")).intValue() : -1;
            log.info("RagReindexJob: done — indexed={} errors={}", indexed, errors);
        } catch (Exception e) {
            log.error("RagReindexJob: re-index failed — {}", e.getMessage());
        }
    }
}
