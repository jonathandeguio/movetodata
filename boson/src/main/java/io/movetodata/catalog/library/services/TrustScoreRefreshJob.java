package io.movetodata.catalog.library.services;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import io.movetodata.catalog.library.repository.CatalogProductViewRepository;
import io.movetodata.catalog.library.repository.CatalogQualityRuleRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.notifications.library.enums.NotificationType;
import io.movetodata.notifications.library.models.Notification;
import io.movetodata.notifications.library.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Nightly Quartz-backed job that recomputes the composite Trust Score for every
 * Data Product and persists it to catalog_data_product.trust_score.
 *
 * Runs at 02:00 every day. The formula mirrors CatalogController#computeTrustScore
 * so that both the on-demand endpoint and the scheduled job produce the same result.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TrustScoreRefreshJob {

    private static final double TRUST_LOW_THRESHOLD = 0.30;

    private final DataProductRepository          dataProductRepository;
    private final CatalogQualityRuleRepository   qualityRuleRepository;
    private final CatalogDatasetStatsRepository  statsRepository;
    private final CatalogProductViewRepository   viewRepository;
    private final NotificationRepository         notificationRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    public void refreshAll() {
        List<DataProduct> all = dataProductRepository.findAll();
        if (all.isEmpty()) {
            return;
        }

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        double avgViews = viewRepository.avgViewsPerProduct(thirtyDaysAgo);

        int updated = 0;
        for (DataProduct dp : all) {
            try {
                BigDecimal score = computeScore(dp, thirtyDaysAgo, avgViews);
                boolean scoreChanged = !score.equals(dp.getTrustScore());
                if (scoreChanged) {
                    dp.setTrustScore(score);
                    dataProductRepository.save(dp);
                    updated++;
                }
                if (dp.getOwnerId() != null) {
                    // Alert on low trust score
                    if (score.doubleValue() < TRUST_LOW_THRESHOLD) {
                        createNotification(dp.getOwnerId(), dp.getId(),
                                NotificationType.CATALOG_TRUST_LOW,
                                String.format("Trust Score bas (%d%%) pour le Data Product « %s ».",
                                        (int)(score.doubleValue() * 100), dp.getName()));
                    }
                    // Alert on active drift
                    var latestStats = statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
                    if (!latestStats.isEmpty() && latestStats.get(0).isDriftAlert()) {
                        createNotification(dp.getOwnerId(), dp.getId(),
                                NotificationType.CATALOG_DRIFT,
                                String.format("Drift détecté sur le Data Product « %s » (z-score: %s).",
                                        dp.getName(),
                                        latestStats.get(0).getDriftScore() != null
                                                ? latestStats.get(0).getDriftScore().toPlainString()
                                                : "—"));
                    }
                }
            } catch (Exception e) {
                log.warn("TrustScoreRefreshJob: failed for id={} — {}", dp.getId(), e.getMessage());
            }
        }
        log.info("TrustScoreRefreshJob: refreshed {}/{} data products", updated, all.size());
    }

    private void createNotification(UUID ownerId, String resourceIdStr,
                                    NotificationType type, String message) {
        try {
            Notification n = new Notification();
            n.setId(UUID.randomUUID());
            n.setResourceId(UUID.fromString(resourceIdStr));
            n.setType(type);
            n.setMessage(message);
            n.setSubscriber(ownerId);
            n.setIsRead(false);
            n.setStatus("UNREAD");
            n.setTimestamp(new Date());
            notificationRepository.save(n);
        } catch (Exception e) {
            log.warn("TrustScoreRefreshJob: notification failed type={} — {}", type, e.getMessage());
        }
    }

    private BigDecimal computeScore(DataProduct dp, Instant thirtyDaysAgo, double avgViews) {
        // 20% documentation
        double docScore = 0.0;
        if (dp.getDescription()  != null && !dp.getDescription().isBlank()) docScore += 0.25;
        if (dp.getDomainId()     != null) docScore += 0.25;
        if (dp.getOwnerId()      != null) docScore += 0.25;
        if (dp.getQualityLevel() != null) docScore += 0.25;

        // 10% certification
        double certScore = 0.0;
        if ("GOLD".equals(dp.getQualityLevel()))        certScore = 1.0;
        else if ("SILVER".equals(dp.getQualityLevel())) certScore = 0.6;
        else if ("BRONZE".equals(dp.getQualityLevel())) certScore = 0.3;

        // 30% quality — enabled rules count / 5
        long enabledRules = qualityRuleRepository
                .findByDataProductIdOrderByCreatedAtAsc(dp.getId())
                .stream().filter(r -> r.isEnabled()).count();
        double qualityScore = Math.min(1.0, enabledRules / 5.0);

        // 25% freshness — age of latest stats snapshot
        double freshnessScore = 0.0;
        var latestStats = statsRepository.findTop10ByDataProductIdOrderByMeasuredAtDesc(dp.getId());
        if (!latestStats.isEmpty()) {
            long daysAgo = ChronoUnit.DAYS.between(latestStats.get(0).getMeasuredAt(), Instant.now());
            if (daysAgo <= 7)       freshnessScore = 1.0;
            else if (daysAgo <= 30) freshnessScore = 0.5;
        }

        // 15% usage — views / platform avg
        long recentViews = viewRepository.countRecentViews(dp.getId(), thirtyDaysAgo);
        double usageScore = avgViews > 0 ? Math.min(1.0, recentViews / avgViews) : 0.5;

        double trust = 0.20 * docScore
                     + 0.10 * certScore
                     + 0.30 * qualityScore
                     + 0.25 * freshnessScore
                     + 0.15 * usageScore;

        return BigDecimal.valueOf(trust).setScale(2, RoundingMode.HALF_UP);
    }
}
