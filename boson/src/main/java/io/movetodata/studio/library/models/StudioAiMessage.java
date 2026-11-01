package io.movetodata.studio.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Message de conversation avec l'assistant IA pour une application Studio.
 *
 * {@code role} : user | assistant
 * {@code patch} : PatchOp[] sérialisé en JSON, null si message sans patch.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "studio_ai_message")
public class StudioAiMessage {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "app_id", columnDefinition = "uuid", nullable = false)
    private UUID appId;

    @Column(name = "role", nullable = false, length = 16)
    private String role;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "patch", columnDefinition = "TEXT")
    private String patch;

    @Column(name = "applied", nullable = false)
    @Builder.Default
    private boolean applied = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
