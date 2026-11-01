package io.movetodata.studio.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Version d'une application Studio.
 *
 * Le brouillon courant = dernière version avec {@code published = false}.
 * Publier = passer {@code published = true} (immutable ensuite).
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "studio_app_version")
public class StudioAppVersion {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "app_id", columnDefinition = "uuid", nullable = false)
    private UUID appId;

    @Column(name = "version", nullable = false)
    private int version;

    /** Définition JSON de l'application (AppDefinition sérialisée). */
    @Column(name = "definition", nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "published", nullable = false)
    @Builder.Default
    private boolean published = false;
}
