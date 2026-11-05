package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Append-only audit log for restricted Data Product access attempts.
 * Written by {@link io.movetodata.catalog.security.CatalogAccessService}.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_restricted_access_log")
public class CatalogRestrictedAccessLog {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** FQN or UUID of the asset being accessed. */
    @Column(name = "asset_id", nullable = false, length = 255)
    private String assetId;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    /** Catalog role at time of access (e.g. CATALOG_READER). */
    @Column(name = "user_role", length = 100)
    private String userRole;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** ALLOWED | DENIED | ALLOWED_PII_MASKED */
    @Column(name = "result", nullable = false, length = 50)
    private String result;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
