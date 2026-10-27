package io.movetodata.catalog.library.services;

import io.movetodata.catalog.library.models.CatalogDatasetStats;
import io.movetodata.catalog.library.repository.CatalogDatasetStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Computes a z-score drift indicator when a new dataset stats snapshot arrives.
 *
 * Algorithm: population z-score of the new recordCount against the mean and
 * standard deviation of the last 30 snapshots for the same Data Product.
 * A z-score with |z| > 2.0 triggers driftAlert = true.
 *
 * Requires at least 3 prior snapshots to compute a meaningful score; returns
 * driftScore = null and driftAlert = false otherwise.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataDriftService {

    private static final double DRIFT_THRESHOLD = 2.0;
    private static final int    MIN_SNAPSHOTS   = 3;

    private final CatalogDatasetStatsRepository statsRepository;

    /**
     * Compute the z-score drift for a new record count observation.
     *
     * @param dataProductId UUID string of the DataProduct
     * @param newRecordCount the freshly-observed row count
     * @return a {@link DriftResult} with score and alert flag
     */
    public DriftResult computeDrift(String dataProductId, long newRecordCount) {
        List<CatalogDatasetStats> history =
                statsRepository.findTop30ByDataProductIdOrderByMeasuredAtDesc(dataProductId);

        if (history.size() < MIN_SNAPSHOTS) {
            return new DriftResult(null, false);
        }

        double[] counts = history.stream()
                .mapToDouble(CatalogDatasetStats::getRecordCount)
                .toArray();

        double mean = mean(counts);
        double std  = stdDev(counts, mean);

        if (std < 0.001) {
            // No variance — any change is suspicious; treat as no drift if equal
            boolean alert = newRecordCount != (long) mean;
            return new DriftResult(BigDecimal.ZERO, alert);
        }

        double z = (newRecordCount - mean) / std;
        boolean alert = Math.abs(z) > DRIFT_THRESHOLD;

        log.info("drift: product={} count={} mean={:.0f} std={:.0f} z={:.3f} alert={}",
                dataProductId, newRecordCount, mean, std, z, alert);

        return new DriftResult(
                BigDecimal.valueOf(z).setScale(3, RoundingMode.HALF_UP),
                alert
        );
    }

    // -------------------------------------------------------------------------

    private static double mean(double[] values) {
        double sum = 0;
        for (double v : values) sum += v;
        return sum / values.length;
    }

    private static double stdDev(double[] values, double mean) {
        double variance = 0;
        for (double v : values) variance += (v - mean) * (v - mean);
        return Math.sqrt(variance / values.length);
    }

    public record DriftResult(BigDecimal score, boolean alert) {}
}
