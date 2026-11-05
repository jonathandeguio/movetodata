package io.movetodata.catalog.library.services;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.models.CatalogSubscription;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import io.movetodata.catalog.library.repository.CatalogProductViewRepository;
import io.movetodata.catalog.library.repository.CatalogQualityRuleRepository;
import io.movetodata.catalog.library.repository.CatalogSubscriptionRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.notifications.library.enums.NotificationType;
import io.movetodata.notifications.library.models.Notification;
import io.movetodata.notifications.library.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Job planifié toutes les 6 heures qui recalcule le Trust Score composite de chaque
 * Data Product et le persiste dans catalog_data_product.trust_score.
 *
 * La formule correspond à CatalogController#computeTrustScore de sorte que
 * l'endpoint on-demand et le job produisent le même résultat.
 *
 * Les poids sont configurables via application.yml / variables d'environnement :
 *   catalog.trust.weight.completeness   (défaut : 20)
 *   catalog.trust.weight.certification  (défaut : 10)
 *   catalog.trust.weight.quality        (défaut : 30)
 *   catalog.trust.weight.freshness      (défaut : 25)
 *   catalog.trust.weight.usage          (défaut : 15)
 *
 * Déduplication des alertes : avant d'envoyer une notification CATALOG_DRIFT ou
 * CATALOG_TRUST_LOW, le job vérifie qu'aucune notification du même type et du même
 * asset n'est déjà présente à l'état non lu pour ce destinataire.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TrustScoreRefreshJob {

    private static final double TRUST_LOW_THRESHOLD = 0.30;

    // -------------------------------------------------------------------------
    // Poids configurables (somme doit être 100)
    // -------------------------------------------------------------------------

    @Value("${catalog.trust.weight.completeness:20}")
    private int weightCompleteness;

    @Value("${catalog.trust.weight.certification:10}")
    private int weightCertification;

    @Value("${catalog.trust.weight.quality:30}")
    private int weightQuality;

    @Value("${catalog.trust.weight.freshness:25}")
    private int weightFreshness;

    @Value("${catalog.trust.weight.usage:15}")
    private int weightUsage;

    // -------------------------------------------------------------------------
    // Dépendances
    // -------------------------------------------------------------------------

    private final DataProductRepository          dataProductRepository;
    private final CatalogQualityRuleRepository   qualityRuleRepository;
    private final CatalogDatasetStatsRepository  statsRepository;
    private final CatalogProductViewRepository   viewRepository;
    private final NotificationRepository         notificationRepository;
    private final CatalogSubscriptionRepository  subscriptionRepository;
    private final CatalogJobStatusService        jobStatusService;

    // -------------------------------------------------------------------------
    // Validation des poids au démarrage
    // -------------------------------------------------------------------------

    @PostConstruct
    public void validateWeights() {
        int total = weightCompleteness + weightCertification + weightQuality
                  + weightFreshness + weightUsage;
        if (total != 100) {
            throw new IllegalStateException(String.format(
                    "TrustScoreRefreshJob: la somme des poids doit être 100, trouvé %d "
                    + "(completeness=%d, certification=%d, quality=%d, freshness=%d, usage=%d)",
                    total, weightCompleteness, weightCertification, weightQuality,
                    weightFreshness, weightUsage));
        }
        log.info("TrustScoreRefreshJob: poids validés — completeness={} certification={} "
                + "quality={} freshness={} usage={}",
                weightCompleteness, weightCertification, weightQuality,
                weightFreshness, weightUsage);
    }

    // -------------------------------------------------------------------------
    // Job planifié toutes les 6 heures
    // -------------------------------------------------------------------------

    @Scheduled(cron = "0 0 */6 * * ?")
    public void refreshAll() {
        jobStatusService.recordRunStart();
        try {
            doRefresh();
        } catch (Exception e) {
            log.error("TrustScoreRefreshJob: échec global — {}", e.getMessage(), e);
            jobStatusService.recordRunFailure();
            throw e;
        }
    }

    private void doRefresh() {
        List<DataProduct> all = dataProductRepository.findAll();
        if (all.isEmpty()) {
            jobStatusService.recordRunSuccess(0);
            return;
        }

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        double avgViews = viewRepository.avgViewsPerProduct(thirtyDaysAgo);

        int updated    = 0;
        int alertsSent = 0;

        for (DataProduct dp : all) {
            try {
                BigDecimal score = computeScore(dp, thirtyDaysAgo, avgViews);
                boolean scoreChanged = !score.equals(dp.getTrustScore());
                if (scoreChanged) {
                    dp.setTrustScore(score);
                    dataProductRepository.save(dp);
                    updated++;
                }

                // Construire la liste des destinataires (propriétaire + abonnés)
                List<UUID> recipients = new java.util.ArrayList<>();
                if (dp.getOwnerId() != null) {
                    recipients.add(dp.getOwnerId());
                }
                for (CatalogSubscription sub : subscriptionRepository.findByDataProductId(dp.getId())) {
                    if (!recipients.contains(sub.getSubscriberId())) {
                        recipients.add(sub.getSubscriberId());
                    }
                }

                if (!recipients.isEmpty()) {
                    UUID resourceUuid;
                    try {
                        resourceUuid = UUID.fromString(dp.getId());
                    } catch (IllegalArgumentException e) {
                        log.warn("TrustScoreRefreshJob: id non-UUID pour dp={} — alertes ignorées", dp.getId());
                        continue;
                    }

                    // Alerte Trust Score bas
                    if (score.doubleValue() < TRUST_LOW_THRESHOLD) {
                        String msg = String.format(
                                "Trust Score bas (%d%%) pour le Data Product « %s ».",
                                (int)(score.doubleValue() * 100), dp.getName());
                        for (UUID uid : recipients) {
                            if (!hasActiveAlert(uid, resourceUuid, NotificationType.CATALOG_TRUST_LOW)) {
                                createNotification(uid, resourceUuid, NotificationType.CATALOG_TRUST_LOW, msg);
                                alertsSent++;
                            }
                        }
                    }

                    // Alerte Drift actif
                    var latestStats = statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
                    if (!latestStats.isEmpty() && latestStats.get(0).isDriftAlert()) {
                        String msg = String.format(
                                "Drift détecté sur le Data Product « %s » (z-score: %s).",
                                dp.getName(),
                                latestStats.get(0).getDriftScore() != null
                                        ? latestStats.get(0).getDriftScore().toPlainString()
                                        : "—");
                        for (UUID uid : recipients) {
                            if (!hasActiveAlert(uid, resourceUuid, NotificationType.CATALOG_DRIFT)) {
                                createNotification(uid, resourceUuid, NotificationType.CATALOG_DRIFT, msg);
                                alertsSent++;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("TrustScoreRefreshJob: failed for id={} — {}", dp.getId(), e.getMessage());
            }
        }

        log.info("TrustScoreRefreshJob: refreshed {}/{} data products, {} alertes envoyées",
                updated, all.size(), alertsSent);
        jobStatusService.recordRunSuccess(alertsSent);
    }

    // -------------------------------------------------------------------------
    // Déduplication — vérifie si une alerte non lue existe déjà
    // -------------------------------------------------------------------------

    private boolean hasActiveAlert(UUID subscriberId, UUID resourceId, NotificationType type) {
        try {
            return notificationRepository
                    .existsBySubscriberAndResourceIdAndTypeAndIsReadFalse(subscriberId, resourceId, type);
        } catch (Exception e) {
            log.warn("TrustScoreRefreshJob: erreur vérif dédup type={} — {}", type, e.getMessage());
            return false; // en cas d'erreur, on envoie quand même
        }
    }

    // -------------------------------------------------------------------------
    // Création de notification
    // -------------------------------------------------------------------------

    private void createNotification(UUID recipientId, UUID resourceId,
                                    NotificationType type, String message) {
        try {
            Notification n = new Notification();
            n.setId(UUID.randomUUID());
            n.setResourceId(resourceId);
            n.setType(type);
            n.setMessage(message);
            n.setSubscriber(recipientId);
            n.setIsRead(false);
            n.setStatus("UNREAD");
            n.setTimestamp(new Date());
            notificationRepository.save(n);
        } catch (Exception e) {
            log.warn("TrustScoreRefreshJob: notification failed type={} — {}", type, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Calcul du score
    // -------------------------------------------------------------------------

    private BigDecimal computeScore(DataProduct dp, Instant thirtyDaysAgo, double avgViews) {
        double wComp  = weightCompleteness  / 100.0;
        double wCert  = weightCertification / 100.0;
        double wQual  = weightQuality       / 100.0;
        double wFresh = weightFreshness     / 100.0;
        double wUsage = weightUsage         / 100.0;

        // Complétude documentation
        double docScore = 0.0;
        if (dp.getDescription()  != null && !dp.getDescription().isBlank()) docScore += 0.25;
        if (dp.getDomainId()     != null) docScore += 0.25;
        if (dp.getOwnerId()      != null) docScore += 0.25;
        if (dp.getQualityLevel() != null) docScore += 0.25;

        // Certification
        double certScore = 0.0;
        if ("GOLD".equals(dp.getQualityLevel()))        certScore = 1.0;
        else if ("SILVER".equals(dp.getQualityLevel())) certScore = 0.6;
        else if ("BRONZE".equals(dp.getQualityLevel())) certScore = 0.3;

        // Qualité — règles activées / 5
        long enabledRules = qualityRuleRepository
                .findByDataProductIdOrderByCreatedAtAsc(dp.getId())
                .stream().filter(r -> r.isEnabled()).count();
        double qualityScore = Math.min(1.0, enabledRules / 5.0);

        // Fraîcheur — ancienneté du dernier snapshot
        double freshnessScore = 0.0;
        var latestStats = statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
        if (!latestStats.isEmpty()) {
            long daysAgo = ChronoUnit.DAYS.between(latestStats.get(0).getMeasuredAt(), Instant.now());
            if (daysAgo <= 7)       freshnessScore = 1.0;
            else if (daysAgo <= 30) freshnessScore = 0.5;
        }

        // Usage — vues / moyenne plateforme
        long recentViews = viewRepository.countRecentViews(dp.getId(), thirtyDaysAgo);
        double usageScore = avgViews > 0 ? Math.min(1.0, recentViews / avgViews) : 0.5;

        double trust = wComp  * docScore
                     + wCert  * certScore
                     + wQual  * qualityScore
                     + wFresh * freshnessScore
                     + wUsage * usageScore;

        return BigDecimal.valueOf(trust).setScale(2, RoundingMode.HALF_UP);
    }
}
