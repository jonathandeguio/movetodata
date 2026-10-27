package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CertificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificationHistoryRepository extends JpaRepository<CertificationHistory, String> {

    List<CertificationHistory> findByDataProductIdOrderByCertifiedAtDesc(String dataProductId);
}
