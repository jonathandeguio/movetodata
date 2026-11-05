package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogCertificationRequest;
import io.movetodata.catalog.library.models.CertificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CatalogCertificationRequestRepository
        extends JpaRepository<CatalogCertificationRequest, UUID> {

    List<CatalogCertificationRequest> findByDataProductNameOrderByCreatedAtDesc(String dataProductName);

    Optional<CatalogCertificationRequest> findFirstByDataProductNameAndStatusOrderByCreatedAtDesc(
            String dataProductName, CertificationStatus status);
}
