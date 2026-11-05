package io.movetodata.catalog.webhook;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.catalog.library.models.CatalogWebhookEvent;
import io.movetodata.catalog.library.repository.CatalogWebhookEventRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Contrôleur webhook d'ingestion de dataset.
 *
 * POST /api/webhook/dataset-created — reçoit un événement, vérifie le HMAC,
 *   assure l'idempotence, puis déclenche le pipeline asynchrone.
 *
 * GET  /api/catalog/admin/webhook-events — liste paginée des événements (admin).
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@Tag(name = "Data Catalog — Webhook", description = "Ingestion automatique de datasets via webhook.")
public class WebhookCatalogController {

    private static final String HMAC_ALGO = "HmacSHA256";

    private final CatalogWebhookEventRepository webhookEventRepository;
    private final WebhookCatalogService         webhookCatalogService;
    private final ObjectMapper                  objectMapper;

    @Value("${CATALOG_WEBHOOK_SECRET:}")
    private String webhookSecret;

    // =========================================================================
    // POST /api/webhook/dataset-created
    // =========================================================================

    @Operation(summary = "Reçoit un événement de création de dataset (F13.1). Vérifie HMAC + idempotence.")
    @PostMapping("/api/webhook/dataset-created")
    public ResponseEntity<Map<String, Object>> datasetCreated(
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signatureHeader,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKeyHeader,
            @RequestBody String rawBody) {

        // 1. Vérification HMAC (si un secret est configuré)
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (!verifyHmac(rawBody, signatureHeader)) {
                log.warn("WebhookCatalogController: HMAC invalide");
                return ResponseEntity.status(401).body(Map.of("error", "Signature invalide"));
            }
        }

        // 2. Parse du body
        Map<String, Object> body;
        try {
            body = objectMapper.readValue(rawBody, new TypeReference<>() {});
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Corps JSON invalide"));
        }

        // 3. Clé d'idempotence
        String datasetId = safeStr(body, "datasetId");
        String version   = safeStr(body, "version");
        String idempotencyKey = idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank()
                ? idempotencyKeyHeader
                : (datasetId != null ? datasetId : "unknown") + ":" + (version != null ? version : "0");

        // 4. Vérification idempotence
        Optional<CatalogWebhookEvent> existing = webhookEventRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            CatalogWebhookEvent event = existing.get();
            if ("DONE".equals(event.getState())) {
                log.debug("WebhookCatalogController: re-envoi ignoré pour clé={}", idempotencyKey);
                return ResponseEntity.ok(Map.of("status", "ignored", "message", "Événement déjà traité"));
            }
            // PROCESSING ou FAILED → retenter
            log.info("WebhookCatalogController: retry pour clé={} state={}", idempotencyKey, event.getState());
            webhookCatalogService.processWebhookAsync(event.getId(), body);
            return ResponseEntity.accepted().body(Map.of("status", "retrying", "eventId", event.getId().toString()));
        }

        // 5. Créer l'entrée en base
        CatalogWebhookEvent event = CatalogWebhookEvent.builder()
                .id(UUID.randomUUID())
                .idempotencyKey(idempotencyKey)
                .datasetId(datasetId)
                .datasetVersion(version)
                .state("RECEIVED")
                .attempts(0)
                .payload(rawBody)
                .build();
        webhookEventRepository.save(event);

        // 6. Pipeline asynchrone
        webhookCatalogService.processWebhookAsync(event.getId(), body);

        return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "eventId", event.getId().toString()));
    }

    // =========================================================================
    // GET /api/catalog/admin/webhook-events
    // =========================================================================

    @Operation(summary = "Liste paginée des événements webhook avec métriques de délai (admin).")
    @GetMapping("/api/catalog/admin/webhook-events")
    public ResponseEntity<Map<String, Object>> listWebhookEvents(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);

        Page<CatalogWebhookEvent> pageResult =
                webhookEventRepository.findAllByOrderByReceivedAtDesc(PageRequest.of(page, size));

        Double medianDelayMs  = webhookEventRepository.medianDelayMs(sevenDaysAgo);
        Double percentInDelay = webhookEventRepository.percentInDelay(sevenDaysAgo);

        List<Map<String, Object>> items = new ArrayList<>();
        for (CatalogWebhookEvent ev : pageResult.getContent()) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id",           ev.getId().toString());
            dto.put("datasetId",    ev.getDatasetId());
            dto.put("version",      ev.getDatasetVersion());
            dto.put("state",        ev.getState());
            dto.put("attempts",     ev.getAttempts());
            dto.put("receivedAt",   ev.getReceivedAt() != null ? ev.getReceivedAt().toString() : null);
            dto.put("processedAt",  ev.getProcessedAt() != null ? ev.getProcessedAt().toString() : null);
            dto.put("lastError",    ev.getLastError());

            Long delayMs = null;
            if (ev.getReceivedAt() != null && ev.getProcessedAt() != null) {
                delayMs = ev.getProcessedAt().toEpochMilli() - ev.getReceivedAt().toEpochMilli();
            }
            dto.put("delayMs", delayMs);
            items.add(dto);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items",          items);
        response.put("total",          pageResult.getTotalElements());
        response.put("medianDelayMs",  medianDelayMs != null ? Math.round(medianDelayMs) : null);
        response.put("percentInDelay", percentInDelay != null
                ? Math.round(percentInDelay * 100.0) : null);

        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private boolean verifyHmac(String body, String signatureHeader) {
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] computed   = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            String computedHex = "sha256=" + bytesToHex(computed);

            // Comparaison timing-safe
            byte[] expected = signatureHeader.getBytes(StandardCharsets.UTF_8);
            byte[] actual   = computedHex.getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception ex) {
            log.error("WebhookCatalogController: erreur vérification HMAC — {}", ex.getMessage());
            return false;
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static String safeStr(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }
}
