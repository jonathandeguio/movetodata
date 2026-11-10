package io.movetodata.snap.passport.controller;

import io.movetodata.snap.passport.DTO.GroupDTO;
import io.movetodata.snap.passport.library.models.GroupManagementSpecification;
import io.movetodata.snap.passport.library.models.GroupWithUserDTO;
import io.movetodata.snap.passport.library.models.Groups;
import io.movetodata.snap.passport.library.models.User;
import io.movetodata.snap.passport.library.repository.GroupsRepository;
import io.movetodata.snap.passport.library.repository.UserRepository;
import io.movetodata.snap.passport.library.service.AuthzService;
import io.movetodata.snap.passport.library.service.GroupService;
import io.movetodata.snap.passport.library.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/passport/groups")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Passport", description = "Authentication service endpoints")
public class GroupController {
    private final GroupService groupService;
    private final UserService userService;
    private final AuthzService authzService;
    private final GroupsRepository groupsRepository;
    private final UserRepository userRepository;


    @Operation(summary = "It provides list of all groups")
    @GetMapping("/all")
    public ResponseEntity<List<GroupDTO>> getGroups(Principal principal) {
        //Completed need to verify
        // TODO : only show the groups to user which user belongs to : member or manager or owner
        // look into GroupServiceImpl.java
        User user = userService.getUser(principal.getName());
        List<GroupDTO> GroupList = new ArrayList<>();
        for (Groups G : groupService.getGroups()) {

            if (authzService.isPlatformAdmin(user.getId())) {
                GroupList.add(groupService.convertGroupIntoDTO(G));
                continue;
            }

            if ((G.getMembers().contains(user) || G.getOwners().contains(user) || G.getManagers().contains(user))) {//is member or manager or owner

                if (!Objects.equals(G.getName(), "platform-administrators") ||
                        !Objects.equals(G.getName(), "group-administrators") ||
                        !Objects.equals(G.getName(), "user-administrators") ||
                        !Objects.equals(G.getName(), "project-administrators") ||
                        !Objects.equals(G.getName(), "connect-administrators")
                ) {
                    GroupList.add(groupService.convertGroupIntoDTO(G));
                }
            }
        }


        return ResponseEntity.ok().body(GroupList);
    }

    @Operation(summary = "To add new groups")
    @PostMapping("/add")
    public ResponseEntity<Groups> saveGroup(Principal principal, @RequestBody Groups groups) {

        UUID userId = userService.getUser(principal.getName()).getId();
        if (!authzService.isPlatformAdmin(userId) && !authzService.isGroupAdmin(userId))
            return new ResponseEntity("Access Denied to create new group", HttpStatus.FORBIDDEN);

        URI uri = URI.create(ServletUriComponentsBuilder.fromCurrentContextPath().path("/passport/group/add").toUriString());

        List<User> user1 = userRepository.findAllById(Collections.singleton(userId));

        groups.setCreatedAt(new Date());
        groups.setCreatedBy(userId);

        groups.setOwners(user1);

        Groups createdGroup = groupService.saveGroup(groups);

        return ResponseEntity.created(uri).body(createdGroup);
    }


    @Operation(summary = "It provides Groups by Id")
    @GetMapping("/{Id}")
    public ResponseEntity<Object> getById(Principal principal, @PathVariable("Id") UUID Id) {


        if (!groupsRepository.existsById(Id)) {
            return new ResponseEntity<>("groups with Id " + Id + " does not exist", HttpStatus.NOT_FOUND);
        }

        Groups group = groupsRepository.findById(Id).get();
        User user = userService.getUser(principal.getName());
        UUID userId = user.getId();
        GroupWithUserDTO groupWithUserDTO = groupService.convertGroupIntoGroupWithUserDTO(group);

        if (!group.getMembers().contains(user) && !group.getManagers().contains(user) && !group.getOwners().contains(user) && !authzService.isPlatformAdmin(userId)
                && !authzService.isGroupAdmin(userId))
            return new ResponseEntity("Access Denied to get this group", HttpStatus.FORBIDDEN);
        return new ResponseEntity<>(groupWithUserDTO, HttpStatus.OK);
    }

    @Operation(summary = "It deletes Groups by Id")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Object> deleteById(Principal principal, @PathVariable("id") UUID Id) {
        User user = userService.getUser(principal.getName());
        UUID userId = userService.getUser(principal.getName()).getId();

        if (!groupsRepository.existsById(Id))
            return new ResponseEntity<>("groups with Id " + Id + " does not exist", HttpStatus.NOT_FOUND);

        if (Objects.equals(groupsRepository.getReferenceById(Id).getName(), "platform-administrators") ||
                Objects.equals(groupsRepository.getReferenceById(Id).getName(), "project-administrators") ||
                Objects.equals(groupsRepository.getReferenceById(Id).getName(), "group-administrators") ||
                Objects.equals(groupsRepository.getReferenceById(Id).getName(), "user-administrators") ||
                Objects.equals(groupsRepository.getReferenceById(Id).getName(), "connect-administrators"))
            return new ResponseEntity<>("Administrator groups can not be deleted.", HttpStatus.FORBIDDEN);

        if (!authzService.isPlatformAdmin(userId)
                && !authzService.isGroupAdmin(userId) && !groupsRepository.findById(Id).get().getOwners().contains(user))
            return new ResponseEntity("Access Denied to delete the group", HttpStatus.FORBIDDEN);
        groupsRepository.deleteById(Id);


        return new ResponseEntity<>("Group deleted successfully.", HttpStatus.OK);
    }

    @Operation(summary = "Manage members or administrators to group")
    @PostMapping("/manageGroups")
    public ResponseEntity<Object> addOrRemoveUsersFromGroup(Principal principal, @RequestBody GroupManagementSpecification groupManagementSpecification) {
        User user = userService.getUser(principal.getName());
        UUID userId = userService.getUser(principal.getName()).getId();

        if (!groupsRepository.existsById(groupManagementSpecification.getId())) {
            return new ResponseEntity<>("groups with Id " + groupManagementSpecification.getId() + " does not exist", HttpStatus.NOT_FOUND);
        }

        String action = groupManagementSpecification.getAction();
        if (!"add".equals(action) && !"remove".equals(action)) {
            return ResponseEntity.badRequest().body("Action has to be 'add' or 'remove'");
        }

        for (UUID groupUserId : groupManagementSpecification.getUserIds()) {
            if (!userRepository.existsById(groupUserId)) {
                return new ResponseEntity<>("User not found " + groupUserId, HttpStatus.NOT_FOUND);
            }
        }

        String type = groupManagementSpecification.getType();
        List<UUID> userIds = groupManagementSpecification.getUserIds();
        UUID groupId = groupManagementSpecification.getId();

        //checking if isOwner or isManager or platform admin or group admin
        if (!groupsRepository.getById(groupId).getOwners().contains(user)
                && !groupsRepository.getById(groupId).getManagers().contains(user)
                && !authzService.isPlatformAdmin(userId)
                && !authzService.isGroupAdmin(userId))
            return new ResponseEntity("Access Denied to Modify group", HttpStatus.FORBIDDEN);

        if ("add".equals(action)) {
            switch (type) {
                case "members":
                    groupService.addUsersToGroupMembers(userId, userIds, groupId);
                    break;
                case "managers":
                    groupService.addUsersToGroupManagers(userId, userIds, groupId);
                    break;
                case "owners":
                    groupService.addUsersToGroupOwners(userId, userIds, groupId);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid group type: " + type);
            }
        } else if ("remove".equals(action)) {
            switch (type) {
                case "members":
                    groupService.removeUsersToGroupMembers(userId, userIds, groupId);
                    break;
                case "managers":
                    groupService.removeUsersToGroupManagers(userId, userIds, groupId);
                    break;
                case "owners":
                    groupService.removeUsersToGroupOwners(userId, userIds, groupId);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid group type: " + type);
            }
        }
        Groups group = groupsRepository.findById(groupId).orElseThrow();
        return new ResponseEntity<>(group,HttpStatus.OK);
    }

    @Operation(summary = "This can be used to rename groups.")
    @GetMapping("/{Id}/{newName}/rename")
    public ResponseEntity<Object> renameGroup(Principal principal, @PathVariable("Id") UUID id, @PathVariable("newName") String newName) {


        User user = userService.getUser(principal.getName());
        UUID userId = user.getId();

        if (!groupsRepository.existsById(id)) {
            return new ResponseEntity<>("No group found for given Id", HttpStatus.NOT_FOUND);
        }


        Groups groups = groupsRepository.getReferenceById(id);
        if (!groups.getOwners().contains(user) && !authzService.isPlatformAdmin(userId)
                && !authzService.isGroupAdmin(userId))
            return new ResponseEntity("Access Denied to rename this group title", HttpStatus.FORBIDDEN);


        groups.setName(newName);

        groupsRepository.save(groups);

        return new ResponseEntity<>("Group renamed successfully", HttpStatus.OK);

    }

    @Operation(summary = "This can be used to change description of group.")
    @GetMapping("/{Id}/{newDescription}/renameDescription")
    public ResponseEntity<Object> renameDescription(Principal principal, @PathVariable("Id") UUID id, @PathVariable("renameDescription") String renameDescription) {


        User user = userService.getUser(principal.getName());
        UUID userId = user.getId();

        if (!groupsRepository.existsById(id)) {
            return new ResponseEntity<>("No group found for given Id", HttpStatus.NOT_FOUND);
        }

        Groups groups = groupsRepository.getById(id);
        if (!groups.getOwners().contains(user) && !authzService.isPlatformAdmin(userId)
                && !authzService.isGroupAdmin(userId))
            return new ResponseEntity("Access Denied to rename this group description", HttpStatus.FORBIDDEN);


        groups.setDescription(renameDescription);

        groupsRepository.save(groups);

        return new ResponseEntity<>("Chart Description changed successfully", HttpStatus.OK);
    }
}
