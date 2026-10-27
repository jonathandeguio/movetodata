package io.movetodata.apps.controllers;

import io.movetodata.apps.library.models.AppDefinition;
import io.movetodata.apps.library.repository.AppDefinitionRepository;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * CRUD controller for App Builder definitions.
 *
 * All state is stored in {@code app_definition}. The controller is intentionally
 * thin: no service layer is needed at this stage — all logic fits in simple
 * repository calls. A service layer can be extracted when business rules grow.
 *
 * Security model (current):
 *  - GET endpoints require VIEWER role.
 *  - Write endpoints (POST / PUT / DELETE) require EDITOR role.
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/apps")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "App Builder", description = "Manage App Builder application definitions.")
public class AppDefinitionController {

    private final AppDefinitionRepository appDefinitionRepository;

    // -------------------------------------------------------------------------
    // GET /api/apps — list all app definitions
    // -------------------------------------------------------------------------

    @Operation(summary = "List all app definitions.")
    @GetMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<AppDefinition>> listApps(
            @AuthenticationPrincipal AuthUser authUser) {

        List<AppDefinition> apps = appDefinitionRepository.findAll();
        return ResponseEntity.ok(apps);
    }

    // -------------------------------------------------------------------------
    // GET /api/apps/{uuid} — get one app definition by UUID
    // -------------------------------------------------------------------------

    @Operation(summary = "Get a single app definition by UUID.")
    @GetMapping("/{uuid}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<AppDefinition> getApp(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("uuid") String uuid) {

        return appDefinitionRepository.findByUuid(uuid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // POST /api/apps — create a new app definition
    // -------------------------------------------------------------------------

    @Operation(summary = "Create a new app definition.")
    @PostMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<AppDefinition> createApp(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        String name = body.getOrDefault("name", "").toString().trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        AppDefinition app = AppDefinition.builder()
                .uuid(UUID.randomUUID().toString())
                .name(name)
                .description(body.containsKey("description")
                        ? body.get("description") != null ? body.get("description").toString() : null
                        : null)
                .fieldsJson(body.getOrDefault("fieldsJson", "[]").toString())
                .icon(body.containsKey("icon")
                        ? body.get("icon") != null ? body.get("icon").toString() : null
                        : null)
                .createdBy(authUser.getId())
                .build();

        AppDefinition saved = appDefinitionRepository.save(app);
        log.info("App definition created: uuid={} by user={}", saved.getUuid(), authUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // -------------------------------------------------------------------------
    // PUT /api/apps/{uuid} — update an existing app definition
    // -------------------------------------------------------------------------

    @Operation(summary = "Update an existing app definition.")
    @PutMapping("/{uuid}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<AppDefinition> updateApp(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("uuid") String uuid,
            @RequestBody Map<String, Object> body) {

        return appDefinitionRepository.findByUuid(uuid)
                .map(existing -> {
                    if (body.containsKey("name")) {
                        String name = body.get("name") != null ? body.get("name").toString().trim() : "";
                        if (!name.isEmpty()) {
                            existing.setName(name);
                        }
                    }
                    if (body.containsKey("description")) {
                        existing.setDescription(
                                body.get("description") != null ? body.get("description").toString() : null);
                    }
                    if (body.containsKey("fieldsJson")) {
                        existing.setFieldsJson(
                                body.get("fieldsJson") != null ? body.get("fieldsJson").toString() : "[]");
                    }
                    if (body.containsKey("icon")) {
                        existing.setIcon(
                                body.get("icon") != null ? body.get("icon").toString() : null);
                    }
                    AppDefinition updated = appDefinitionRepository.save(existing);
                    log.info("App definition updated: uuid={} by user={}", uuid, authUser.getId());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/apps/{uuid} — delete an app definition
    // -------------------------------------------------------------------------

    @Operation(summary = "Delete an app definition.")
    @DeleteMapping("/{uuid}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteApp(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("uuid") String uuid) {

        java.util.Optional<AppDefinition> opt = appDefinitionRepository.findByUuid(uuid);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        appDefinitionRepository.delete(opt.get());
        log.info("App definition deleted: uuid={} by user={}", uuid, authUser.getId());
        return ResponseEntity.noContent().build();
    }
}
