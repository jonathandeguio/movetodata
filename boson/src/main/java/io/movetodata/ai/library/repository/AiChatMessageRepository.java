package io.movetodata.ai.library.repository;

import io.movetodata.ai.library.models.AiChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    /**
     * All active messages for a session in chronological order.
     * Use with {@code PageRequest.of(0, limit, Sort.by("createdAt").ascending())}
     * to cap at {@code limit} messages.
     */
    List<AiChatMessage> findBySessionUuidAndDeletedAtIsNullOrderByCreatedAtAsc(
            String sessionUuid, Pageable pageable);

    /**
     * Soft-delete all messages belonging to a session.
     * Called when the session itself is soft-deleted.
     */
    @Query("UPDATE AiChatMessage m SET m.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE m.sessionUuid = :sessionUuid AND m.deletedAt IS NULL")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void softDeleteBySessionUuid(@Param("sessionUuid") String sessionUuid);
}
