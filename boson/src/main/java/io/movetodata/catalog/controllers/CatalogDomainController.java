package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.Domain;
import io.movetodata.catalog.library.repository.DomainRepository;
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
import java.util.Optional;
import java.util.UUID;

/**
 * CRUD controller for catalog business domains.
 *
 * All endpoints require CONNECT_ADMIN role.
 * No service layer — direct repository access following established project patterns.
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/catalog/domains")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Domains", description = "Manage business domains in the native Data Catalog.")
public class CatalogDomainController {

    private final DomainRepository domainRepository;

    // -------------------------------------------------------------------------
    // GET /api/catalog/domains — list all domains
    // -------------------------------------------------------------------------

    @Operation(summary = "List all catalog domains.")
    @GetMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<Domain>> listDomains(
            @AuthenticationPrincipal AuthUser authUser) {

        return ResponseEntity.ok(domainRepository.findAll());
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/domains/{name} — get one domain by name
    // -------------------------------------------------------------------------

    @Operation(summary = "Get a catalog domain by name.")
    @GetMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Domain> getDomain(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        return domainRepository.findByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // POST /api/catalog/domains — create a domain
    // -------------------------------------------------------------------------

    @Operation(summary = "Create a new catalog domain.")
    @PostMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Domain> createDomain(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        String name = body.getOrDefault("name", "").toString().trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Domain domain = Domain.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .description(body.containsKey("description")
                        ? body.get("description") != null ? body.get("description").toString() : null
                        : null)
                .color(body.containsKey("color")
                        ? body.get("color") != null ? body.get("color").toString() : null
                        : null)
                .createdBy(authUser.getId())
                .build();

        Domain saved = domainRepository.save(domain);
        log.info("Catalog domain created: id={} name={} by user={}", saved.getId(), saved.getName(), authUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // -------------------------------------------------------------------------
    // PUT /api/catalog/domains/{name} — update a domain
    // -------------------------------------------------------------------------

    @Operation(summary = "Update an existing catalog domain.")
    @PutMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Domain> updateDomain(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name,
            @RequestBody Map<String, Object> body) {

        return domainRepository.findByName(name)
                .map(existing -> {
                    if (body.containsKey("name")) {
                        String newName = body.get("name") != null ? body.get("name").toString().trim() : "";
                        if (!newName.isEmpty()) {
                            existing.setName(newName);
                        }
                    }
                    if (body.containsKey("description")) {
                        existing.setDescription(
                                body.get("description") != null ? body.get("description").toString() : null);
                    }
                    if (body.containsKey("color")) {
                        existing.setColor(
                                body.get("color") != null ? body.get("color").toString() : null);
                    }
                    Domain updated = domainRepository.save(existing);
                    log.info("Catalog domain updated: id={} by user={}", updated.getId(), authUser.getId());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/catalog/domains/{name} — delete a domain
    // -------------------------------------------------------------------------

    @Operation(summary = "Delete a catalog domain.")
    @DeleteMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteDomain(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<Domain> opt = domainRepository.findByName(name);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        domainRepository.delete(opt.get());
        log.info("Catalog domain deleted: name={} by user={}", name, authUser.getId());
        return ResponseEntity.noContent().build();
    }
}
