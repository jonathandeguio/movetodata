package io.movetodata.kitab.library.repository;

import io.movetodata.kitab.library.enums.ResourceStatus;
import io.movetodata.kitab.library.enums.ResourceType;
import io.movetodata.kitab.library.models.ResourceModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<ResourceModel, UUID>, JpaSpecificationExecutor<ResourceModel> {
    Optional<ResourceModel> findByIdAndStatus(UUID id, ResourceStatus status);

    List<ResourceModel> findAllChildrenByParentAndStatus(UUID id, ResourceStatus resourceStatus);

    List<ResourceModel> findAllChildrenByParent(UUID id);

    List<ResourceModel> getByTypeAndStatus(ResourceType resourceType, ResourceStatus resourceStatus);

    List<ResourceModel> getByProjectAndStatus(UUID project, ResourceStatus resourceStatus);

    Page<ResourceModel> findAllByCreatedByAndStatusEquals(UUID createdBy, ResourceStatus resourceStatus, Pageable pageable);

    Page<ResourceModel> findAllByUpdatedByAndStatusEquals(UUID updatedBy, ResourceStatus resourceStatus, Pageable pageable);

    @Query(value = "SELECT * from kitab_resource e where to_tsvector( 'english',e.name || ' ' || coalesce(e.description,'')) @@ websearch_to_tsquery( 'english',:query)", nativeQuery = true)
    List<ResourceModel> getResourceFilterByQuery(@Param("query") String query);

    List<ResourceModel> findAllByTypeEquals(ResourceType resourceType);

    Page<ResourceModel> findAll(Specification<ResourceModel> spec, Pageable pageable);


    List<ResourceModel> getByType(ResourceType type);

    List<ResourceModel> getByParent(UUID parent);

    ResourceModel findByNameAndParentAndStatus(String name, UUID parentId, ResourceStatus status);

    boolean existsByIdAndStatus(UUID Id, ResourceStatus status);
    List<ResourceModel> findTop30ByCreatedByAndStatus(UUID createdBy, String status);
    List<ResourceModel> findTop30ByUpdatedByAndStatus(UUID updatedBy, String status);

    List<ResourceModel> findByNameEqualsAndTypeEquals(String name, ResourceType type);

    List<ResourceModel> findByNameEqualsAndTypeEqualsAndStatusNot(String name, ResourceType type, ResourceStatus status);
}
