package io.movetodata.ai.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Persistent chat session for the F3 — Assistant IA conversationnel feature.
 *
 * One session corresponds to one conversation thread initiated by a user.
 * Sessions are soft-deleted (deleted_at IS NOT NULL means deleted).
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "ai_chat_session")
public class AiChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Client-side generated UUID v4 — stable identifier exposed to the API. */
    @Column(name = "uuid", nullable = false, unique = true, length = 36)
    private String uuid;

    /** Owner of the session — must match the authenticated user. */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * UUID of the connected source active when the session was created.
     * NULL when no specific source context is set.
     */
    @Column(name = "source_id", length = 36)
    private String sourceId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
