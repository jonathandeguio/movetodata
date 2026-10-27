package io.movetodata.catalog.library.repository;

import io.movetodata.catalog.library.models.ColumnMeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ColumnMetaRepository extends JpaRepository<ColumnMeta, String> {

    List<ColumnMeta> findByDatasetIdAndBranch(UUID datasetId, String branch);

    Optional<ColumnMeta> findByDatasetIdAndBranchAndColumnName(UUID datasetId, String branch, String columnName);
}
