package io.movetodata.ai.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.UUID;

/**
 * Persistent quality score and chart suggestions for a connected source.
 *
 * F4 — Smart Connector.
 *
 * One row per source (UNIQUE constraint on source_id). Updated in-place via
 * save() when re-analysis is triggered.
 *
 * detectedTypes     : { columnName → "time_series"|"numeric"|"categorical"|"geographic"|"boolean"|"text" }
 * chartSuggestions  : list of suggestion objects (chartType, columnX, columnY, title, reason)
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "ai_source_quality")
public class AiSourceQuality {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false, unique = true)
    private UUID sourceId;

    @Column(name = "global_score")
    private Integer globalScore;

    @Column(name = "completeness")
    private Integer completeness;

    @Column(name = "uniqueness")
    private Integer uniqueness;

    @Column(name = "consistency")
    private Integer consistency;

    @Column(name = "outlier_ratio", precision = 5, scale = 4)
    private BigDecimal outlierRatio;

    @Type(type = "jsonb")
    @Column(name = "detected_types", columnDefinition = "jsonb")
    private Map<String, Object> detectedTypes;

    @Type(type = "jsonb")
    @Column(name = "chart_suggestions", columnDefinition = "jsonb")
    private List<Map<String, Object>> chartSuggestions;

    @CreationTimestamp
    @Column(name = "analyzed_at")
    private Instant analyzedAt;
}
