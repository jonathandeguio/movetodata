package io.movetodata.catalog.library.services;

import io.movetodata.catalog.library.dto.CriterionCheck;
import io.movetodata.catalog.library.dto.GoldCriteriaSummary;
import io.movetodata.catalog.library.models.*;
import io.movetodata.catalog.library.repository.*;
import io.movetodata.catalog.security.CatalogAccessService;
import io.movetodata.passport.library.models.User;
import io.movetodata.passport.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service de certification Gold avec workflow complet (Lot 4).
 *
 * <p>Critères Gold vérifiés par {@link #checkGoldCriteria} :
 * <ol>
 *   <li>Au moins un snapshot de stats dans les 30 derniers jours (proxy SLA fraîcheur).</li>
 *   <li>Toutes les QualityRule sont enabled et il en existe au moins une.</li>
 *   <li>Score de confiance &ge; seuil Gold du DataProduct (défaut 80).</li>
 *   <li>Description non vide ET au moins un cas d'usage déclaré.</li>
 *   <li>Une déclaration RGPD existe pour ce DataProduct.</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogCertificationService {

    private final DataProductRepository                   dataProductRepository;
    private final CatalogQualityRuleRepository            qualityRuleRepository;
    private final CatalogDatasetStatsRepository           statsRepository;
    private final CatalogGdprDeclarationRepository        gdprRepository;
    private final CatalogCertificationRequestRepository   certRequestRepository;
    private final CatalogAuditLogRepository               auditLogRepository;
    private final UserRepository                          userRepository;
    private final CatalogAccessService                    accessService;

    // -------------------------------------------------------------------------
    // Critères Gold
    // -------------------------------------------------------------------------

    /**
     * Évalue les critères Gold pour un DataProduct donné.
     *
     * @param dp           le DataProduct à évaluer
     * @param currentUserId UUID de l'utilisateur authentifié (pour le flag canReview)
     */
    public GoldCriteriaSummary checkGoldCriteria(DataProduct dp, UUID currentUserId) {
        List<CriterionCheck> criteria = new ArrayList<>();

        // ---- Critère 1 : SLA fraîcheur (au moins 1 snapshot dans les 30 derniers jours) ----
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<CatalogDatasetStats> recentStats =
                statsRepository.findTop30ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
        boolean hasFreshSnapshot = recentStats.stream()
                .anyMatch(s -> s.getMeasuredAt().isAfter(thirtyDaysAgo));
        criteria.add(CriterionCheck.builder()
                .key("sla_30d")
                .label("SLA fraîcheur respecté sur 30 jours")
                .passed(hasFreshSnapshot)
                .explanation(hasFreshSnapshot
                        ? "Un ou plusieurs snapshots de statistiques ont été enregistrés au cours des 30 derniers jours."
                        : "Aucun snapshot de statistiques dans les 30 derniers jours. Exécutez un job de stats.")
                .link("/portal/catalog/data-product/" + encode(dp.getName()) + "?tab=stats")
                .build());

        // ---- Critère 2 : Tests QA (toutes les règles enabled, au moins 1) ----
        List<CatalogQualityRule> rules =
                qualityRuleRepository.findByDataProductIdOrderByCreatedAtAsc(dp.getId());
        boolean hasRules     = !rules.isEmpty();
        boolean allEnabled   = hasRules && rules.stream().allMatch(CatalogQualityRule::isEnabled);
        boolean qaOk         = hasRules && allEnabled;
        String qaExplanation;
        if (!hasRules) {
            qaExplanation = "Aucune règle de qualité définie. Ajoutez au moins une règle dans l'onglet Qualité.";
        } else if (!allEnabled) {
            long disabled = rules.stream().filter(r -> !r.isEnabled()).count();
            qaExplanation = disabled + " règle(s) désactivée(s). Toutes les règles doivent être actives.";
        } else {
            qaExplanation = rules.size() + " règle(s) de qualité active(s).";
        }
        criteria.add(CriterionCheck.builder()
                .key("qa_all_enabled")
                .label("Règles QA définies et actives")
                .passed(qaOk)
                .explanation(qaExplanation)
                .link("/portal/catalog/data-product/" + encode(dp.getName()) + "?tab=quality")
                .build());

        // ---- Critère 3 : Score de confiance >= seuil Gold ----
        int threshold = dp.getGoldThreshold() != null ? dp.getGoldThreshold() : 80;
        BigDecimal trustScore = dp.getTrustScore();
        int trustScoreInt = trustScore != null
                ? trustScore.multiply(BigDecimal.valueOf(100)).intValue()
                : 0;
        boolean trustOk = trustScoreInt >= threshold;
        criteria.add(CriterionCheck.builder()
                .key("trust_score")
                .label("Score de confiance ≥ " + threshold + " %")
                .passed(trustOk)
                .explanation("Score actuel : " + trustScoreInt + " %. Seuil requis : " + threshold + " %.")
                .link("/portal/catalog/data-product/" + encode(dp.getName()))
                .build());

        // ---- Critère 4 : Documentation complète (description + use cases) ----
        boolean hasDescription = dp.getDescription() != null && !dp.getDescription().isBlank();
        boolean hasUseCases    = hasUseCases(dp.getUseCases());
        boolean docOk          = hasDescription && hasUseCases;
        String docExplanation;
        if (!hasDescription && !hasUseCases) {
            docExplanation = "Description et cas d'usage manquants.";
        } else if (!hasDescription) {
            docExplanation = "Description manquante.";
        } else if (!hasUseCases) {
            docExplanation = "Aucun cas d'usage déclaré.";
        } else {
            docExplanation = "Documentation complète.";
        }
        criteria.add(CriterionCheck.builder()
                .key("documentation")
                .label("Documentation complète (description + cas d'usage)")
                .passed(docOk)
                .explanation(docExplanation)
                .link("/portal/catalog/data-product/" + encode(dp.getName()))
                .build());

        // ---- Critère 5 : Déclaration RGPD ----
        boolean hasGdpr = gdprRepository.findByDataProductName(dp.getName()).isPresent();
        criteria.add(CriterionCheck.builder()
                .key("gdpr")
                .label("Classification RGPD déclarée")
                .passed(hasGdpr)
                .explanation(hasGdpr
                        ? "Déclaration RGPD enregistrée."
                        : "Aucune déclaration RGPD. Renseignez la fiche RGPD dans l'onglet Gouvernance.")
                .link("/portal/catalog/data-product/" + encode(dp.getName()) + "?tab=governance")
                .build());

        int passedCount = (int) criteria.stream().filter(CriterionCheck::isPassed).count();

        // Flag canReview : l'utilisateur est CATALOG_STEWARD
        boolean canReview = false;
        if (currentUserId != null) {
            try {
                User user = userRepository.getReferenceById(currentUserId);
                canReview = accessService.isInAnyGroup(user, List.of(CatalogAccessService.GROUP_STEWARD));
            } catch (Exception e) {
                log.debug("checkGoldCriteria: impossible de vérifier le rôle de l'utilisateur {}: {}",
                        currentUserId, e.getMessage());
            }
        }

        return GoldCriteriaSummary.builder()
                .criteria(criteria)
                .passedCount(passedCount)
                .totalCount(criteria.size())
                .allPassed(passedCount == criteria.size())
                .canReview(canReview)
                .build();
    }

    // -------------------------------------------------------------------------
    // Soumission
    // -------------------------------------------------------------------------

    /**
     * Soumet une demande de certification.
     *
     * @throws ResponseStatusException 403 si l'utilisateur n'est pas OWNER/STEWARD du DataProduct
     * @throws ResponseStatusException 422 si les critères Gold ne sont pas remplis (cible GOLD)
     */
    @Transactional
    public CatalogCertificationRequest submitCertificationRequest(
            String dataProductName,
            CertificationLevel targetLevel,
            UUID submittedBy,
            Integer slaFreshnessHours,
            BigDecimal slaAvailabilityPercent,
            String slaSupport) {

        DataProduct dp = dataProductRepository.findByName(dataProductName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Data Product introuvable : " + dataProductName));

        // Vérification des droits : doit être OWNER ou STEWARD
        checkSubmitRight(dp, submittedBy);

        // Pour Gold : vérifier les critères
        if (targetLevel == CertificationLevel.GOLD) {
            GoldCriteriaSummary summary = checkGoldCriteria(dp, submittedBy);
            if (!summary.isAllPassed()) {
                List<String> missing = summary.getCriteria().stream()
                        .filter(c -> !c.isPassed())
                        .map(CriterionCheck::getLabel)
                        .collect(java.util.stream.Collectors.toList());
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Critères Gold non remplis : " + String.join(", ", missing));
            }
        }

        CatalogCertificationRequest request = CatalogCertificationRequest.builder()
                .id(UUID.randomUUID())
                .dataProductName(dataProductName)
                .targetLevel(targetLevel)
                .status(CertificationStatus.PENDING)
                .submittedBy(submittedBy)
                .slaFreshnessHours(slaFreshnessHours)
                .slaAvailabilityPercent(slaAvailabilityPercent)
                .slaSupport(slaSupport)
                .build();

        CatalogCertificationRequest saved = certRequestRepository.save(request);
        logAudit(dp.getId(), submittedBy.toString(), "CERTIFY_SUBMIT",
                "targetLevel=" + targetLevel + " requestId=" + saved.getId());
        return saved;
    }

    // -------------------------------------------------------------------------
    // Revue (approve / reject / correction)
    // -------------------------------------------------------------------------

    /**
     * Revue d'une demande de certification par un CATALOG_STEWARD.
     *
     * @throws ResponseStatusException 403 si l'utilisateur n'est pas CATALOG_STEWARD
     * @throws ResponseStatusException 404 si la demande n'existe pas
     */
    @Transactional
    public CatalogCertificationRequest reviewCertificationRequest(
            UUID requestId,
            UUID reviewerId,
            CertificationStatus decision,
            String comment) {

        CatalogCertificationRequest req = certRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Demande de certification introuvable : " + requestId));

        // Vérification des droits : doit être CATALOG_STEWARD
        checkReviewRight(reviewerId);

        req.setStatus(decision);
        req.setReviewedBy(reviewerId);
        req.setComment(comment);

        if (decision == CertificationStatus.APPROVED) {
            // Promouvoir le niveau du Data Product
            DataProduct dp = dataProductRepository.findByName(req.getDataProductName())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Data Product introuvable : " + req.getDataProductName()));
            dp.setQualityLevel(req.getTargetLevel().name());
            dataProductRepository.save(dp);
            logAudit(dp.getId(), reviewerId.toString(), "CERTIFY_APPROVE",
                    "requestId=" + requestId + " newLevel=" + req.getTargetLevel());
        } else {
            DataProduct dp = dataProductRepository.findByName(req.getDataProductName())
                    .orElse(null);
            String dpId = dp != null ? dp.getId() : req.getDataProductName();
            String action = decision == CertificationStatus.REJECTED
                    ? "CERTIFY_REJECT"
                    : "CERTIFY_CORRECTION";
            logAudit(dpId, reviewerId.toString(), action,
                    "requestId=" + requestId);
        }

        return certRequestRepository.save(req);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void checkSubmitRight(DataProduct dp, UUID userId) {
        try {
            User user = userRepository.getReferenceById(userId);
            boolean isOwnerOrSteward = accessService.isInAnyGroup(user,
                    List.of(CatalogAccessService.GROUP_OWNER, CatalogAccessService.GROUP_STEWARD));
            // Accepter aussi si l'utilisateur est le ownerId ou stewardId du DataProduct
            boolean isProductOwner  = userId.equals(dp.getOwnerId());
            boolean isProductSteward = userId.equals(dp.getStewardId());
            if (!isOwnerOrSteward && !isProductOwner && !isProductSteward) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Seul le propriétaire ou le steward d'un Data Product peut soumettre une demande de certification.");
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("checkSubmitRight: erreur lors de la vérification des droits pour userId={}: {}",
                    userId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Impossible de vérifier les droits : " + e.getMessage());
        }
    }

    private void checkReviewRight(UUID userId) {
        try {
            User user = userRepository.getReferenceById(userId);
            boolean isSteward = accessService.isInAnyGroup(user,
                    List.of(CatalogAccessService.GROUP_STEWARD));
            if (!isSteward) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Seul un CATALOG_STEWARD peut valider une demande de certification.");
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("checkReviewRight: erreur lors de la vérification des droits pour userId={}: {}",
                    userId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Impossible de vérifier les droits : " + e.getMessage());
        }
    }

    /** Vérifie si le champ useCases (JSON array) contient au moins un élément non vide. */
    private static boolean hasUseCases(String useCasesJson) {
        if (useCasesJson == null || useCasesJson.isBlank()) return false;
        String trimmed = useCasesJson.trim();
        // Format attendu : tableau JSON ex. ["Cas 1","Cas 2"] ou chaîne simple non vide
        if (trimmed.startsWith("[")) {
            // Tableau JSON minimal — vérifie qu'il n'est pas vide
            return !trimmed.equals("[]") && trimmed.length() > 2;
        }
        // Chaîne simple : non vide
        return !trimmed.isEmpty();
    }

    private static String encode(String name) {
        try {
            return java.net.URLEncoder.encode(name, "UTF-8");
        } catch (java.io.UnsupportedEncodingException e) {
            return name;
        }
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
            log.warn("logAudit: échec action={} dpId={} — {}", action, dataProductId, e.getMessage());
        }
    }
}
