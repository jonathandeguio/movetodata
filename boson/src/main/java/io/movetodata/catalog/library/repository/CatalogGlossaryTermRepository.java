package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogGlossaryTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogGlossaryTermRepository extends JpaRepository<CatalogGlossaryTerm, String> {

    List<CatalogGlossaryTerm> findAllByOrderByTermAsc();

    List<CatalogGlossaryTerm> findByDomainOrderByTermAsc(String domain);

    Optional<CatalogGlossaryTerm> findByTermIgnoreCase(String term);
}
