package io.movetodata.ai.library.services;

import io.movetodata.ai.library.models.AiChatMessage;
import io.movetodata.ai.library.models.AiChatSession;
import io.movetodata.ai.library.repository.AiChatMessageRepository;
import io.movetodata.ai.library.repository.AiChatSessionRepository;
import io.movetodata.connect.library.models.DatabaseSourceConfig;
import io.movetodata.connect.library.services.SourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * AiChatService — F3 (Assistant IA conversationnel) session management.
 *
 * Handles:
 *  - Session lifecycle (create / soft-delete / lookup)
 *  - Message persistence (user and assistant turns)
 *  - Context building (source schema DDL for the LLM system prompt)
 *
 * Sovereignty: only schema DDL (table/column names + types) is sent to the
 * LLM via the movetodata-ai Python service — raw data values never leave
 * the MoveToData infrastructure.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiChatSessionRepository sessionRepository;
    private final AiChatMessageRepository messageRepository;
    private final TextToSqlService textToSqlService;
    private final SourceService sourceService;

    // -------------------------------------------------------------------------
    // Session lifecycle
    // -------------------------------------------------------------------------

    /**
     * Return an existing active session for the given UUID and user, or create
     * a new one if none exists.
     *
     * The session is created with the provided {@code sourceId} only when a
     * new session is initialised; subsequent messages in the same session do
     * not update the source context.
     *
     * @param sessionUuid client-supplied UUID v4 (may be null — generates a new UUID)
     * @param userId      authenticated user
     * @param sourceId    UUID of the active source (may be null)
     * @return the session entity
     */
    @Transactional
    public AiChatSession getOrCreateSession(String sessionUuid, UUID userId, String sourceId) {
        if (sessionUuid != null && !sessionUuid.isBlank()) {
            Optional<AiChatSession> existing =
                    sessionRepository.findByUuidAndUserIdAndDeletedAtIsNull(sessionUuid, userId);
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        // Create a new session
        String newUuid = (sessionUuid != null && !sessionUuid.isBlank())
                ? sessionUuid
                : UUID.randomUUID().toString();

        AiChatSession session = AiChatSession.builder()
                .uuid(newUuid)
                .userId(userId)
                .sourceId(sourceId)
                .build();

        return sessionRepository.save(session);
    }

    /**
     * Soft-delete a session and all its messages.
     * No-op if the session does not belong to the requesting user.
     *
     * @param sessionUuid session UUID
     * @param userId      authenticated user (ownership check)
     */
    @Transactional
    public void softDeleteSession(String sessionUuid, UUID userId) {
        sessionRepository.findByUuidAndUserIdAndDeletedAtIsNull(sessionUuid, userId)
                .ifPresent(session -> {
                    session.setDeletedAt(Instant.now());
                    sessionRepository.save(session);
                    messageRepository.softDeleteBySessionUuid(sessionUuid);
                    log.info("AI chat session {} soft-deleted for user {}", sessionUuid, userId);
                });
    }

    // -------------------------------------------------------------------------
    // Message persistence
    // -------------------------------------------------------------------------

    /**
     * Persist a single message (user or assistant turn).
     *
     * @param sessionUuid session UUID (must exist)
     * @param role        "user" or "assistant"
     * @param content     message content
     * @param model       LLM model identifier (assistant messages only, may be null)
     * @param tokensUsed  approximate token count (may be null)
     * @return the saved entity
     */
    @Transactional
    public AiChatMessage saveMessage(String sessionUuid, String role, String content,
                                     String model, Integer tokensUsed) {
        AiChatMessage msg = AiChatMessage.builder()
                .sessionUuid(sessionUuid)
                .role(role)
                .content(content)
                .model(model)
                .tokensUsed(tokensUsed)
                .build();
        return messageRepository.save(msg);
    }

    /**
     * Return {@code true} if the session with the given UUID belongs to the user
     * and is not soft-deleted. Used for access control in the history endpoint.
     */
    public boolean sessionBelongsToUser(String sessionUuid, UUID userId) {
        return sessionRepository.findByUuidAndUserIdAndDeletedAtIsNull(sessionUuid, userId).isPresent();
    }

    // -------------------------------------------------------------------------
    // History
    // -------------------------------------------------------------------------

    /**
     * Return the last {@code limit} active messages for a session in
     * chronological order (oldest first).
     *
     * @param sessionUuid session UUID
     * @param limit       maximum number of messages to return (e.g. 50 for UI, 10 for LLM context)
     * @return messages ordered by created_at ASC
     */
    public List<AiChatMessage> getHistory(String sessionUuid, int limit) {
        PageRequest page = PageRequest.of(0, limit, Sort.by("createdAt").ascending());
        return messageRepository.findBySessionUuidAndDeletedAtIsNullOrderByCreatedAtAsc(
                sessionUuid, page);
    }

    // -------------------------------------------------------------------------
    // Context building
    // -------------------------------------------------------------------------

    /**
     * Build the context map forwarded to the Python service alongside the
     * user message and conversation history.
     *
     * The context contains:
     * <ul>
     *   <li>{@code source_id}     — the UUID of the active source (may be null)</li>
     *   <li>{@code schema_info}   — simplified DDL string (table/column names + types)</li>
     *   <li>{@code open_chart_ids} — IDs of charts currently open in the UI</li>
     * </ul>
     *
     * Sovereignty contract: only the schema DDL is included — no data values.
     *
     * @param sourceId     UUID of the active source (may be null)
     * @param openChartIds IDs of open chart tabs
     * @return context map ready to be serialised in the Python service request
     */
    public Map<String, Object> buildContext(String sourceId, List<?> openChartIds) {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("source_id", sourceId);
        ctx.put("open_chart_ids", openChartIds != null ? openChartIds : List.of());

        if (sourceId == null || sourceId.isBlank()) {
            ctx.put("schema_info", null);
            return ctx;
        }

        try {
            UUID sourceUuid = UUID.fromString(sourceId);
            DatabaseSourceConfig config = sourceService.getSourceDatabaseSourceConfig(sourceUuid);
            String schemaDdl = textToSqlService.buildSchemaDdl(config);
            ctx.put("schema_info", schemaDdl.isBlank() ? null : schemaDdl);
        } catch (Exception e) {
            log.warn("buildContext: could not retrieve schema DDL for source {} — {}", sourceId, e.getMessage());
            ctx.put("schema_info", null);
        }

        return ctx;
    }
}
