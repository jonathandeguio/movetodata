package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.dto.GoldCriteriaSummary;
import io.movetodata.catalog.library.models.CatalogCertificationRequest;
import io.movetodata.catalog.library.models.CertificationLevel;
import io.movetodata.catalog.library.models.CertificationStatus;
import io.movetodata.catalog.library.repository.CatalogCertificationRequestRepository;
import io.movetodata.catalog.library.services.CatalogCertificationService;
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
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints du workflow de certification (Lot 4).
 *
 * <pre>
 * GET  /api/catalog/data-products/{name}/certification/criteria   → GoldCriteriaSummary
 * POST /api/catalog/data-products/{name}/certification/submit     → CatalogCertificationRequest
 * GET  /api/catalog/data-products/{name}/certification/history    → List&lt;CatalogCertificationRequest&gt;
 * POST /api/catalog/certification-requests/{id}/review            → CatalogCertificationRequest
 * </pre>
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Certification", description = "Workflow de certification Gold/Silver des Data Products.")
public class CatalogCertificationController {

    private final CatalogCertificationService              certificationService;
    private final CatalogCertificationRequestRepository    certRequestRepository;
    private final DataProductRepository                    dataProductRepository;

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/certification/criteria
    // -------------------------------------------------------------------------

    @Operation(summary = "Évalue les critères Gold d'un Data Product.")
    @GetMapping("/api/catalog/data-products/{name}/certification/criteria")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<GoldCriteriaSummary> getCriteria(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        return dataProductRepository.findByName(name)
                .map(dp -> ResponseEntity.ok(
                        certificationService.checkGoldCriteria(dp, authUser.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/data-products/{name}/certification/submit
    // -------------------------------------------------------------------------

    @Operation(summary = "Soumet une demande de certification pour un Data Product.")
    @PostMapping("/api/catalog/data-products/{name}/certification/submit")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogCertificationRequest> submit(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestBody Map<String, Object> body) {

        String targetLevelStr = body.containsKey("targetLevel") && body.get("targetLevel") != null
                ? body.get("targetLevel").toString().trim().toUpperCase()
                : "";
        if (targetLevelStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le champ targetLevel est obligatoire (SILVER ou GOLD).");
        }

        CertificationLevel targetLevel;
        try {
            targetLevel = CertificationLevel.valueOf(targetLevelStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Valeur targetLevel invalide : " + targetLevelStr);
        }

        // SLA optionnel
        Map<?, ?> slaData = body.containsKey("slaData") && body.get("slaData") instanceof Map
                ? (Map<?, ?>) body.get("slaData")
                : null;

        Integer  slaFreshnessHours      = null;
        BigDecimal slaAvailabilityPercent = null;
        String   slaSupport             = null;

        if (slaData != null) {
            if (slaData.get("freshnessHours") != null) {
                try { slaFreshnessHours = Integer.valueOf(slaData.get("freshnessHours").toString()); }
                catch (NumberFormatException ignored) { /* valeur ignorée si invalide */ }
            }
            if (slaData.get("availabilityPercent") != null) {
                try { slaAvailabilityPercent = new BigDecimal(slaData.get("availabilityPercent").toString()); }
                catch (NumberFormatException ignored) { /* valeur ignorée si invalide */ }
            }
            if (slaData.get("support") != null) {
                slaSupport = slaData.get("support").toString();
            }
        }

        CatalogCertificationRequest request = certificationService.submitCertificationRequest(
                name, targetLevel, authUser.getId(),
                slaFreshnessHours, slaAvailabilityPercent, slaSupport);

        log.info("Certification request submitted: dp={} level={} by user={}",
                name, targetLevel, authUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(request);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/data-products/{name}/certification/history
    // -------------------------------------------------------------------------

    @Operation(summary = "Historique des demandes de certification d'un Data Product.")
    @GetMapping("/api/catalog/data-products/{name}/certification/history")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CatalogCertificationRequest>> getHistory(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        if (dataProductRepository.findByName(name).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(
                certRequestRepository.findByDataProductNameOrderByCreatedAtDesc(name));
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/certification-requests/{id}/review
    // -------------------------------------------------------------------------

    @Operation(summary = "Approuve, rejette ou demande une correction sur une demande de certification.")
    @PostMapping("/api/catalog/certification-requests/{id}/review")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogCertificationRequest> review(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("id") UUID requestId,
            @RequestBody Map<String, Object> body) {

        String decisionStr = body.containsKey("decision") && body.get("decision") != null
                ? body.get("decision").toString().trim().toUpperCase()
                : "";
        if (decisionStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le champ decision est obligatoire (APPROVED | REJECTED | CORRECTION_REQUESTED).");
        }

        CertificationStatus decision;
        try {
            decision = CertificationStatus.valueOf(decisionStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Valeur decision invalide : " + decisionStr);
        }
        if (decision == CertificationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "PENDING n'est pas une décision valide.");
        }

        String comment = body.containsKey("comment") && body.get("comment") != null
                ? body.get("comment").toString()
                : null;

        CatalogCertificationRequest result = certificationService.reviewCertificationRequest(
                requestId, authUser.getId(), decision, comment);

        log.info("Certification request reviewed: id={} decision={} by user={}",
                requestId, decision, authUser.getId());
        return ResponseEntity.ok(result);
    }
}
