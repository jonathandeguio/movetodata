package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogGdprDeclaration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CatalogGdprDeclarationRepository
        extends JpaRepository<CatalogGdprDeclaration, UUID> {

    Optional<CatalogGdprDeclaration> findByDataProductName(String dataProductName);
}
