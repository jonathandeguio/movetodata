package io.movetodata.kitab.controllers;

import com.google.gson.Gson;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import io.movetodata.bezier.library.repository.PipelineRepository;
import io.movetodata.build.library.models.BuildSpecification;
import io.movetodata.build.library.repository.BuildLogRepository;
import io.movetodata.build.library.repository.BuildSpecificationsRepository;
import io.movetodata.build.library.services.KitabService;
import io.movetodata.dataset.library.Keys.DatasetMappingKey;
import io.movetodata.dataset.library.repository.DatasetMappingRepository;
import io.movetodata.dataset.library.repository.SchemaRepository;
import io.movetodata.docket.library.models.Tags;
import io.movetodata.docket.library.models.TagsCategory;
import io.movetodata.docket.library.repository.TagCategoryRepository;
import io.movetodata.docket.library.repository.TagRepository;
import io.movetodata.kepler.library.models.ChartsModel;
import io.movetodata.kepler.library.models.DashboardsModel;
import io.movetodata.kepler.library.models.TabElementsModel;
import io.movetodata.kepler.library.models.TabsModel;
import io.movetodata.kepler.library.repository.ChartsRepository;
import io.movetodata.kepler.library.repository.DashboardsRepository;
import io.movetodata.kepler.library.repository.TabElementsRepository;
import io.movetodata.kepler.library.repository.TabsRepository;
import io.movetodata.kitab.library.GlobalResourceSearchFilterDTO;
import io.movetodata.kitab.library.enums.ResourceStatus;
import io.movetodata.kitab.library.enums.ResourceSubtype;
import io.movetodata.kitab.library.enums.ResourceType;
import io.movetodata.kitab.library.models.*;
import io.movetodata.kitab.library.repository.*;
import io.movetodata.kitab.library.requests.NewProjectRequest;
import io.movetodata.kitab.library.services.ResourceService;
import io.movetodata.passport.enums.AuthProvider;
import io.movetodata.passport.exception.BadRequestException;
import io.movetodata.passport.exception.UnauthorizedException;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.library.models.*;
import io.movetodata.passport.library.repository.GroupsRepository;
import io.movetodata.passport.library.repository.PermissionMappingRepository;
import io.movetodata.passport.library.repository.RoleRepository;
import io.movetodata.passport.library.repository.UserRepository;
import io.movetodata.passport.library.service.AuthzService;
import io.movetodata.passport.library.service.GroupService;
import io.movetodata.passport.library.service.UserService;
import io.movetodata.passport.security.AuthUser;
import io.movetodata.passport.util.AuthUtils;
import io.movetodata.platform.library.services.PlatformConfigService;
import io.movetodata.scheduler.library.repository.SchedulerRepository;
import io.movetodata.sharedutils.ActiveDisplay;
import io.movetodata.sharedutils.BackFsFileUtils;
import io.movetodata.sharedutils.DTO.PageToPageDTOMapper;
import io.movetodata.sharedutils.DeletionInBackingFS;
import io.movetodata.sharedutils.Response.ErrorDTO;
import io.movetodata.sharedutils.Utils;
import io.movetodata.sharedutils.models.PageSettings;
import io.movetodata.synchro.library.repository.PostgresSyncRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import javassist.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.codec.binary.Base64;
import org.hibernate.Hibernate;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;
import java.util.*;

import static io.movetodata.passport.enums.PlatformUsers.PlatformInternal;
import static io.movetodata.sharedutils.Utils.isValidUuid;
import static io.movetodata.sharedutils.language.labels.getLabel;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/kitab")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Kitab", description = "This is a catalog management service.")
public class kitabController {
    public final PostgresSyncRepository postgresSyncRepository;
    public final SchedulerRepository schedulerRepository;
    public final BuildLogRepository buildLogRepository;
    public final TagCategoryRepository tagCategoryRepository;
    public final TagRepository tagRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final ResourceService resourceService;
    private final GroupsRepository groupsRepository;
    private final PipelineRepository pipelineRepository;
    private final DashboardsRepository dashboardsRepository;
    private final ResourceViewsRepository resourceViewsRepository;
    private final FavouritesRepository favouritesRepository;
    private final DatasetRepository datasetRepository;
    private final BranchRepository branchRepository;
    private final AuthzService authzService;
    private final ActiveDisplay activeDisplay;
    private final PermissionMappingRepository permissionMappingRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ChartsRepository chartsRepository;
    private final BuildSpecificationsRepository buildSpecificationsRepository;
    private final SchemaRepository schemaRepository;
    private final TransactionRepository transactionRepository;
    private final TabsRepository tabsRepository;
    private final TabElementsRepository tabElementsRepository;
    private final ResourceRepository resourceRepository;
    private final DatasetMappingRepository datasetMappingRepository;
    private final DeletionInBackingFS deletionInBackingFS;
    private final KitabService kitabService;
    private final BackFsFileUtils backFsFileUtils;
    private final PlatformConfigService platformConfigService;
    private final PageToPageDTOMapper pageToPageDTOMapper;


    @Operation(summary = "It provides list of all kitab.")
    @PostMapping("/rawFileUpdate/{id}")
    public ResponseEntity<Object> updateTxtFile(Principal principal, @PathVariable(name = "id") UUID id, @RequestBody String file) throws Exception {

        backFsFileUtils.updateFile(Base64.decodeBase64(file.getBytes()), "file", id, "file", "overwrite");

        Map<String, String> mp = new HashMap<>();
        mp.put("message", "Updated Successfully");
        return ResponseEntity.ok().body(mp);
    }

    @Operation(summary = "It provides list of all kitab.")
    @PostMapping("/projects/paginated/all")
    public ResponseEntity<Object> getPaginatedProjectsList(@AuthenticationPrincipal AuthUser authUser,
                                                           PageSettings pageSettings,
                                                           @RequestBody ResourceFilters resourceFilters) {
        log.info("Request for project page received with data : ", pageSettings);
        return ResponseEntity.ok().body(pageToPageDTOMapper.pageToPageDTO(
                resourceService.getProjectPage(pageSettings, resourceFilters, authUser.getId())));
    }


    @Operation(summary = "It provides list of all projects")
    @GetMapping("/project/all")
    public ResponseEntity<Object> getProjects(Principal principal) {

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with userId : ")
                );

        List<ResourceModel> allProjects = resourceService.getByType(ResourceType.PROJECT);

        List<ResourceModel> activeProjects = activeDisplay.statusDisplay(user.getId(), allProjects, ResourceStatus.ACTIVE);  // note authz is checked in activeDisplay

        return ResponseEntity.ok().body(activeProjects);
    }

    // TODO: Separate projects update and create
    @Operation(summary = "This endpoint can be used to create / update projects")
    @PostMapping("/project/create")
    @PreAuthorize(Auth.PROJECT_ADMIN)
    public ResponseEntity<?> newProject(@AuthenticationPrincipal AuthUser authUser,
                                        @RequestBody NewProjectRequest newProjectRequest) {

        UUID userId = authUser.getId();
        String name = Utils.normalizeName(newProjectRequest.getName());

        if (resourceService.doesResourceWithSameExist(name, ResourceType.PROJECT))
            return ResponseEntity
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .body(new ErrorDTO(HttpStatus.NOT_ACCEPTABLE.value(),
                            "Same name resource already exist", "Choose a unique project name"));

        ResourceModel newProject = ResourceModel.builder()
                .name(name)
                .description(newProjectRequest.getDescription())
                .size(0)
                .parent(null)
                .project(null)
                .type(ResourceType.PROJECT)
                .subType((ResourceSubtype.NONE))
                .createdBy(userId)
                .createdAt(new Date())
                .updatedBy(userId)
                .updatedAt(new Date())
                .build();

        ResourceModel project = resourceService.save(newProject);

        if (newProjectRequest.isFolders()) {
            String lang = newProjectRequest.getUserLanguage();

            resourceService.save(ResourceModel.builder()
                    .id(UUID.randomUUID())
                    .project(project.getId())
                    .parent(project.getId())
                    .name(getLabel("data", lang))
                    .description("Data folder")
                    .type(ResourceType.FOLDER)
                    .subType(ResourceSubtype.NONE)
                    .status(ResourceStatus.ACTIVE)
                    .size(0)
                    .createdBy(userId)
                    .updatedBy(userId).build());

            resourceService.save(ResourceModel.builder()
                    .id(UUID.randomUUID())
                    .project(project.getId())
                    .parent(project.getId())
                    .name(getLabel("documentation", lang))
                    .description("Documentation folder")
                    .type(ResourceType.FOLDER)
                    .subType(ResourceSubtype.NONE)
                    .status(ResourceStatus.ACTIVE)
                    .size(0)
                    .createdBy(userId)
                    .updatedBy(userId).build());

//            ResourceModel connectFolder = resourceService.save(ResourceModel.builder()
//                    .id(UUID.randomUUID())
//                    .project(project.getId())
//                    .parent(project.getId())
//                    .name("Connect")
//                    .description("Connect folder")
//                    .type(ResourceType.FOLDER)
//                    .subType(ResourceSubtype.NONE)
//                    .status(ResourceStatus.ACTIVE)
//                    .size(0)
//                    .createdBy(userId)
//                    .updatedBy(userId).build());
//
//            resourceService.save(ResourceModel.builder()
//                    .id(UUID.randomUUID())
//                    .project(project.getId())
//                    .parent(connectFolder.getId())
//                    .name(getLabel("sources", lang))
//                    .description("Connect Sources folder")
//                    .type(ResourceType.FOLDER)
//                    .subType(ResourceSubtype.NONE)
//                    .status(ResourceStatus.ACTIVE)
//                    .size(0)
//                    .createdBy(userId)
//                    .updatedBy(userId).build());
//
//            resourceService.save(ResourceModel.builder()
//                    .id(UUID.randomUUID())
//                    .project(project.getId())
//                    .parent(connectFolder.getId())
//                    .name(getLabel("links", lang))
//                    .description("Connect Links folder")
//                    .type(ResourceType.FOLDER)
//                    .subType(ResourceSubtype.NONE)
//                    .status(ResourceStatus.ACTIVE)
//                    .size(0)
//                    .createdBy(userId)
//                    .updatedBy(userId).build());

            if (platformConfigService.doesPlatformHasFractalUseCase()) {
                resourceService.save(ResourceModel.builder()
                        .id(UUID.randomUUID())
                        .project(project.getId())
                        .parent(project.getId())
                        .name(getLabel("logic", lang))
                        .description("Logic folder")
                        .type(ResourceType.FOLDER)
                        .subType(ResourceSubtype.NONE)
                        .status(ResourceStatus.ACTIVE)
                        .size(0)
                        .createdBy(userId)
                        .updatedBy(userId).build());
            }

            if (platformConfigService.doesPlatformHasKeplerUseCase()) {
                ResourceModel viewFolder = resourceService.save(ResourceModel.builder()
                        .id(UUID.randomUUID())
                        .project(project.getId())
                        .parent(project.getId())
                        .name(getLabel("view", lang))
                        .description("View folder")
                        .type(ResourceType.FOLDER)
                        .subType(ResourceSubtype.NONE)
                        .status(ResourceStatus.ACTIVE)
                        .size(0)
                        .createdBy(userId)
                        .updatedBy(userId).build());


                resourceService.save(ResourceModel.builder()
                        .id(UUID.randomUUID())
                        .project(project.getId())
                        .parent(viewFolder.getId())
                        .name(getLabel("charts", lang))
                        .description("Charts folder")
                        .type(ResourceType.FOLDER)
                        .subType(ResourceSubtype.NONE)
                        .status(ResourceStatus.ACTIVE)
                        .size(0)
                        .createdBy(userId)
                        .updatedBy(userId).build());

                resourceService.save(ResourceModel.builder()
                        .id(UUID.randomUUID())
                        .project(project.getId())
                        .parent(viewFolder.getId())
                        .name(getLabel("dashboards", lang))
                        .description("Dashboards folder")
                        .type(ResourceType.FOLDER)
                        .subType(ResourceSubtype.NONE)
                        .status(ResourceStatus.ACTIVE)
                        .size(0)
                        .createdBy(userId)
                        .updatedBy(userId).build());
            }
        }

        // create permission mapping for the user who creates it
        Role ownerRole = roleRepository.findByName("Owner");
        Role editorRole = roleRepository.findByName("Editor");
        Role viewerRole = roleRepository.findByName("Viewer");

        Groups platformAdminGroup = groupsRepository.findByName("platform-administrators");
        Groups projectAdminGroup = groupsRepository.findByName("project-administrators");

        permissionMappingRepository.save(new PermissionsMapping(null, userId, project.getId(), ownerRole, "active", new Date(), null, userId, null));
        permissionMappingRepository.save(new PermissionsMapping(null, platformAdminGroup.getId(), project.getId(), ownerRole, "active", new Date(), null, userId, null));
        permissionMappingRepository.save(new PermissionsMapping(null, projectAdminGroup.getId(), project.getId(), ownerRole, "active", new Date(), null, userId, null));

        if (newProjectRequest.isGroups()) {
            User user = userRepository.getReferenceById(userId);
            List<User> projectOwners = List.of(user);
            List<User> projectMembers = List.of(user);

            Groups projectGroupOwners = groupService.saveGroup(new Groups(null, newProject.getName() + "-OWNER", "Created automatically while project creation.", "active", projectOwners, new ArrayList<>(), projectMembers, new Date(), new Date(), userId, null));
            Groups projectGroupEditors = groupService.saveGroup(new Groups(null, newProject.getName() + "-EDITOR", "Created automatically while project creation.", "active", projectOwners, new ArrayList<>(), projectMembers, new Date(), new Date(), userId, null));
            Groups projectGroupViewers = groupService.saveGroup(new Groups(null, newProject.getName() + "-VIEWER", "Created automatically while project creation.", "active", projectOwners, new ArrayList<>(), projectMembers, new Date(), new Date(), userId, null));

            permissionMappingRepository.save(new PermissionsMapping(null, projectGroupOwners.getId(), project.getId(), ownerRole, "active", new Date(), null, userId, null));
            permissionMappingRepository.save(new PermissionsMapping(null, projectGroupEditors.getId(), project.getId(), editorRole, "active", new Date(), null, userId, null));
            permissionMappingRepository.save(new PermissionsMapping(null, projectGroupViewers.getId(), project.getId(), viewerRole, "active", new Date(), null, userId, null));
        }

        return new ResponseEntity<>(project, HttpStatus.OK);
    }

//    @Operation(summary = "It provides project by Id")
//    @GetMapping("/{Id}")
//    public ResponseEntity<?> getProjectById(@PathVariable("Id") UUID Id, Principal principal) {
//
//        UUID userId = userService.getUser(principal.getName()).getId();
//
//        if (!authzService.isViewer(userId, Id)) {
//            return new ResponseEntity<>("Access Denied to " + Id, HttpStatus.FORBIDDEN);
//        }
//
//        
//
//        ResourceViewsModel resourceViewsModel = new ResourceViewsModel();
//
//        resourceViewsModel.setResourceId(Id);
//        resourceViewsModel.setAction("view");
//        resourceViewsModel.setViewedBy(userId);
//
//        resourceViewsRepository.save(resourceViewsModel);
//        
//
//        if (!resourceService.existsById(Id)) {
//            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
//
//        } else if (resourceService.findById(Id).get().getStatus().equals("inTrash")) {
//            return new ResponseEntity<>("The project has been deleted.", HttpStatus.OK);
//        }
//        
//        FolderModel folderModel = resourceService.findById(Id).get();
//
//        
//
//        return new ResponseEntity<>(folderModel, HttpStatus.OK);
//    }

    @Operation(summary = "It provides project by Id")
    @GetMapping("/{Id}")
    public ResponseEntity<ResourceModel> getProjectById(@PathVariable("Id") UUID Id, Principal principal) {

        UUID userId;
        if (isValidUuid(principal.getName())) {
            userId = userRepository.findById(UUID.fromString(principal.getName())).get().getId();
        } else {
            userId = userService.getUser(principal.getName()).getId();
        }

        // TODO : this got some issue, not working with authz on
//        if (!authzService.isViewer(userId, Id)) {
//            return new ResponseEntity<>("Access Denied to " + Id, HttpStatus.FORBIDDEN);
//        }

//        if (!resourceService.existsById(Id)) {
//            return new ResponseEntity<ResourceModel>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
//
//        } else if (resourceService.findById(Id).get().getStatus().equals("inTrash")) {
//            return new ResponseEntity<>("The project has been deleted.", HttpStatus.OK);
//        }
        return new ResponseEntity<>(resourceService.findById(Id).get(), HttpStatus.OK);
    }

    @Operation(summary = "It provides Kitab details based on Ids list")
    @PostMapping("/byIds")
    public ResponseEntity<Object> getByIds(@RequestBody List<UUID> Ids) {


        Set<UUID> set = new HashSet<>(Ids);
        Ids.clear();
        Ids.addAll(set);
        Ids.remove(null);

        Map<UUID, Object> responseIds = new HashMap<>();

        for (UUID Id : Ids) {

            if (resourceService.existsById(Id)) {
                responseIds.put(Id, resourceService.findById(Id).get());
//                return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
            }
        }

        return new ResponseEntity<>(responseIds, HttpStatus.OK);

    }

    @Operation(summary = "It provides Kitab list of created resources by you.")
    @GetMapping("/createdByYou")
    public ResponseEntity<Object> createdByYou(Principal principal) {

        UUID userId = userService.getUser(principal.getName()).getId();

        List<ResourceModel> resourceModels = resourceService.findTop30ByCreatedByAndStatus(userId, "active");

        return new ResponseEntity<>(resourceModels, HttpStatus.OK);

    }

    @Operation(summary = "It provides Kitab list of updated resources by you.")
    @GetMapping("/updatedByYou")
    public ResponseEntity<Object> updatedByYou(Principal principal) {

        UUID userId = userService.getUser(principal.getName()).getId();

        List<ResourceModel> resourceModels = resourceService.findTop30ByUpdatedByAndStatus(userId, "active");

        return new ResponseEntity<>(resourceModels, HttpStatus.OK);

    }


    @Operation(summary = "It provides Kitab list of top viewed resources.")
    @GetMapping("/recentViews")
    public ResponseEntity<Object> recentViews(Principal principal) {

        UUID userId = userService.getUser(principal.getName()).getId();

        List<ResourceViewsModel> resourceViewsModel = resourceViewsRepository.findFirst10DistinctByViewedByOrderByViewedAtDesc(userId);

        List<UUID> alreadyResource = new ArrayList<>();
        List<String> alreadyType = new ArrayList<>();

        List<Object> folderModels = new ArrayList<>();

        for (ResourceViewsModel resourceView : resourceViewsModel) {

            if (resourceService.existsById(resourceView.getResourceId())) {
                ResourceModel resourceModel = resourceService.findById(resourceView.getResourceId()).get();
                HashMap<Object, Object> Views = new HashMap<>();

//            if(!alreadyType.contains(folderModel.getType()) && !alreadyResource.contains(folderModel.getId())) {
                if (!alreadyResource.contains(resourceModel.getId())) {

                    Views.put("resource", resourceModel);
                    Views.put("view", resourceView);

                    folderModels.add(Views);

                    alreadyResource.add(resourceModel.getId());
//                alreadyType.add(folderModel.getType());
                }
            }

        }

        return new ResponseEntity<>(folderModels, HttpStatus.OK);

    }


    @Operation(summary = "It provides Kitab list of favourites resources.")
    @GetMapping("/favourites")
    @Deprecated
    public ResponseEntity<Object> favourites(Principal principal) {

        UUID userId = userService.getUser(principal.getName()).getId();

        List<Favourites> favouritesList = favouritesRepository.findAllDistinctByUserIdOrderByCreatedAtDesc(userId);

        List<ResourceModel> favouriteResources = new ArrayList<>();

        for (Favourites favourite : favouritesList) {
            if (favouritesRepository.existsByUserIdAndResourceId(userId, favourite.getResourceId())) {
                Optional<ResourceModel> resourceModel = resourceService.findById(favourite.getResourceId());
                resourceModel.ifPresent(favouriteResources::add);
            }

        }
        return new ResponseEntity<>(favouriteResources, HttpStatus.OK);
    }


    @Operation(summary = "Gives boolean if the resource in favourites.")
    @GetMapping("/favourite/{resourceId}")
    public boolean isFavourites(Principal principal, @PathVariable("resourceId") UUID resourceId) {
        UUID userId = userService.getUser(principal.getName()).getId();
        return favouritesRepository.existsByUserIdAndResourceId(userId, resourceId);
    }

    @Operation(summary = "It rename folder by Id")
    @GetMapping(path = "/{Id}/{newName}/rename")
    public ResponseEntity<Object> rename(Principal principal, @PathVariable("Id") UUID Id, @PathVariable("newName") String newName) {
        User user = userService.getUser(principal.getName());
        UUID userId = user.getId();

        if (!authzService.isEditor(userId, Id)) {
            throw new UnauthorizedException();
        }

        if (!resourceService.existsById(Id)) {
            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
        } else if (resourceService.getResourceModel(Id).getStatus().equals("inTrash")) {
            return new ResponseEntity<>("The folder has been deleted.", HttpStatus.OK);
        }

        if (Objects.nonNull(newName) && newName.length() <= 3) {
            throw new BadRequestException("Name length should be at least 3 or more");
        }

        ResourceModel folder = resourceService.getResourceModel(Id);

        List<ResourceModel> children = resourceService.getByParent(folder.getParent());
        children.removeIf(child -> child.getStatus().equals("inTrash"));

        if (children.stream().anyMatch(f ->
                (newName.equals(f.getName())) && folder.getType().equals(f.getType())
        )) {
            return new ResponseEntity<>("Same name Resource exists!", HttpStatus.BAD_REQUEST);
        }

        folder.setName(newName);
        folder.setUpdatedAt(new Date());
        folder.setUpdatedBy(user.getId());

        resourceService.save(folder);

        return new ResponseEntity<>("Resource renamed successfully", HttpStatus.OK);
    }

    @Operation(summary = "It rename description of resource by Id")
    @GetMapping(path = "/{Id}/{newDescription}/renameDescription")
    public ResponseEntity<Object> renameDescription(Principal principal, @PathVariable("Id") UUID Id, @PathVariable("newDescription") String newDescription) {
        UUID userId = userService.getUser(principal.getName()).getId();

        if (!authzService.isEditor(userId, Id)) {
            throw new UnauthorizedException();
        }

        if (!resourceService.existsById(Id)) {
            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
        } else if (resourceService.getResourceModel(Id).getStatus().equals("inTrash")) {
            return new ResponseEntity<>("The resource has been deleted.", HttpStatus.OK);
        }
        ResourceModel folder = resourceService.getResourceModel(Id);
        folder.setDescription(newDescription);
        resourceService.save(folder);

        return new ResponseEntity<>("Description changed successfully", HttpStatus.OK);

    }

    @Operation(summary = "It deletes by ID")
    @DeleteMapping(path = "/{Id}/moveToTrash")
    public ResponseEntity<Object> moveToTrash(Principal principal, @PathVariable("Id") UUID Id) {
        UUID userId = userService.getUser(principal.getName()).getId();
        if (!authzService.isOwner(userId, Id)) {
            throw new UnauthorizedException();
        }

        if (!resourceService.existsById(Id)) {
            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
        }

        // TODO : this should detect type and based on that it should delete the physical stuff also.
        //  may be initially, just mark inTrash, then cleaning service deletes it.

        ResourceModel resourceModel = resourceService.getResourceModel(Id);
        moveToTrashRecursive(resourceModel);

        return new ResponseEntity<>("Id " + Id + " deleted successfully!", HttpStatus.OK);
    }

    private void moveToTrashRecursive(ResourceModel resourceModel) {

        if (resourceModel.getType() == ResourceType.REPOSITORY || resourceModel.getType() == ResourceType.DATASET || resourceModel.getType() == ResourceType.DASHBOARD || resourceModel.getType() == ResourceType.CHART) {
            resourceModel.setStatus(ResourceStatus.IN_TRASH);
            resourceService.save(resourceModel);
            return;
        }
        resourceModel.setStatus(ResourceStatus.IN_TRASH);
        resourceService.save(resourceModel);
        List<ResourceModel> children = resourceService.getByParent(resourceModel.getId());

        if (children.isEmpty()) return;

        for (ResourceModel child : children) {
            moveToTrashRecursive(child);
        }
    }

    @Operation(summary = "It restore from trash by ID")
    @GetMapping(path = "/{Id}/restoreFromTrash")
    public ResponseEntity<Object> restoreFromTrash(Principal principal, @PathVariable("Id") UUID Id) {
        UUID userId = userService.getUser(principal.getName()).getId();
        if (!authzService.isOwner(userId, Id)) {
            throw new UnauthorizedException();
        }

        if (!resourceService.existsById(Id)) {
            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
        }

        // TODO : this should detect type and based on that it should delete the
        // physical stuff also.
        // may be initially, just mark inTrash, then cleaning service deletes it.

        ResourceModel resourceModel = resourceService.findById(Id).orElseThrow();
        List<ResourceModel> children = resourceService.getByParent(resourceModel.getParent());
        children.removeIf(child -> child.getStatus() == ResourceStatus.IN_TRASH);

        if (children.stream().anyMatch(folder -> resourceModel.getName().equals(folder.getName()))) {
            resourceModel.setName(resourceModel.getName() + " - Recovered");
        }

        restoreFromTrashRecursive(resourceModel);

        return new ResponseEntity<>("Id " + Id + " restored successfully!", HttpStatus.OK);
    }

    private void restoreFromTrashRecursive(ResourceModel resourceModel) {

        if (resourceModel.getType() == ResourceType.REPOSITORY || resourceModel.getType() == ResourceType.DATASET || resourceModel.getType() == ResourceType.DASHBOARD || resourceModel.getType() == ResourceType.CHART) {
            resourceModel.setStatus(ResourceStatus.ACTIVE);
            resourceService.save(resourceModel);
            return;
        }
        resourceModel.setStatus(ResourceStatus.ACTIVE);
        resourceService.save(resourceModel);
        List<ResourceModel> children = resourceService.getByParent(resourceModel.getId());

        if (children.isEmpty())
            return;

        for (ResourceModel child : children) {
            restoreFromTrashRecursive(child);
        }
    }

    @Operation(summary = "It restore from trash by ID")
    @DeleteMapping(path = "/{Id}/permanentDelete")
    public ResponseEntity<Object> permanentDelete(Principal principal, @PathVariable("Id") UUID Id) throws Exception {
        UUID userId = userService.getUser(principal.getName()).getId();
        if (!authzService.isOwner(userId, Id)) {
            throw new UnauthorizedException();
        }

        if (!resourceService.existsById(Id)) {
            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NOT_FOUND);
        }

        // TODO : this should detect type and based on that it should delete the
        // physical stuff also.
        // may be initially, just mark inTrash, then cleaning service deletes it.

        ResourceModel resourceModel = resourceService.findById(Id).orElseThrow();

        permanentDeleteRecursive(resourceModel);

        return new ResponseEntity<>("Id " + Id + " permanently deleted!", HttpStatus.OK);
    }

    private void permanentDeleteRecursive(ResourceModel resourceModel) throws Exception {
        UUID id = resourceModel.getId();
        ResourceType type = resourceModel.getType();
        resourceService.permanentDelete(resourceModel.getId(), Objects.requireNonNull(AuthUtils.getCurrentUser()).getId());
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
                        permanentDeleteRecursive(resourceService.getResourceModel(charts.getId()));
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
        ResourceModel parent = resourceService.findById(resourceModel.getId()).get();

        List<ResourceModel> children = resourceService.getByParent(parent.getId());

        if (children.isEmpty()) {
            return;
        }

        for (ResourceModel child : children) {
            permanentDeleteRecursive(child);
        }
    }

    @Operation(summary = "Provides logical path based on Id")
    @GetMapping(path = "/{Id}/getPath", produces = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Object> getPath(Principal principal, @PathVariable("Id") UUID Id) {

        if (Objects.equals(Id.toString(), "undefined")) {
            return new ResponseEntity<>("Not valid Id", HttpStatus.BAD_REQUEST);
        }
        if (!resourceService.existsById(Id)) {
            return new ResponseEntity<>("Id " + Id + " does not exist!", HttpStatus.NO_CONTENT);
        } else if (resourceService.findActiveById(Id).isEmpty()) {
            return new ResponseEntity<>("The project has been deleted.", HttpStatus.OK);
        }
        UUID userId = userService.getUser(principal.getName()).getId();
        if (!authzService.isViewer(userId, Id)
                && !authzService.isPlatformAdmin(userId)
                && !authzService.isProjectAdmin(userId)
        ) {
            throw new UnauthorizedException();
        }

        List<ResourceModel> path = resourceService.getPathById(Id, new ArrayList<>());

        Collections.reverse(path);


        return new ResponseEntity<>(path, HttpStatus.OK);
    }

    @Operation(summary = "Creates Sample Data")
    @GetMapping(path = "/sampleData/{sampleDataType}", produces = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Object> sampleData(Principal principal, @PathVariable("sampleDataType") String sampleDataType) {

        UUID userId = userService.getUser(principal.getName()).getId();

        // only platform admin in allowed to do this
        if (!authzService.isPlatformAdmin(userId))
            throw new UnauthorizedException();


        // Temporary th is to fix user preferences
        List<User> allUsers1 = userRepository.findAll();
        for (User user : allUsers1) {
            user.setPreferences(new UserPreferences());
            userRepository.save(user);
        }

        // don't load data if below variable is null or not true
        if (System.getenv("LOAD_SAMPLE_DATA") == null) {
            new ResponseEntity<>("Load Sample Data is not allowed", HttpStatus.OK);

        } else {
            if (!System.getenv("LOAD_SAMPLE_DATA").equals("true")) {
                new ResponseEntity<>("Load Sample Data is not allowed", HttpStatus.OK);
            }
        }

        // If sample data exists then do not add again
        if (userRepository.existsByUsername("rakesh")) {
            return new ResponseEntity<>("Sample data already exists", HttpStatus.ALREADY_REPORTED);
        }

        User movetodataInternal = userService.getUser(PlatformInternal.toString());
        final String defaultPassword = "movetodata2024";

        if (Objects.equals(sampleDataType, "development")) {

            userService.saveUser(new User(null, "Bhagesh Dhankhar", "bhagesh", defaultPassword, "Bhagesh", "Dhankhar", "India", "", "bhagesh@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

//            userService.saveUser(new User(null, "Amine Aouini", "amine", defaultPassword, "Amine", "Aouini", "Aix", "", "amine@movetodata.io", AuthProvider.local, null, null, null, null, null, null, null));

            userService.saveUser(new User(null, "Anshul Dhankhar", "anshul", defaultPassword, "Anshul", "Dhankhar", "Delhi", "", "anshul@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

//            userService.saveUser(new User(null, "Lakshay Dabas", "lakshay", defaultPassword, "Lakshay", "Dabas", "Delhi", "", "lakshay@movetodata.io", AuthProvider.local, null, null, null, null, null, null, null));

//            userService.saveUser(new User(null, "Manav Rathi", "manav", defaultPassword, "Manav", "Rathi", "Delhi", "", "manav@movetodata.io", AuthProvider.local, null, null, null, null, null, null, null));

            userService.saveUser(new User(null, "Ankit Kumar", "ankit", defaultPassword, "Ankit", "Kumar", "Delhi", "https://ca.slack-edge.com/T0291A2684X-U02H75ZLERE-ac5c85b6aead-192", "ankit@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

//            userService.saveUser(new User(null, "Suryansh Kumar", "suryansh", defaultPassword, "Suryansh", "Kumar", "Odisa", "https://ca.slack-edge.com/T0291A2684X-U054QC09W72-0ad6d0241cb3-192", "suryansh@movetodata.io", AuthProvider.local, null, null, null, null, null, null, null,null));

//            userService.saveUser(new User(null, "Jonathan De-Guio", "jonathan", defaultPassword, "Jonathan", "De-Guio", "Aix", "https://ca.slack-edge.com/T0291A2684X-U0292AZES5D-aea210fd8068-192", "jonathan@movetodata.io", AuthProvider.local, null, null, null, null, null, null, null));

//            userService.saveUser(new User(null, "James Morrish", "james", defaultPassword, "James", "Morrish", "Aix", "https://ca.slack-edge.com/T0291A2684X-U029Q9B53EX-e6b31ee5d73c-192", "james@movetodata.io", AuthProvider.local, null, null, null, null, null, null, null));

            userService.saveUser(new User(null, "Rakesh Malik", "rakesh", defaultPassword, "Rakesh", "Malik", "Aix", "https://avatars.githubusercontent.com/u/38586615?s=400&u=b071181ada05d564a60d8f1631ecc5f79b9a518d&v=4", "rakesh@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

        } else if (Objects.equals(sampleDataType, "demo")) {

            userService.saveUser(new User(null, "Vincent De-Guio", "vincent", "movetodatademo2023", "Vincent", "De-Guio", "Aix", "", "vincent@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));
            userService.saveUser(new User(null, "Jonathan De-Guio", "jonathan", "movetodatademo2023", "Jonathan", "De-Guio", "Aix", "https://ca.slack-edge.com/T0291A2684X-U0292AZES5D-aea210fd8068-192", "jonathan@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));
            userService.saveUser(new User(null, "Yann Koziareck", "yann", "movetodatademo2023", "Yann", "Koziareck", "Aix", "https://ca.slack-edge.com/T0291A2684X-U055HR5QN84-g8fe558ccafb-512", "yann@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));
            userService.saveUser(new User(null, "Rakesh Malik", "rakesh", "movetodatademo2023", "Rakesh", "Malik", "Aix", "https://avatars.githubusercontent.com/u/38586615?s=400&u=b071181ada05d564a60d8f1631ecc5f79b9a518d&v=4", "rakesh@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

            userService.saveUser(new User(null, "Romain De-Guio", "romain", "movetodatademo2023", "Romain", "De-Guio", "Aix", "", "romain.deguio@movetodata.fr", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

            userService.saveUser(new User(null, "Melanie Le Bot", "melanie", "movetodatademo2023", "Melanie", "Le Bot", "Aix", "", "melanie.lebot@movetodata.fr", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

            userService.saveUser(new User(null, "Anjali Malik", "anjali", "movetodatademo2023", "Anjali", "Malik", "Toulouse", "", "anjali@rkmalik.co.uk", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));
            userService.saveUser(new User(null, "Olivier Guide", "olivier", "movetodatademo2023", "Olivier", "Guide", "Aix", "", "olivier@movetodata.io", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));
            userService.saveUser(new User(null, "Laurent ", "laurent", "movetodatademo2023", "Laurent", "Moysoulier", "Aix", "", "moysoulier.l@gmail.com", AuthProvider.local, null, null, false, null, false, null, new UserPreferences(), new NotificationPreferences().getId(), null, null, null, null, null));

        } else {
            return new ResponseEntity<>("Not correct data type", HttpStatus.BAD_REQUEST);
        }


        List<UUID> sampleGroupMembers = new ArrayList<>();

        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            sampleGroupMembers.add(user.getId());
        }

        if (groupsRepository.existsByName("platform-administrators")) {
            Groups platformAdminGroup = groupsRepository.findByName("platform-administrators");

            groupService.addUsersToGroupMembers(movetodataInternal.getId(), sampleGroupMembers, platformAdminGroup.getId());
            groupService.addUsersToGroupOwners(movetodataInternal.getId(), sampleGroupMembers, platformAdminGroup.getId());
        }
        // Tags

        TagsCategory businessTagsCategory = tagCategoryRepository.save(new TagsCategory(null, "Business", "This is a business category", true, null, new Date(), movetodataInternal.getId(), null, null));
        TagsCategory governanceTagsCategory = tagCategoryRepository.save(new TagsCategory(null, "Governance", "This is a governance category", true, null, new Date(), movetodataInternal.getId(), null, null));

        tagRepository.save(new Tags(null, "Internal", "This is an internal tag", "yellow", new Date(), movetodataInternal.getId(), null, null, businessTagsCategory));
        tagRepository.save(new Tags(null, "Confidential", "This is an confidential tag", "red", new Date(), movetodataInternal.getId(), null, null, businessTagsCategory));
        tagRepository.save(new Tags(null, "Restricted", "This is an restricted tag", "blue", new Date(), movetodataInternal.getId(), null, null, businessTagsCategory));
        tagRepository.save(new Tags(null, "Non-Confidential", "This is an Non-Confidential", "green", new Date(), movetodataInternal.getId(), null, null, businessTagsCategory));

        tagRepository.save(new Tags(null, "Governance", "This is an Governance tag", "orange", new Date(), movetodataInternal.getId(), null, null, governanceTagsCategory));
        tagRepository.save(new Tags(null, "Non-Confidential", "This is an Non-Confidential tag", "cyan", new Date(), movetodataInternal.getId(), null, null, governanceTagsCategory));

        return new ResponseEntity<>("Sample Data has been created.", HttpStatus.OK);

    }

//    private void addSampleData(FolderModel sampleDataset0, UUID movetodataInternalUserId) {
//
//        branchRepository.save(new BranchModel(null, "master", sampleDataset0.getId(), UUID.randomUUID(), "raw", new Date(), new Date(), movetodataInternalUserId, movetodataInternalUserId));
//
//        kitabDatasetRepository.save(new DatasetModel(sampleDataset0.id, sampleDataset0.name, null,
//                new Date(), new Date(), movetodataInternalUserId, movetodataInternalUserId));
//    }

    @Operation(summary = "Provides id based on path based on given path")
    @PostMapping(path = "/getIdByPath")
    ResponseEntity<Object> getIdByPath(Principal principal, @RequestBody HashMap<String, String> path) {
        try {
            UUID resourceId = null;

            ResourceType resourceType = null;

            String processPath = path.get("path");
            String[] individualPath = processPath.split("/");

            ResourceModel tempModel;

            for (int i = 2; i < individualPath.length; i++) {
                tempModel = resourceService.findByNameAndParentAndStatus(individualPath[i], resourceId, ResourceStatus.ACTIVE);
                if (tempModel == null) {
                    Map<String, Object> response = Map.of("Status", false, "Message", individualPath[i] + " Not Found in " + processPath.substring(0, processPath.indexOf(individualPath[i])));
                    return new ResponseEntity<>(response, HttpStatus.OK);
                }
                resourceId = tempModel.getId();
                resourceType = tempModel.getType();
            }

            UUID userId = userService.getUser(principal.getName()).getId();
            if (!authzService.isViewer(userId, resourceId)) {
                throw new UnauthorizedException();
            }

            if (resourceId != null) {
                Map<String, Object> response = Map.of("Status", true, "Message", resourceId, "Type", resourceType);
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                Map<String, Object> response = Map.of("Status", false, "Message", "null", "Type", "null");
                return new ResponseEntity<>(response, HttpStatus.OK);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Something went wrong.: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Provides id based on path based on given path")
    @PostMapping(path = "/getParentIdByPath")
    ResponseEntity<Object> getParent(Principal principal, @RequestBody HashMap<String, String> path) {
        try {
            String processPath = path.get("path");
            ResourceModel resourceModel = kitabService.getResourceByPath(processPath, true);
            if (resourceModel == null) {
                throw new NotFoundException("Parent Not found");
            }
            UUID resourceId = resourceModel.getId();

            UUID userId = userService.getUser(principal.getName()).getId();
            if (!authzService.isViewer(userId, resourceId)) {
                throw new UnauthorizedException();
            }
            Map<String, Object> response = Map.of("Status", true, "Message", resourceId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Something went wrong.: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Provides resources which match the query on Full text search")
    @PostMapping(path = "/globalSearch")
    ResponseEntity<Object> globalSearch(Principal principal, @RequestBody String query) {
        try {
            List<ResourceModel> searchResults = resourceRepository.getResourceFilterByQuery(query);
            return new ResponseEntity<>(searchResults, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Something went wrong: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Provides resources which match the query on Full text search")
    @PostMapping(path = "/globalSearchV2")
    ResponseEntity<Object> globalSearch2(Principal principal, PageSettings pageSettings, @RequestBody GlobalResourceSearchFilterDTO globalSearchFilters) {
        try {
            Page<ResourceModel> searchResults = resourceService.getAllResourceByFilters(pageSettings, globalSearchFilters);
            return new ResponseEntity<>(searchResults, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Something went wrong: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "It provides list of all active projects.")
    @PostMapping("/searchProject")
    public ResponseEntity<Object> searchProject(@RequestBody String searchText) {
        List<ResourceModel> activeProjects = resourceService.searchProject(searchText);
        return ResponseEntity.ok().body(activeProjects);
    }

    /**
     * This TypeAdapter unproxies Hibernate proxied objects, and serializes them
     * through the registered (or default) TypeAdapter of the base class.
     */
    public static class HibernateProxyTypeAdapter extends TypeAdapter<HibernateProxy> {

        public static final TypeAdapterFactory FACTORY = new TypeAdapterFactory() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> type) {
                return (HibernateProxy.class.isAssignableFrom(type.getRawType()) ? (TypeAdapter<T>) new HibernateProxyTypeAdapter(gson) : null);
            }
        };
        private final Gson context;

        private HibernateProxyTypeAdapter(Gson context) {
            this.context = context;
        }

        @Override
        public HibernateProxy read(JsonReader in) throws IOException {
            throw new UnsupportedOperationException("Not supported");
        }

        @SuppressWarnings({"rawtypes", "unchecked"})
        @Override
        public void write(JsonWriter out, HibernateProxy value) throws IOException {
            if (value == null) {
                out.nullValue();
                return;
            }
            // Retrieve the original (not proxy) class
            Class<?> baseType = Hibernate.getClass(value);
            // Get the TypeAdapter of the original class, to delegate the serialization
            TypeAdapter delegate = context.getAdapter(TypeToken.get(baseType));
            // Get a filled instance of the original class
            Object unproxiedValue = value.getHibernateLazyInitializer().getImplementation();
            // Serialize the value
            delegate.write(out, unproxiedValue);
        }
    }

}
