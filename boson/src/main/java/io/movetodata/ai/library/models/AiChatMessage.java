package io.movetodata.ai.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.Instant;

/**
 * A single message within an {@link AiChatSession}.
 *
 * Role is either "user" (message typed by the user) or "assistant" (token
 * stream accumulated from the LLM and persisted after the SSE stream closes).
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "ai_chat_message")
public class AiChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Foreign key to ai_chat_session.uuid. */
    @Column(name = "session_uuid", nullable = false, length = 36)
    private String sessionUuid;

    /** "user" or "assistant". */
    @Column(name = "role", nullable = false, length = 10)
    private String role;

    /** Full text content of the message. */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /** LLM model identifier used to generate this message (assistant only). */
    @Column(name = "model", length = 100)
    private String model;

    /** Approximate token count (assistant messages only). */
    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
