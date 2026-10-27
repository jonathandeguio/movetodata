package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogSubscriptionRepository extends JpaRepository<CatalogSubscription, String> {

    List<CatalogSubscription> findByDataProductId(String dataProductId);

    Optional<CatalogSubscription> findByDataProductIdAndSubscriberId(String dataProductId, UUID subscriberId);

    void deleteByDataProductIdAndSubscriberId(String dataProductId, UUID subscriberId);
}
