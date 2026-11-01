package io.movetodata.studio.library.repository;

import io.movetodata.studio.library.models.StudioAppVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudioAppVersionRepository extends JpaRepository<StudioAppVersion, UUID> {

    /** Toutes les versions d'une app, triées par version décroissante. */
    List<StudioAppVersion> findByAppIdOrderByVersionDesc(UUID appId);

    /** Dernière version publiée d'une app. */
    Optional<StudioAppVersion> findTopByAppIdAndPublishedTrueOrderByVersionDesc(UUID appId);

    /** Brouillon courant = dernière version non publiée. */
    Optional<StudioAppVersion> findTopByAppIdAndPublishedFalseOrderByVersionDesc(UUID appId);
}
