package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogQualityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogQualityRuleRepository extends JpaRepository<CatalogQualityRule, String> {

    List<CatalogQualityRule> findByDataProductIdOrderByCreatedAtAsc(String dataProductId);

    void deleteByDataProductId(String dataProductId);
}
