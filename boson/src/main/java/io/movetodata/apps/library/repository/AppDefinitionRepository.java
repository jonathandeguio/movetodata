package io.movetodata.apps.library.repository;

import io.movetodata.apps.library.models.AppDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppDefinitionRepository extends JpaRepository<AppDefinition, Long> {

    /** Find an app definition by its public UUID. */
    Optional<AppDefinition> findByUuid(String uuid);

    /** List all app definitions owned by a given user, newest first. */
    List<AppDefinition> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);
}
