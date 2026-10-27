package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.DataProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataProductRepository extends JpaRepository<DataProduct, String> {

    Optional<DataProduct> findByName(String name);

    List<DataProduct> findByDomainIdOrderByCreatedAtDesc(String domainId);

    List<DataProduct> findByQualityLevelOrderByCreatedAtDesc(String qualityLevel);

    @Query("SELECT d FROM DataProduct d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<DataProduct> search(@Param("q") String q);
}
