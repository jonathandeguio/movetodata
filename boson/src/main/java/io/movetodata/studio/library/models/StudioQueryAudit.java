package io.movetodata.studio.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Journal d'audit des exécutions de requêtes d'une application Studio.
 * Chaque exécution (lecture ou écriture) est tracée ici.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "studio_query_audit")
public class StudioQueryAudit {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "app_id", columnDefinition = "uuid", nullable = false)
    private UUID appId;

    @Column(name = "version", nullable = false)
    private int version;

    @Column(name = "query_id", nullable = false, length = 128)
    private String queryId;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    /** Paramètres de la requête sérialisés en JSON. */
    @Column(name = "params", columnDefinition = "TEXT")
    private String params;

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "error", columnDefinition = "TEXT")
    private String error;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
