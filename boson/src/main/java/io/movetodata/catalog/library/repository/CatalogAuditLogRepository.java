package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.CatalogAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogAuditLogRepository extends JpaRepository<CatalogAuditLog, String> {

    List<CatalogAuditLog> findByDataProductIdOrderByCreatedAtDesc(String dataProductId);
}
