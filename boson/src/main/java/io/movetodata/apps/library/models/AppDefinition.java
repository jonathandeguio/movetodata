package io.movetodata.apps.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Persistent definition for an App Builder application.
 *
 * One record represents a single app configuration created by a user.
 * The {@code fieldsJson} column stores a JSON array of field descriptors
 * defining the app's schema (e.g. inputs, labels, types).
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "app_definition")
public class AppDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable public identifier exposed through the API (UUID v4). */
    @Column(name = "uuid", nullable = false, unique = true, length = 36)
    private String uuid;

    /** Human-readable application name. */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /** Optional description of the application. */
    @Column(name = "description")
    private String description;

    /**
     * JSON array of field configuration objects.
     * Stored as raw TEXT to avoid schema coupling to the field structure.
     * Default: {@code []} (empty array).
     */
    @Column(name = "fields_json", nullable = false, columnDefinition = "TEXT")
    private String fieldsJson;

    /** Optional icon identifier or name for the application. */
    @Column(name = "icon", length = 100)
    private String icon;

    /** UUID of the user who created this application. */
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
