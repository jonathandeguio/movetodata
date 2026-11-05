package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Demande de certification dans le workflow complet (Lot 4).
 * <p>
 * Une demande transite par les statuts PENDING → APPROVED | REJECTED | CORRECTION_REQUESTED.
 */
@Entity
@Table(name = "catalog_certification_request")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogCertificationRequest {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Clé naturelle du Data Product (correspond à {@link DataProduct#getName()}). */
    @Column(name = "data_product_name", nullable = false, length = 255)
    private String dataProductName;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_level", nullable = false, length = 20)
    private CertificationLevel targetLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private CertificationStatus status;

    @Column(name = "submitted_by", nullable = false, columnDefinition = "uuid")
    private UUID submittedBy;

    @Column(name = "reviewed_by", columnDefinition = "uuid")
    private UUID reviewedBy;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    /** SLA — fraîcheur attendue (en heures). */
    @Column(name = "sla_freshness_hours")
    private Integer slaFreshnessHours;

    /** SLA — disponibilité attendue (en %). */
    @Column(name = "sla_availability_percent", precision = 5, scale = 2)
    private BigDecimal slaAvailabilityPercent;

    /** SLA — niveau de support. */
    @Column(name = "sla_support", length = 100)
    private String slaSupport;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
