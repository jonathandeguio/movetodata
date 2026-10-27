package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "catalog_subscription",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_sub_dp_user",
        columnNames = {"data_product_id", "subscriber_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogSubscription {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private String id;

    @Column(name = "data_product_id", columnDefinition = "uuid", nullable = false)
    private String dataProductId;

    @Column(name = "subscriber_id", columnDefinition = "uuid", nullable = false)
    private UUID subscriberId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
