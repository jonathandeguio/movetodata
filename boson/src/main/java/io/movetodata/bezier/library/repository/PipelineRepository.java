package io.movetodata.bezier.library.repository;

import io.movetodata.bezier.library.models.PipelineModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.transaction.Transactional;
import java.util.List;
import java.util.UUID;

@Repository
@Transactional
public interface PipelineRepository
        extends JpaRepository<PipelineModel, UUID> {
    List<PipelineModel> findAllBySourceDataset(UUID datasetId);

//    List<PipelineModel> findAllBySourceDatasetAndSourceBranch(UUID sourceId, String sourceBranch);

    List<PipelineModel.TargetDatasetAndTargetBranch> getAllTargetDatasetAndTargetBranchBySourceDatasetAndSourceBranch(UUID sourceId, String sourceBranch);

    List<PipelineModel> findAllByRepositoryIdAndRepositoryBranchAndScriptPathAndBuildIdNot(String repositoryId, String repositoryBranch, String scriptPath, String buildId);

    List<PipelineModel> findAllByRepositoryIdAndRepositoryBranchAndScriptPathAndSourceDatasetAndSourceBranchAndTargetDatasetAndTargetBranch(String repositoryId, String repositoryBranch, String scriptPath, UUID sourceDataset, String sourceBranch, UUID targetDataset, String targetBranch);

    List<PipelineModel.TargetDatasetAndTargetBranch> findAllBySourceDatasetAndSourceBranch(UUID sourceId, String sourceBranch);

    PipelineModel findBySourceDatasetAndSourceBranchAndTargetDatasetAndTargetBranch(UUID sourceId, String sourceBranch, UUID targetId, String targetBranch);
    
    void deleteByTargetDatasetAndTargetBranch(UUID targetDataset, String branch);

    PipelineModel findBySourceDatasetAndTargetDataset(UUID sourceDataset, UUID targetDataset);

    List<PipelineModel> findAllByTargetDataset(UUID targetDataset);
}