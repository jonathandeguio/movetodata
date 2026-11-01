package io.movetodata.studio.library.repository;

import io.movetodata.studio.library.models.StudioApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudioAppRepository extends JpaRepository<StudioApp, UUID> {

    /** Toutes les apps non supprimées, triées par date de mise à jour décroissante. */
    List<StudioApp> findByDeletedAtIsNullOrderByUpdatedAtDesc();

    /** Une app non supprimée par son identifiant. */
    Optional<StudioApp> findByIdAndDeletedAtIsNull(UUID id);
}
