package io.movetodata.ai.library.repository;

import io.movetodata.ai.library.models.AiChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {

    /** Find an active session by its public UUID, scoped to a user. */
    Optional<AiChatSession> findByUuidAndUserIdAndDeletedAtIsNull(String uuid, UUID userId);

    /** Find an active session by UUID alone (used during streaming, ownership already validated). */
    Optional<AiChatSession> findByUuidAndDeletedAtIsNull(String uuid);

    /** List all active sessions for a user, most recent first. */
    List<AiChatSession> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);
}
