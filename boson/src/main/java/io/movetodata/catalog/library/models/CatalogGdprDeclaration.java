package io.movetodata.catalog.library.models;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * RGPD declaration attached to a Data Product name.
 * Stores legal basis, retention period, and PII column metadata.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
@Table(name = "catalog_gdpr_declaration")
public class CatalogGdprDeclaration {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Must match a {@link DataProduct#getName()} value. */
    @Column(name = "data_product_name", nullable = false, unique = true, length = 255)
    private String dataProductName;

    @Column(name = "data_controller", length = 255)
    private String dataController;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    /** e.g. LEGITIMATE_INTEREST | CONTRACT | CONSENT | LEGAL_OBLIGATION */
    @Column(name = "legal_basis", length = 100)
    private String legalBasis;

    @Column(name = "retention_days")
    private Integer retentionDays;

    /** JSON array of column names that contain PII. */
    @Type(type = "jsonb")
    @Column(name = "pii_columns", columnDefinition = "jsonb")
    private List<String> piiColumns;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
