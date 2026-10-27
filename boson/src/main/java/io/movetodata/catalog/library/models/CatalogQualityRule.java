package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * A data quality rule attached to a Data Product (optionally scoped to one column).
 *
 * ruleType: NOT_NULL | RANGE | REGEX | UNIQUENESS | CUSTOM
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_quality_rule")
public class CatalogQualityRule {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private String id;

    @Column(name = "data_product_id", columnDefinition = "uuid", nullable = false)
    private String dataProductId;

    @Column(name = "column_name", length = 255)
    private String columnName;

    @Column(name = "rule_type", nullable = false, length = 50)
    private String ruleType;

    @Column(name = "expression", nullable = false, columnDefinition = "TEXT")
    private String expression;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "created_by", nullable = false, columnDefinition = "uuid")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
