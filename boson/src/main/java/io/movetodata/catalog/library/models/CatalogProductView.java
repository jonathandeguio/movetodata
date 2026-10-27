package io.movetodata.catalog.library.models;

import lombok.*;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Records each consultation of a DataProduct's catalog page.
 * Used to compute the usage_score component of the Trust Score.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_product_view")
public class CatalogProductView {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private String id;

    @Column(name = "data_product_id", columnDefinition = "uuid", nullable = false)
    private String dataProductId;

    @Column(name = "viewer_id", columnDefinition = "uuid")
    private UUID viewerId;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt;
}
