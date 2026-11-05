package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogGlossaryDataProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CatalogGlossaryDataProductRepository
        extends JpaRepository<CatalogGlossaryDataProduct, CatalogGlossaryDataProduct.PK> {

    List<CatalogGlossaryDataProduct> findByGlossaryTermId(UUID glossaryTermId);

    List<CatalogGlossaryDataProduct> findByDataProductName(String dataProductName);

    boolean existsByGlossaryTermIdAndDataProductName(UUID glossaryTermId, String dataProductName);

    void deleteByGlossaryTermIdAndDataProductName(UUID glossaryTermId, String dataProductName);

    @Query("SELECT COUNT(g) FROM CatalogGlossaryDataProduct g WHERE g.glossaryTermId = :termId")
    long countByGlossaryTermId(@Param("termId") UUID termId);
}
