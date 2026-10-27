package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DomainRepository extends JpaRepository<Domain, String> {

    Optional<Domain> findByName(String name);
}
