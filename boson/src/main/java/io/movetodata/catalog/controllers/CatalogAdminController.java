package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CatalogRestrictedAccessLog;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogRestrictedAccessLogRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Endpoints d'administration du Data Catalog (réservés CONNECT_ADMIN).
 *
 * GET  /api/catalog/admin/ai-drafts                     — DataProducts brouillon IA à relire
 * PUT  /api/catalog/admin/ai-drafts/{name}/validate     — passage BRONZE → SILVER
 * POST /api/catalog/admin/ai-drafts/{name}/regenerate   — re-génération IA
 * GET  /api/catalog/admin/restricted-access-logs        — journal RESTRICTED avec filtre période
 * GET  /api/catalog/admin/restricted-access-logs/export — export JSON
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog/admin")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Admin", description = "Administration du Data Catalog.")
public class CatalogAdminController {

    private final DataProductRepository               dataProductRepository;
    private final CatalogRestrictedAccessLogRepository accessLogRepository;

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // =========================================================================
    // GET /api/catalog/admin/ai-drafts
    // =========================================================================

    @Operation(summary = "Liste les DataProducts générés par IA (BRONZE) en attente de validation.")
    @GetMapping("/ai-drafts")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<Map<String, Object>>> listAiDrafts(
            @AuthenticationPrincipal AuthUser authUser) {

        List<DataProduct> drafts = dataProductRepository.findAll().stream()
                .filter(dp -> "ai".equals(dp.getDescriptionSource())
                        && "BRONZE".equals(dp.getQualityLevel()))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = drafts.stream().map(dp -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("name",              dp.getName());
            dto.put("displayName",       dp.getDisplayName());
            dto.put("fqn",               dp.getName());
            dto.put("description",       dp.getDescription());
            dto.put("qualityLevel",      dp.getQualityLevel());
            dto.put("descriptionSource", dp.getDescriptionSource());
            dto.put("accessPolicy",      dp.getAccessPolicy());
            dto.put("dataProductType",   dp.getDataProductType());
            dto.put("useCases",          dp.getUseCases());
            dto.put("updatedAt",         dp.getUpdatedAt() != null ? dp.getUpdatedAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // =========================================================================
    // PUT /api/catalog/admin/ai-drafts/{name}/validate
    // =========================================================================

    @Operation(summary = "Valide un brouillon IA en passant qualityLevel à SILVER.")
    @PutMapping("/ai-drafts/{name}/validate")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<DataProduct> validateAiDraft(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        return dataProductRepository.findByName(name)
                .map(dp -> {
                    dp.setQualityLevel("SILVER");
                    DataProduct saved = dataProductRepository.save(dp);
                    log.info("CatalogAdmin: brouillon IA validé name={} by user={}", name, authUser.getId());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // POST /api/catalog/admin/ai-drafts/{name}/regenerate
    // =========================================================================

    @Operation(summary = "Re-génère les métadonnées IA pour un DataProduct existant.")
    @PostMapping("/ai-drafts/{name}/regenerate")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Map<String, Object>> regenerateAiDraft(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> opt = dataProductRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        DataProduct dp = opt.get();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> payload = Map.of(
                    "datasetId",   dp.getId(),
                    "name",        dp.getName(),
                    "description", dp.getDescription() != null ? dp.getDescription() : "",
                    "sourceType",  dp.getSourceType() != null ? dp.getSourceType() : "UNKNOWN",
                    "columns",     List.of()
            );
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = restTemplate.postForObject(
                    aiServiceUrl + "/catalog/generate-data-product", request, Map.class);

            if (result != null) {
                if (result.containsKey("description") && result.get("description") != null) {
                    dp.setDescription(result.get("description").toString());
                }
                if (result.containsKey("accessPolicy") && result.get("accessPolicy") != null) {
                    dp.setAccessPolicy(result.get("accessPolicy").toString());
                }
                if (result.containsKey("useCases") && result.get("useCases") != null) {
                    dp.setUseCases(result.get("useCases").toString());
                }
                dp.setDescriptionSource("ai");
                dataProductRepository.save(dp);
            }
            log.info("CatalogAdmin: régénération IA ok name={} by user={}", name, authUser.getId());
            return ResponseEntity.ok(Map.of("status", "regenerated", "name", name));
        } catch (Exception ex) {
            log.error("CatalogAdmin: régénération IA échouée name={} — {}", name, ex.getMessage());
            return ResponseEntity.status(502).body(Map.of("error", "Génération IA indisponible : " + ex.getMessage()));
        }
    }

    // =========================================================================
    // GET /api/catalog/admin/restricted-access-logs
    // =========================================================================

    @Operation(summary = "Journal des accès aux assets RESTRICTED avec filtre de période.")
    @GetMapping("/restricted-access-logs")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CatalogRestrictedAccessLog>> listRestrictedAccessLogs(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate",   required = false) String endDateStr) {

        Instant start = startDateStr != null
                ? Instant.parse(startDateStr)
                : Instant.now().minus(7, ChronoUnit.DAYS);
        Instant end = endDateStr != null
                ? Instant.parse(endDateStr)
                : Instant.now();

        List<CatalogRestrictedAccessLog> logs =
                accessLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        return ResponseEntity.ok(logs);
    }

    // =========================================================================
    // GET /api/catalog/admin/restricted-access-logs/export
    // =========================================================================

    @Operation(summary = "Exporte le journal d'accès RESTRICTED au format JSON (fichier).")
    @GetMapping("/restricted-access-logs/export")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<byte[]> exportRestrictedAccessLogs(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate",   required = false) String endDateStr) {

        Instant start = startDateStr != null
                ? Instant.parse(startDateStr)
                : Instant.now().minus(7, ChronoUnit.DAYS);
        Instant end = endDateStr != null
                ? Instant.parse(endDateStr)
                : Instant.now();

        List<CatalogRestrictedAccessLog> logs =
                accessLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.findAndRegisterModules();
            byte[] json = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(logs);

            String filename = "restricted-access-logs-"
                    + DateTimeFormatter.ISO_INSTANT.format(Instant.now()).replace(":", "-") + ".json";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", filename);
            return new ResponseEntity<>(json, headers, HttpStatus.OK);
        } catch (Exception ex) {
            log.error("CatalogAdmin: export journal échoué — {}", ex.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
