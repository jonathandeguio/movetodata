package io.movetodata.studio.library.repository;

import io.movetodata.studio.library.models.StudioQueryAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StudioQueryAuditRepository extends JpaRepository<StudioQueryAudit, UUID> {
    // save() hérité de JpaRepository est suffisant pour la Phase 2.
    // Des méthodes de lecture seront ajoutées en Phase 5 (rapports d'audit).
}
