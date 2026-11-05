package io.movetodata.notifications.library.repository;

import io.movetodata.notifications.library.enums.NotificationType;
import io.movetodata.notifications.library.models.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import java.util.UUID;

public interface NotificationRepository extends PagingAndSortingRepository<Notification, UUID> {

    Page<Notification> findAllBySubscriberEquals(UUID subscriber, Pageable pageable);
    Iterable<Notification> findAllBySubscriber(UUID userId);

    /**
     * Vérifie l'existence d'une notification non lue d'un type donné pour un destinataire
     * et une ressource spécifique. Utilisé pour la déduplication des alertes dans
     * {@link io.movetodata.catalog.library.services.TrustScoreRefreshJob}.
     */
    boolean existsBySubscriberAndResourceIdAndTypeAndIsReadFalse(
            UUID subscriber, UUID resourceId, NotificationType type);
}
