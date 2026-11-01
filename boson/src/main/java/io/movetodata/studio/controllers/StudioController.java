package io.movetodata.studio.controllers;

import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.movetodata.studio.library.dto.AppListItem;
import io.movetodata.studio.library.dto.CreateAppRequest;
import io.movetodata.studio.library.dto.DraftResponse;
import io.movetodata.studio.library.dto.SaveDraftRequest;
import io.movetodata.studio.library.services.StudioAppService;
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

import javax.persistence.EntityNotFoundException;
import javax.persistence.OptimisticLockException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * API REST du Studio de Webapps IA.
 *
 * Endpoints :
 *   GET    /api/studio/apps?q=            — liste des applications
 *   POST   /api/studio/apps               — créer une application
 *   GET    /api/studio/apps/{id}/draft    — lire le brouillon courant
 *   PUT    /api/studio/apps/{id}/draft    — sauvegarder le brouillon (verrou optimiste)
 *   DELETE /api/studio/apps/{id}          — suppression logique
 *   POST   /api/studio/apps/{id}/publish  — publier
 *   GET    /api/studio/apps/{id}/published — version publiée (runtime)
 *
 * Tous les endpoints nécessitent le rôle CONNECT_ADMIN.
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/studio")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Studio — Applications", description = "Gestion des webapps transactionnelles du Studio IA.")
public class StudioController {

    private final StudioAppService studioAppService;

    // -------------------------------------------------------------------------
    // GET /api/studio/apps?q=
    // -------------------------------------------------------------------------

    @Operation(summary = "Lister les applications Studio.")
    @GetMapping("/apps")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<AppListItem>> listApps(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(value = "q", required = false) String q) {

        List<AppListItem> apps = studioAppService.listApps(q);
        return ResponseEntity.ok(apps);
    }

    // -------------------------------------------------------------------------
    // POST /api/studio/apps
    // -------------------------------------------------------------------------

    @Operation(summary = "Créer une nouvelle application Studio.")
    @PostMapping("/apps")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<?> createApp(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody CreateAppRequest req) {

        if (req.getName() == null || req.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(errorBody("INVALID_REQUEST", "Le nom est obligatoire.", null));
        }

        DraftResponse draft = studioAppService.createApp(req, authUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(draft);
    }

    // -------------------------------------------------------------------------
    // GET /api/studio/apps/{id}/draft
    // -------------------------------------------------------------------------

    @Operation(summary = "Lire le brouillon courant d'une application.")
    @GetMapping("/apps/{id}/draft")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<?> getDraft(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("id") UUID id) {

        try {
            return ResponseEntity.ok(studioAppService.getDraft(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/studio/apps/{id}/draft
    // -------------------------------------------------------------------------

    @Operation(summary = "Sauvegarder le brouillon (verrou optimiste).")
    @PutMapping("/apps/{id}/draft")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<?> saveDraft(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("id") UUID id,
            @RequestBody SaveDraftRequest req) {

        try {
            DraftResponse saved = studioAppService.saveDraft(id, req, authUser.getId());
            return ResponseEntity.ok(saved);
        } catch (OptimisticLockException e) {
            // Récupérer la version courante pour informer le client
            int currentVersion = extractCurrentVersion(e.getMessage());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("error", "VERSION_CONFLICT");
            body.put("currentVersion", currentVersion);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/studio/apps/{id}
    // -------------------------------------------------------------------------

    @Operation(summary = "Supprimer une application Studio (suppression logique).")
    @DeleteMapping("/apps/{id}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteApp(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("id") UUID id) {

        try {
            studioAppService.deleteApp(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/studio/apps/{id}/publish
    // -------------------------------------------------------------------------

    @Operation(summary = "Publier le brouillon courant d'une application.")
    @PostMapping("/apps/{id}/publish")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<?> publishApp(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("id") UUID id) {

        try {
            DraftResponse published = studioAppService.publishApp(id, authUser.getId());
            return ResponseEntity.ok(published);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/studio/apps/{id}/published
    // -------------------------------------------------------------------------

    @Operation(summary = "Lire la version publiée d'une application (runtime).")
    @GetMapping("/apps/{id}/published")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<?> getPublished(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("id") UUID id) {

        try {
            return ResponseEntity.ok(studioAppService.getPublished(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -------------------------------------------------------------------------
    // Helpers privés
    // -------------------------------------------------------------------------

    private Map<String, Object> errorBody(String code, String message, Integer currentVersion) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", code);
        body.put("message", message);
        if (currentVersion != null) {
            body.put("currentVersion", currentVersion);
        }
        return body;
    }

    /**
     * Extrait la version courante depuis le message d'exception OptimisticLockException.
     * Format attendu : "Conflit de version — version courante : N"
     */
    private int extractCurrentVersion(String message) {
        if (message == null) return -1;
        try {
            String[] parts = message.split(":");
            if (parts.length >= 2) {
                return Integer.parseInt(parts[parts.length - 1].trim());
            }
        } catch (NumberFormatException ignored) {
            // intentionally ignored
        }
        return -1;
    }
}
