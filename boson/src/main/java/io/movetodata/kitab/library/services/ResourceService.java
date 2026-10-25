package io.movetodata.kitab.library.services;

import io.movetodata.bezier.library.repository.PipelineRepository;
import io.movetodata.build.BobEnums.BuildTrigger;
import io.movetodata.build.library.models.BuildSpecification;
import io.movetodata.build.library.models.SocketMessage;
import io.movetodata.build.library.repository.BuildSpecificationsRepository;
import io.movetodata.dataset.library.Keys.DatasetMappingKey;
import io.movetodata.dataset.library.repository.DatasetMappingRepository;
import io.movetodata.dataset.library.repository.SchemaRepository;
import io.movetodata.kepler.library.models.ChartsModel;
import io.movetodata.kepler.library.models.DashboardsModel;
import io.movetodata.kepler.library.models.TabElementsModel;
import io.movetodata.kepler.library.models.TabsModel;
import io.movetodata.kepler.library.repository.ChartsRepository;
import io.movetodata.kepler.library.repository.DashboardsRepository;
import io.movetodata.kepler.library.repository.TabElementsRepository;
import io.movetodata.kepler.library.repository.TabsRepository;
import io.movetodata.kepler.library.specifications.ChartsSpecifications;
import io.movetodata.kitab.library.GlobalResourceSearchFilterDTO;
import io.movetodata.kitab.library.enums.ResourceStatus;
import io.movetodata.kitab.library.enums.ResourceSubtype;
import io.movetodata.kitab.library.enums.ResourceType;
import io.movetodata.kitab.library.enums.ViewAction;
import io.movetodata.kitab.library.models.*;
import io.movetodata.kitab.library.repository.*;
import io.movetodata.kitab.library.specifications.ResourceSpecification;
import io.movetodata.passport.exception.UnauthorizedException;
import io.movetodata.passport.library.models.Groups;
import io.movetodata.passport.library.models.PermissionsMapping;
import io.movetodata.passport.library.models.Role;
import io.movetodata.passport.library.models.User;
import io.movetodata.passport.library.repository.GroupsRepository;
import io.movetodata.passport.library.repository.PermissionMappingRepository;
import io.movetodata.passport.library.repository.RoleRepository;
import io.movetodata.passport.library.repository.UserRepository;
import io.movetodata.passport.library.service.AuthzService;
import io.movetodata.platform.library.services.PlatformConfigService;
import io.movetodata.scheduler.enums.JobStatus;
import io.movetodata.scheduler.library.models.SchedulerJobInfo;
import io.movetodata.scheduler.library.repository.SchedulerRepository;
import io.movetodata.sharedutils.ActiveDisplay;
import io.movetodata.sharedutils.DeletionInBackingFS;
import io.movetodata.sharedutils.Exceptions.ForbiddenException;
import io.movetodata.sharedutils.Utils;
import io.movetodata.sharedutils.models.PageSettings;
import io.movetodata.synchro.library.repository.PostgresSyncRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.quartz.JobKey;
import org.quartz.SchedulerException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static io.movetodata.passport.util.CommonUtils.ADMINSTRATOR_GROUPS;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ResourceService {
    private final DeletionInBackingFS deletionInBackingFS;
    private final SimpMessagingTemplate template;
    private final ResourceRepository resourceRepository;
    private final FavouritesRepository favouritesRepository;
    private final AuthzService authzService;
    private final ResourceViewsRepository resourceViewsRepository;
    private final BranchRepository branchRepository;
    private final BuildSpecificationsRepository buildSpecificationsRepository;
    private final ChartsRepository chartsRepository;
    private final SchemaRepository schemaRepository;
    private final TransactionRepository transactionRepository;
    private final PostgresSyncRepository postgresSyncRepository;
    private final SchedulerRepository schedulerRepository;
    private final DatasetRepository datasetRepository;
    private final DashboardsRepository dashboardsRepository;
    private final TabsRepository tabsRepository;
    private final PipelineRepository pipelineRepository;
    private final TabElementsRepository tabElementsRepository;
    private final DatasetMappingRepository datasetMappingRepository;
    private final ResourceViewsService resourceViewsService;
    private final DatasetMetaService datasetMetaService;
    private final PlatformConfigService platformConfigService;
    private final ActiveDisplay activeDisplay;
    private final SchedulerFactoryBean schedulerFactoryBean;
    private final PermissionMappingRepository permissionMappingRepository;
    private final GroupsRepository groupsRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public List<ResourceModel> getByType(ResourceType type) {
        return resourceRepository.getByType(type);
    }

    public List<ResourceModel> getByParent(UUID parent) {
        return resourceRepository.getByParent(parent);
    }

    public ResourceModel findByNameAndParentAndStatus(String name, UUID parentId, ResourceStatus status) {
        return resourceRepository.findByNameAndParentAndStatus(name, parentId, status);
    }

    public boolean existsByIdAndStatus(UUID Id, ResourceStatus status) {
        return resourceRepository.existsByIdAndStatus(Id, status);
    }

    public List<ResourceModel> findTop30ByCreatedByAndStatus(UUID createdBy, String status) {
        return resourceRepository.findTop30ByCreatedByAndStatus(createdBy, status);
    }

    public List<ResourceModel> findTop30ByUpdatedByAndStatus(UUID updatedBy, String status) {
        return resourceRepository.findTop30ByUpdatedByAndStatus(updatedBy, status);
    }

    public Optional<ResourceModel> findById(UUID id) {
        return resourceRepository.findById(id);
    }

    public Optional<ResourceModel> findActiveById(UUID id) {
        return resourceRepository.findByIdAndStatus(id, ResourceStatus.ACTIVE);
    }

    public void deleteById(UUID id) {
        resourceRepository.deleteById(id);
    }

    public boolean existsById(UUID id) {
        return resourceRepository.existsById(id);
    }

    public ResourceModel save(ResourceModel model) {
        return resourceRepository.save(model);
    }

    @Deprecated
    public List<ResourceModel> getPathById(UUID id, List<ResourceModel> path) {
        ResourceModel pathId = resourceRepository.getReferenceById(id);
        path.add(pathId);

        if (pathId.getParent() != null && !pathId.getParent().equals(new UUID(0, 0))) {
            getPathById(pathId.getParent(), path);
        }
        return path;
    }

    // PROJECTS SERVICE -----------------------------------------------------------------------------------------------
    public List<ResourceModel> getActiveProjects(UUID userId) {
        List<ResourceModel> activeProjects = filteredByRole("Viewer", resourceRepository.getByTypeAndStatus(ResourceType.PROJECT, ResourceStatus.ACTIVE), userId);
        for (ResourceModel model : activeProjects) {
            attachFavouriteStatus(model, userId);
        }
        return activeProjects;
    }

    public String handleSameNameUnderParentCondition(String name, UUID parentId) {
        List<ResourceModel> children = getByParent(parentId);
        children.removeIf(child -> child.getStatus().equals("inTrash"));

        if (children.stream().anyMatch(f ->
                (name.equals(f.getName()))
        )) {
            LocalDateTime now = LocalDateTime.now();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
            String timestamp = now.format(formatter);

            return name + " - " + timestamp;
        }
        return name;
    }

    /**
     * Creates a new resource:
     * - if user has permission
     * - if the parent exists
     * - if no such resource in this folder
     *
     * @param name        String
     * @param description String
     * @param type        ResourceType
     * @param subtype     ResourceSubType
     * @param userId      User id to check for the permissions
     * @param parent      UUID
     * @return ResourceModel Saved object
     * @throws NoSuchElementException        In case parent is invalid
     * @throws UnauthorizedException         In case user is not permitted to create files
     * @throws UnsupportedOperationException In case same name resource exists in this folder
     */
    public ResourceModel newResource(String name, String description, ResourceType type, ResourceSubtype subtype, UUID userId, UUID parent) throws NoSuchElementException, UnauthorizedException, UnsupportedOperationException {
        if (!authzService.isEditor(userId, parent))
            throw new UnauthorizedException("You are not authorized to do this action.");
        ResourceModel parentResource = resourceRepository.findByIdAndStatus(parent, ResourceStatus.ACTIVE).orElseThrow(() -> new NoSuchElementException("No such parent found"));
        name = handleSameNameUnderParentCondition(name, parent);
        if (hasSameNameChildren(parent, name))
            throw new UnsupportedOperationException("Same name resource exists in this folder");

        SocketMessage textMessage = new SocketMessage();
        textMessage.setMessage("REHYDRATE");
        template.convertAndSend("/project/" + (parentResource.getType() == ResourceType.PROJECT ? parent.toString() : parentResource.getProject().toString()), textMessage);

        ResourceModel resourceModel = resourceRepository.save(ResourceModel.builder()
                .name(name)
                .description(description)
                .parent(parent)
                .project(parentResource.getType() == ResourceType.PROJECT ? parent : parentResource.getProject())
                .type(type)
                .size(0)
                .subType(subtype)
                .status(ResourceStatus.ACTIVE)
                .createdBy(userId)
                .updatedAt(new Date())
                .updatedBy(userId).build());

        resourceViewsService.logView(resourceModel.getId(), ViewAction.CREATED, userId);

        return resourceModel;
    }

    public ResourceModel updateResource(UUID resourceId, String name, String description, User user, UUID parent) throws NoSuchElementException, UnsupportedOperationException, ForbiddenException {
        if (!authzService.isEditor(user.getId(), resourceId))
            throw new ForbiddenException("You are not authorized to do this action.");
        ResourceModel resource = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.ACTIVE).orElseThrow(() -> new NoSuchElementException("This resource does not exist."));

        if (Objects.nonNull(name)) {
            name = Utils.normalizeName(name);

            if (hasSameNameChildren(resource.getParent(), name))
                throw new UnsupportedOperationException("Same name resource exists in this folder");
            resource.setName(name);
        }
        if (Objects.nonNull(description)) {
            resource.setDescription(description);
        }

        if (Objects.nonNull(parent) && parent != resourceId) {
            if (resource.getType() == ResourceType.PROJECT)
                throw new UnsupportedOperationException("You can not change parent of a project");

            ResourceModel newParent = resourceRepository.findByIdAndStatus(parent, ResourceStatus.ACTIVE).orElseThrow(() -> new NoSuchElementException("This folder does not exist."));
            if (newParent.getType() != ResourceType.FOLDER && newParent.getType() != ResourceType.PROJECT)
                throw new InputMismatchException("Not a valid parent");

            if (hasSameNameChildren(parent, resource.getName()))
                throw new UnsupportedOperationException("Same name resource exists in this folder");

            resource.setParent(parent);
        }
        if (authzService.isViewer(user.getId(), resourceId)) {
            attachChildren(resource);
            attachFavouriteStatus(resource, user.getId());
        } else {
            throw new UnauthorizedException();
        }
        SocketMessage textMessage = new SocketMessage();
        textMessage.setMessage("REHYDRATE");
        template.convertAndSend("/project/" + (resource.getType() == ResourceType.PROJECT ? resource.toString() : resource.getProject().toString()), textMessage);

        resourceViewsService.logView(resourceId, ViewAction.VIEWED, user.getId());

        resource.setUpdatedAt(new Date());
        resource.setUpdatedBy(user.getId());

        return resourceRepository.save(resource);
    }

    public ResourceModel getProjectTree(UUID project, UUID userId) throws NoSuchElementException {
        List<AuthzService.PermissionDTO> permissionDTOS = authzService.getAncestorPermissions(project, userId);
        if (permissionDTOS.isEmpty()) return null;

        UUID id = permissionDTOS.get(permissionDTOS.size() - 1).getResource_id();
        Optional<ResourceModel> projectModel = resourceRepository.findByIdAndStatus(id, ResourceStatus.ACTIVE);

        if (projectModel.isPresent()) {
            attachChildren(projectModel.get());
            attachFavouriteStatus(projectModel.get(), userId);

            return projectModel.get();
        } else {
            throw new NoSuchElementException();
        }
    }

    // RESOURCE -------------------------------------------------------------------------------------------------------
    public ResourceModel getResourceModel(UUID resourceId) throws NoSuchElementException, UnauthorizedException {
        return resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.ACTIVE).orElseThrow();
    }

    public ResourceModel getResourceModelWithChildren(UUID resourceId, UUID userId) throws NoSuchElementException, UnauthorizedException {
        ResourceModel resourceModel = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.ACTIVE).orElseThrow();

        if (authzService.isViewer(userId, resourceId)) {
            attachChildren(resourceModel);
            attachFavouriteStatus(resourceModel, userId);
        } else {
            throw new UnauthorizedException();
        }

        return resourceModel;
    }

    // FILTERED RESOURCES ---------------------------------------------------------------------------------------------

    /**
     * Recently Viewed by specified userId and returns the {access type, resource}
     *
     * @param userId user in action
     * @return returns the recently objects
     */
    public List<ResourceModel> getRecentlyViewed(UUID userId) {
        List<ResourceViewsModel> resourceViewsModel = resourceViewsRepository.findFirst10DistinctByViewedByOrderByViewedAtDesc(userId);

        Set<UUID> uniqueResource = new HashSet<>();
        List<ResourceModel> folderModels = new ArrayList<>();

        for (ResourceViewsModel resourceView : resourceViewsModel) {
            if (!uniqueResource.contains(resourceView.getResourceId())) {
                Optional<ResourceModel> resource = resourceRepository.findByIdAndStatus(resourceView.getResourceId(), ResourceStatus.ACTIVE);
                if (resource.isPresent()) {
                    if (resource.get().getType() != ResourceType.FOLDER) {
                        folderModels.add(resource.get());
                    }
                    uniqueResource.add(resourceView.getResourceId());
                }
            }
        }
        return folderModels;
    }

    // TODO: DO WE NEED TO CHECK THE PERMISSION BEFORE THIS
    public Page<ResourceModel> getCreatedByYou(@NonNull PageSettings pageSettings, UUID userId) {
        Sort createdByYouSort = pageSettings.buildSort();
        Pageable createdByYouPage = PageRequest.of(pageSettings.getPage(), pageSettings.getElementPerPage(), createdByYouSort);
        Page<ResourceModel> createdByYou = resourceRepository.
                findAllByCreatedByAndStatusEquals(userId, ResourceStatus.ACTIVE, createdByYouPage);
        attachFavouriteStatus(createdByYou, userId);
        return createdByYou;
    }

    public Page<ResourceModel> getUpdatedByYou(@NonNull PageSettings pageSettings, UUID userId) {
        Sort updatedByYouSort = pageSettings.buildSort();
        Pageable updatedByYouPage = PageRequest.of(pageSettings.getPage(), pageSettings.getElementPerPage(), updatedByYouSort);
        Page<ResourceModel> updatedByYou = resourceRepository.
                findAllByUpdatedByAndStatusEquals(userId, ResourceStatus.ACTIVE, updatedByYouPage);
        attachFavouriteStatus(updatedByYou, userId);
        return updatedByYou;
    }

    // TRASH SERVICE --------------------------------------------------------------------------------------------------
    public List<ResourceModel> getInTrash(UUID projectId, UUID userId) {
        List<ResourceModel> inTrash = resourceRepository.getByProjectAndStatus(projectId, ResourceStatus.IN_TRASH);
        List<ResourceModel> inTrashFiltered = filteredByRole("Viewer", inTrash, userId);

        for (ResourceModel model : inTrashFiltered) {
            attachFavouriteStatus(model, userId);
        }

        return inTrashFiltered;
    }

    @Transactional
    public ResourceModel addToTrash(UUID resourceId) throws SchedulerException {
        Optional<ResourceModel> inTrash = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.ACTIVE);

        if (inTrash.isPresent() && inTrash.get().getStatus() == ResourceStatus.ACTIVE) {
            inTrash.get().setStatus(ResourceStatus.IN_TRASH);
            handleResourceCasesWhenAddedToTrash(inTrash.get(), resourceId);
            return resourceRepository.save(inTrash.get());
        }
        return null;
    }

    @Transactional
    public ResourceModel removeFromTrash(UUID resourceId) throws SchedulerException {
        Optional<ResourceModel> inTrash = resourceRepository.findByIdAndStatus(resourceId, ResourceStatus.IN_TRASH);

        if (inTrash.isPresent() && inTrash.get().getStatus() == ResourceStatus.IN_TRASH) {
            inTrash.get().setStatus(ResourceStatus.ACTIVE);
            handleResourceCasesWhenRemovedFromTrash(inTrash.get(), resourceId);
            resourceRepository.save(inTrash.get());
            return inTrash.get();
        }
        return null;
    }

    public void permanentDelete(UUID resourceId, UUID userId) throws Exception {
        ResourceModel resource = findById(resourceId).orElseThrow();

        if (resource.getType().equals(ResourceType.PROJECT)) {
            List<ResourceModel> inTrash = resourceRepository.getByProjectAndStatus(resourceId, ResourceStatus.IN_TRASH);

            for (ResourceModel resourceModel : inTrash) {
                permanentDeleteRecursive(resourceModel);
            }
        } else {
            permanentDeleteRecursive(resource);
        }

        resourceViewsService.logView(resourceId, ViewAction.DELETED, userId);
    }

    @Transactional
    public void handleResourceCasesWhenAddedToTrash(ResourceModel resourceModel, UUID userId) throws SchedulerException {
        switch (resourceModel.getType()) {
            case DATASET:
                List<BranchModel> branchModels = branchRepository.findAllBranchModelByDatasetId(resourceModel.getId());
                for (BranchModel branch : branchModels) {
                    List<SchedulerJobInfo> jobs = schedulerRepository.findAllByResourceIdAndBranch(resourceModel.getId(), branch.getBranch());
                    for (SchedulerJobInfo job : jobs) {
                        if (job != null) {
                            job.setResourceStatus(ResourceStatus.IN_TRASH);
                            schedulerRepository.save(job);
                            schedulerFactoryBean.getScheduler().pauseJob(new JobKey(String.valueOf(job.getJobId())));
                        }
                    }
                }

                break;
            case LINK:
                SchedulerJobInfo job = schedulerRepository.findByResourceIdAndBranchAndResourceType(resourceModel.getId(), "master", ResourceType.CONNECT);
                if (job != null) {
                    job.setResourceStatus(ResourceStatus.IN_TRASH);
                    schedulerRepository.save(job);

                    schedulerFactoryBean.getScheduler().pauseJob(new JobKey(String.valueOf(job.getJobId())));
                }

                break;
            case DASHBOARD:
                break;
            default:
        }
    }

    @Transactional
    public void handleResourceCasesWhenRemovedFromTrash(ResourceModel resourceModel, UUID userId) throws SchedulerException {
        switch (resourceModel.getType()) {
            case DATASET:
                List<BranchModel> branchModels = branchRepository.findAllBranchModelByDatasetId(resourceModel.getId());
                for (BranchModel branch : branchModels) {
                    List<SchedulerJobInfo> jobs = schedulerRepository.findAllByResourceIdAndBranch(resourceModel.getId(), branch.getBranch());
                    for (SchedulerJobInfo job : jobs) {
                        if (job != null) {
                            job.setResourceStatus(ResourceStatus.ACTIVE);
                            schedulerRepository.save(job);

                            if (job.getJobStatus().equals(JobStatus.RUNNING)) {
                                schedulerFactoryBean.getScheduler().resumeJob(new JobKey(String.valueOf(job.getJobId())));
                            } else {
                                // it's by default paused
                            }
                        }
                    }

                }
                break;

            case LINK:
                SchedulerJobInfo job = schedulerRepository.findByResourceIdAndBranchAndResourceType(resourceModel.getId(), "master", ResourceType.CONNECT);
                if (job != null) {
                    job.setResourceStatus(ResourceStatus.ACTIVE);
                    schedulerRepository.save(job);

                    if (job.getJobStatus().equals(JobStatus.RUNNING)) {
                        schedulerFactoryBean.getScheduler().resumeJob(new JobKey(String.valueOf(job.getJobId())));
                    } else {
                        // it's by default paused
                    }
                }

                break;
            case DASHBOARD:
                break;
            default:
        }
    }

    @Transactional
    public void permanentDeleteRecursive(ResourceModel resourceModel) throws Exception {
        UUID id = resourceModel.getId();
        try {
            ResourceType type = resourceModel.getType();
            resourceRepository.delete(resourceModel);
            resourceViewsRepository.deleteAllInBatch(resourceViewsRepository.findAllByResourceId(id));
            switch (type) {
                case DATASET:
                    // TODO: bezier pipeline

                    List<BranchModel> branchModels = branchRepository.findAllBranchModelByDatasetId(id);
                    for (BranchModel branch : branchModels) {
                        // deleting build specifications
                        List<BuildSpecification> datasetBuilds = buildSpecificationsRepository.findAllByDatasetIdAndBranch(id, branch.getBranch());
                        buildSpecificationsRepository.deleteAll(datasetBuilds);

                        // deleting charts associated with that dataset
                        List<ChartsModel> datasetCharts = chartsRepository.findAllByDatasetIdAndBranch(id, branch.getBranch());
                        for (ChartsModel charts : datasetCharts) {
                            permanentDeleteRecursive(resourceRepository.getById(charts.getId()));
                        }

                        // deleting schemas
                        schemaRepository.deleteAll(schemaRepository.findByDatasetIdAndBranch(id, branch.getBranch()));

                        // deleting transactions
                        transactionRepository.delete(transactionRepository.findTransactionModelByDatasetIdAndBranch(id, branch.getBranch()));

                        // deleting postgres synchro
                        postgresSyncRepository.deleteAll(postgresSyncRepository.findAllByDatasetIdAndBranch(id, branch.getBranch()));

                        // deleting schedules
                        schedulerRepository.delete(schedulerRepository.findByResourceIdAndBranchAndResourceType(id, branch.getBranch(), ResourceType.DATASET));

                        // deleting files from cloud
                        deletionInBackingFS.deleteDatasetFiles("dataset", id, branch.getBranch());

                        // after successful deletion of transactions deleting dataset Mapping
                        datasetMappingRepository.deleteById(new DatasetMappingKey(id, branch.getBranch()));
                    }
                    branchRepository.deleteAll(branchModels);

                    // deleting build log reference to dataset :below needs changing,its not a correct way
//                List <BuildLog> buildLogs = buildLogRepository.findAllByDatasetId(id);
//                for (BuildLog buildLog : buildLogs) {
//
//                    BuildStageLog buildStageLog = buildStageLogRepository.findByBuildIdAndDatasetId(buildLog.getId(), id);
//
//                    buildStageLogRepository.setDatasetId(null);
//                    buildLogRepository.save(buildLog);
//                }

                    datasetRepository.delete(datasetRepository.findDatasetModelById(id));
                    return;
                case REPOSITORY:
                    return;
                case DASHBOARD:
                    List<DashboardsModel> dashboards = dashboardsRepository.findById(id);
                    for (DashboardsModel dashboardModel : dashboards) {
                        // Remove Chart and dash linkage
                        Set<ChartsModel> dashboardChartsModel = dashboardModel.getCharts();
                        for (ChartsModel chart : dashboardChartsModel) {
                            chart.getDashboard().remove(dashboardModel);
                            chartsRepository.save(chart);
                        }
                        dashboardModel.setCharts(null);
                        dashboardsRepository.save(dashboardModel);

                        List<TabsModel> tabs = dashboardModel.getTabs();
                        for (TabsModel tab : tabs) {
                            // Remove Tab Elements
//                    List<TabElementsModel> tabElements = tab.getTabElements();
//                    for (TabElementsModel tabElement : tabElements) {
//                        tabElementsRepository.delete(tabElement);
//                    }
//                    tab.setTabElements(null);

                            // Remove Tab Charts
                            Set<ChartsModel> tabCharts = tab.getChartsForTabs();
                            for (ChartsModel tabChart : tabCharts) {
                                tabChart.getTabsForCharts().remove(tab);
                                chartsRepository.save(tabChart);
                            }
                            tab.setChartsForTabs(null);

                            tabsRepository.save(tab);
//                    tabsRepository.delete(tab);
                        }

                        dashboardModel.setTabs(null);
                        dashboardsRepository.save(dashboardModel);
                        pipelineRepository.deleteByTargetDatasetAndTargetBranch(dashboardModel.getId(), dashboardModel.getBranch());
                        dashboardsRepository.delete(dashboardModel);
                    }
                    break;

                case CHART:
                    List<ChartsModel> charts = chartsRepository.findById(id);
                    for (ChartsModel chartsModel : charts) {

                        // Remove dashboard and chart linkage
                        Set<DashboardsModel> dashboardsModel = chartsModel.getDashboard();
                        for (DashboardsModel dashboard : dashboardsModel) {
                            dashboard.getCharts().remove(chartsModel);
                            dashboardsRepository.save(dashboard);
                        }
                        chartsModel.setDashboard(null);
                        chartsRepository.save(chartsModel);

                        Set<TabsModel> tabsModel = chartsModel.getTabsForCharts();
                        for (TabsModel tab : tabsModel) {
                            tab.getChartsForTabs().remove(chartsModel);
                            // Remove chart and tabelement linkage
                            List<TabElementsModel> elements = tab.getTabElements();
                            List<TabElementsModel> elementsWithoutParticularChart = new ArrayList<>();
                            for (TabElementsModel element : elements) {
                                if (element.getData().equals(id.toString())) {
                                    tabElementsRepository.delete(element);
                                    continue;
                                }
                                elementsWithoutParticularChart.add(element);
                            }
                            tabsRepository.save(tab);
                        }
                        chartsModel.setTabsForCharts(null);
                        chartsRepository.save(chartsModel);

                        pipelineRepository.deleteByTargetDatasetAndTargetBranch(chartsModel.getId(), chartsModel.getBranch());
                        chartsRepository.delete(chartsModel);

                        // TODO : Delete charts from kepler_dashboards
//                chartsRepository.deleteById(id);
//                List <DashboardsModel> dashboards = dashboardsRepository.findAll();
//                for (DashboardsModel dashboard : dashboards) {
//                    Collection<HashMap<String, Object >> charts = dashboard.getCharts();
//                    for (HashMap<String,Object> h : charts)
//
//                }
                    }
                    break;
            }

            List<ResourceModel> children = resourceRepository.findAllChildrenByParent(resourceModel.getParent());

            for (ResourceModel child : children) {
                permanentDeleteRecursive(child);
            }

        } catch (Exception ignored) {
        }
    }

    // FAVOURITES SERVICE ---------------------------------------------------------------------------------------------
    public List<ResourceModel> getFavourites(UUID userId) {
        List<Favourites> favouritesList = favouritesRepository.findAllDistinctByUserIdOrderByCreatedAtDesc(userId);
        List<ResourceModel> favouriteResources = new ArrayList<>();

        Set<UUID> favouriteAncestors = new HashSet<>();

        for (Favourites favourite : favouritesList) {
            if (!favouriteAncestors.contains(favourite.getResourceId())) {
                Set<UUID> ancestors = authzService.ancestorsByRole("Viewer", userId, favourite.getResourceId());
                if (!ancestors.isEmpty()) {
                    Optional<ResourceModel> resource = resourceRepository.findByIdAndStatus(favourite.getResourceId(), ResourceStatus.ACTIVE);
                    resource.ifPresent(favouriteResources::add);
                }
                favouriteAncestors.addAll(ancestors);
            } else {
                Optional<ResourceModel> resource = resourceRepository.findByIdAndStatus(favourite.getResourceId(), ResourceStatus.ACTIVE);
                resource.ifPresent(favouriteResources::add);
            }
        }
        return favouriteResources;
    }

    // SERVICE UTILITY FUNCTIONS --------------------------------------------------------------------------------------
    private void attachChildren(ResourceModel model) {
        List<ResourceModel> children = resourceRepository.findAllChildrenByParentAndStatus(model.getId(), ResourceStatus.ACTIVE);

        if (!children.isEmpty()) {
            model.setSize(children.size());
        }
        for (ResourceModel child : children) {
            model.getChildren().add(child);

            attachChildren(child);
        }
    }

    private void attachFavouriteStatus(Iterable<ResourceModel> models, UUID userId) {
        for (ResourceModel model : models) {
            attachFavouriteStatus(model, userId);
        }
    }

    private void attachFavouriteStatus(ResourceModel model, UUID userId) {
        model.setFavourite(favouritesRepository.existsByUserIdAndResourceId(userId, model.getId()));

        if (Objects.nonNull(model.getChildren())) {
            for (ResourceModel child : model.getChildren()) {
                attachFavouriteStatus(child, userId);
            }
        }
    }

    private List<ResourceModel> filteredByRole(String role, List<ResourceModel> resources, UUID userId) {
        Set<UUID> permittedModels = new HashSet<>();
        List<ResourceModel> filtered = new ArrayList<>();

        for (ResourceModel resource : resources) {
            if (!permittedModels.contains(resource.getId())) {
                Set<UUID> permitted = authzService.ancestorsByRole(role, userId, resource.getId());
                if (!permitted.isEmpty()) {
                    filtered.add(resource);
                }
                permittedModels.addAll(permitted);
            } else {
                filtered.add(resource);
            }
        }

        return filtered;
    }

    private boolean hasSameNameChildren(UUID parent, String name) {
        List<ResourceModel> children = resourceRepository.findAllChildrenByParentAndStatus(parent, ResourceStatus.ACTIVE);
        Optional<ResourceModel> sameNameChildren = children.stream().filter(resourceModel -> resourceModel.getName().equals(name)).findAny();

        return sameNameChildren.isPresent();
    }

    public List<ResourceModel> getActiveResources(UUID userId, ResourceType resourceType) {
        List<ResourceModel> resources = filteredByRole("Viewer", resourceRepository.getByTypeAndStatus(resourceType, ResourceStatus.ACTIVE), userId);

        return resources;
    }

    public ResourceModel createDataset(String name, String description, UUID userId, UUID parent, ResourceSubtype subType) {
        ResourceModel newResource = newResource(name, description, ResourceType.DATASET, subType, userId, parent);

        DatasetModel dataset = new DatasetModel();
        dataset.setId(newResource.getId());
        dataset.setDsID(newResource.getId());

        datasetRepository.save(dataset);

        return newResource;
    }

    public void updateDatasetOnPostTransform(UUID datasetId, String branch, ResourceSubtype subtype, UUID userId, UUID buildId, BuildTrigger buildTrigger, UUID transactionId) throws Exception {
        String defaultBranch = platformConfigService.getPlatformConfig().getDefaultBranch();
        Optional<ResourceModel> resourceModelOptional = findById(datasetId);
        if (resourceModelOptional.isPresent()) {
            ResourceModel resourceModel = resourceModelOptional.get();
            resourceModel.setUpdatedBy(userId);
            resourceModel.setSubType(subtype);
            resourceModel.setUpdatedAt(new Date());

            save(resourceModel);
        }

        datasetMetaService.putMetaData(datasetId, buildId, buildTrigger, transactionId);
        if (branch.equals(defaultBranch)) {
            datasetMetaService.setDefaultBranchPresent(datasetId);
        } else {
            datasetMetaService.setShowBranchSelector(datasetId);
        }
    }

    public List<ResourceModel> searchProject(String searchText) {
        List<ResourceModel> resources = resourceRepository.getResourceFilterByQuery(searchText);
        return resources.stream().filter((resource) ->
                resource.getType().equals(ResourceType.PROJECT) &&
                        resource.getStatus().equals(ResourceStatus.ACTIVE)).collect(Collectors.toList());

    }

    public Page<ProjectDTO> getProjectPage(@NonNull PageSettings pageSetting, ResourceFilters filterCriteria, UUID userId) {
        Sort projectSort = pageSetting.buildSort();
        Pageable resourcePage = PageRequest.of(pageSetting.getPage(), pageSetting.getElementPerPage(), projectSort);

        Specification<ResourceModel> spec = Specification.where(null);

        // Add conditions based on the filter criteria
        // DEV - Will be required to add more filters.
        if (filterCriteria.getSearchText() != null && !filterCriteria.getSearchText().isEmpty()) {
            spec = spec.and(ResourceSpecification.partialSearchOnName(filterCriteria.getSearchText()));
        }

        // Only getting active Projects.
        spec = spec.and(ResourceSpecification.hasStatus(List.of(ResourceStatus.ACTIVE)));

        //Only get Projects
        spec = spec.and(ResourceSpecification.hasTypes(List.of(ResourceType.PROJECT)));

        // Fetch resources with the applied specification
        List<ResourceModel> allResources = resourceRepository.findAll(spec);

        //
        List<ResourceModel> accessibleResources = allResources;

        // Filter out resources the user does not have access to
        if (filterCriteria.getPermissions() != null) {
            accessibleResources = allResources.stream()
                    .filter(project -> {
                        boolean hasResourceAccess = activeDisplay.hasResourceAccess(userId, project);
                        if (filterCriteria.getPermissions().isEmpty() && !hasResourceAccess)
                            return true;

                        if (authzService.isPlatformAdmin(userId) || authzService.isProjectAdmin(userId))
                            return true;

                        return filterCriteria.getPermissions().stream().anyMatch((permission) -> {
                            List<Role> roles = roleRepository.getByName(permission.getDisplayName());
                            if (roles == null || roles.isEmpty()) {
                                throw new NoSuchElementException("No role found with the provided name.");
                            }
                            UUID roleId = roles.get(0).getId();
                            return permissionMappingRepository.existsByIdentityIdAndResourceIdAndRoleId(userId, project.getId(), roleId);
                        });
                    })
                    .collect(Collectors.toList());
        }

        // Sort accessible resources according to the Pageable's Sort criteria
        sortListBySortObject(accessibleResources, resourcePage.getSort());

        // Apply pagination on the filtered resources
        int start = Math.min((int) resourcePage.getOffset(), accessibleResources.size());
        int end = Math.min((start + pageSetting.getElementPerPage()), accessibleResources.size());
        List<ResourceModel> paginatedResources = accessibleResources.subList(start, end);

        List<ProjectDTO> paginatedProjectsDTO = paginatedResources.stream().map((project) -> {
            ProjectDTO projectDTO = new ProjectDTO();
            projectDTO.copyNonNullProperties(project);
            projectDTO.setHasAccess(activeDisplay.hasResourceAccess(userId, project));
            projectDTO.setTeam(getProjectTeamMembers(project.getId()));
            return projectDTO;
        }).collect(Collectors.toList());

        return new PageImpl<>(paginatedProjectsDTO, resourcePage, paginatedProjectsDTO.size());
    }

    public Boolean doesResourceWithSameExist(String name, ResourceType type) {
        return !resourceRepository
                .findByNameEqualsAndTypeEqualsAndStatusNot(name, type, ResourceStatus.IN_TRASH)
                .isEmpty();
    }

    public List<UUID> getProjectTeamMembers(UUID resourceId) {
        Set<UUID> teamMembers = new HashSet<>();
        List<PermissionsMapping> permissionsMappings = permissionMappingRepository.findByResourceId(resourceId);
        for (PermissionsMapping permissionMapping : permissionsMappings) {
            Groups group = groupsRepository.findById(permissionMapping.getIdentityId()).stream().findFirst().orElse(null);
            if (group == null) {
                teamMembers.add(permissionMapping.getIdentityId());
            } else {
                if (ADMINSTRATOR_GROUPS.contains(group.getName()))
                    continue;
                teamMembers.addAll(group.getMembers().stream().map(User::getId).collect(Collectors.toList()));
            }
        }
        return new ArrayList<>(teamMembers);
    }

    // Method to sort a list using a Sort object
    private void sortListBySortObject(List<ResourceModel> list, Sort sort) {
        // Create a comparator based on the sort object
        Comparator<ResourceModel> comparator = (r1, r2) -> 0; // default comparator

        for (Sort.Order order : sort) {
            String property = order.getProperty();
            Comparator<ResourceModel> propertyComparator;

            switch (property) {
                case "name":
                    propertyComparator = Comparator.comparing(ResourceModel::getName, order.isAscending() ? Comparator.naturalOrder() : Comparator.reverseOrder());
                    break;
                case "createdAt":
                    propertyComparator = Comparator.comparing(ResourceModel::getCreatedAt, order.isAscending() ? Comparator.naturalOrder() : Comparator.reverseOrder());
                    break;
                // Add more cases for other properties if needed
                default:
                    propertyComparator = Comparator.comparing(ResourceModel::getId); // Default comparator
            }

            comparator = comparator.thenComparing(propertyComparator);
        }

        // Sort the list in place
        list.sort(comparator);
    }

    public Page<ResourceModel> getAllResourceByFilters(@NonNull PageSettings pageSettings, GlobalResourceSearchFilterDTO globalSearchFilters) {
        Sort resourceSort = pageSettings.buildSort();
        Pageable pageable = PageRequest.of(pageSettings.getPage(), pageSettings.getElementPerPage(), resourceSort);

        List<UUID> resourceIds = extractValidUUIDs(globalSearchFilters.getSearchText());
        boolean hasValidUUID = !resourceIds.isEmpty();

        Specification<ResourceModel> spec = Specification.where(null);

        if (globalSearchFilters.getSearchText() != null && !globalSearchFilters.getSearchText().isEmpty()) {
            spec = spec.and(ResourceSpecification.partialSearchOnName(globalSearchFilters.getSearchText()));

            if (globalSearchFilters.getResourceType() == null || globalSearchFilters.getResourceType().isEmpty()) {
                List<ResourceType> limitedResourceTypes = List.of(
                        ResourceType.CHART, ResourceType.REPOSITORY, ResourceType.DASHBOARD,
                        ResourceType.DATASET, ResourceType.LINK, ResourceType.SOURCE, ResourceType.AGENT
                );
                spec = spec.and(ResourceSpecification.hasTypes(limitedResourceTypes));
            } else {
                spec = spec.and(ResourceSpecification.hasTypes(globalSearchFilters.getResourceType()));
            }
        }

        if (hasValidUUID) {
            spec = spec.and(ResourceSpecification.hasSameUUID(resourceIds));
        }

        spec = applyFilters(globalSearchFilters, spec);

        try {
            return resourceRepository.findAll(spec, pageable);
        } catch (Exception e) {
            log.error("Error occurred while querying resources: {}", e.getMessage(), e);
            return Page.empty(pageable);
        }
    }

    private List<UUID> extractValidUUIDs(String searchText) {
        if (searchText == null || searchText.isEmpty() || searchText.length() < 36) {
            return Collections.emptyList();
        }
        return Arrays.stream(searchText.trim().split("\\s+"))
                .filter(Utils::isValidUuid)
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }

    private Specification<ResourceModel> applyFilters(GlobalResourceSearchFilterDTO filters, Specification<ResourceModel> spec) {
        if (filters.getResourceStatus() != null) {
            spec = spec.and(ResourceSpecification.hasStatus(filters.getResourceStatus()));
        }
        spec = applyDateFilters(filters, spec);
        if (filters.getCreatedBy() != null && !filters.getCreatedBy().isEmpty()) {
            spec = spec.and(ResourceSpecification.createdBy(filters.getCreatedBy()));
        }
        return spec;
    }

    private Specification<ResourceModel> applyDateFilters(@NotNull GlobalResourceSearchFilterDTO filters, Specification<ResourceModel> spec) {
        if (filters.getCreatedAtFrom() != null) {
            spec = spec.and(ResourceSpecification.isCreatedFrom(filters.getCreatedAtFrom()));
        }
        if (filters.getCreatedAtTo() != null) {
            spec = spec.and(ResourceSpecification.isCreatedTo(filters.getCreatedAtTo()));
        }
        if (filters.getUpdatedAtFrom() != null) {
            spec = spec.and(ResourceSpecification.isUpdatedFrom(filters.getUpdatedAtFrom()));
        }
        if (filters.getUpdatedAtTo() != null) {
            spec = spec.and(ResourceSpecification.isUpdatedTo(filters.getUpdatedAtTo()));
        }
        return spec;
    }

}
