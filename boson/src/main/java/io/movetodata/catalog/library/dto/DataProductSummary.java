package io.movetodata.catalog.library.dto;

import io.movetodata.catalog.library.models.DataProduct;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Lightweight projection of a DataProduct used by the search endpoint.
 * Does NOT expose internal UUIDs (ownerId, domainId) — only display values.
 */
@Getter
@Builder
public class DataProductSummary {

    private String name;
    private String fqn;
    private String displayName;
    private String description;
    /** BRONZE | SILVER | GOLD */
    private String qualityLevel;
    /** PUBLIC | INTERNAL | RESTRICTED */
    private String accessPolicy;
    private boolean hasPii;
    private String domainName;
    private String domainId;
    private String sourceType;
    private List<String> tags;
    /** 0–100, null si non calculé. */
    private Integer trustScore;
    private String ownerName;
    private Instant updatedAt;
    private long viewCount;
    private boolean driftAlert;
    private boolean trustLowAlert;

    // -------------------------------------------------------------------------
    // Factory
    // -------------------------------------------------------------------------

    /**
     * Build a summary from a DataProduct entity.
     * domainName and ownerName must be resolved beforehand by the caller.
     */
    public static DataProductSummary from(DataProduct dp,
                                          String domainName,
                                          String ownerName,
                                          boolean hasPii,
                                          boolean driftAlert,
                                          boolean trustLowAlert) {
        int trustScoreInt = dp.getTrustScore() != null
                ? dp.getTrustScore().multiply(BigDecimal.valueOf(100)).intValue()
                : -1;

        return DataProductSummary.builder()
                .name(dp.getName())
                .fqn(dp.getName())          // FQN = name au MVP (pas de namespace multi-niveaux)
                .displayName(dp.getDisplayName())
                .description(dp.getDescription())
                .qualityLevel(dp.getQualityLevel())
                .accessPolicy(dp.getAccessPolicy())
                .hasPii(hasPii)
                .domainName(domainName)
                .domainId(dp.getDomainId())
                .sourceType(dp.getSourceType())
                .tags(List.of())            // Tags non stockés directement sur l'entité — extension possible
                .trustScore(trustScoreInt >= 0 ? trustScoreInt : null)
                .ownerName(ownerName)
                .updatedAt(dp.getUpdatedAt())
                .viewCount(dp.getViewCount() != null ? dp.getViewCount() : 0L)
                .driftAlert(driftAlert)
                .trustLowAlert(trustLowAlert)
                .build();
    }
}
