package io.movetodata.studio.library.repository;

import io.movetodata.studio.library.models.StudioAiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudioAiMessageRepository extends JpaRepository<StudioAiMessage, UUID> {

    /** Tous les messages d'une app, dans l'ordre chronologique. */
    List<StudioAiMessage> findByAppIdOrderByCreatedAtAsc(UUID appId);

    /** Les 10 derniers messages d'une app (contexte IA). */
    List<StudioAiMessage> findTop10ByAppIdOrderByCreatedAtDesc(UUID appId);
}
