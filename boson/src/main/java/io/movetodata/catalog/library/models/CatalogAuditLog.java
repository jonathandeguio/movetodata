package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "catalog_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogAuditLog {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private String id;

    @Column(name = "data_product_id", columnDefinition = "uuid", nullable = false)
    private String dataProductId;

    @Column(name = "actor_id", columnDefinition = "uuid")
    private String actorId;

    @Column(name = "action", length = 64, nullable = false)
    private String action;

    @Column(name = "detail", columnDefinition = "text")
    private String detail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
