package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.Domain;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.library.repository.DomainRepository;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.library.repository.UserRepository;
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

import java.util.*;

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
    private final DataProductRepository dataProductRepository;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // GET /api/catalog/domains — list all domains with enriched metadata
    // -------------------------------------------------------------------------

    @Operation(summary = "List all catalog domains with owner/steward names and product counts.")
    @GetMapping
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<Map<String, Object>>> listDomains(
            @AuthenticationPrincipal AuthUser authUser) {

        List<Domain> domains = domainRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Domain d : domains) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", d.getId());
            dto.put("name", d.getName());
            dto.put("description", d.getDescription());
            dto.put("color", d.getColor());
            dto.put("ownerId", d.getOwnerId() != null ? d.getOwnerId().toString() : null);
            dto.put("stewardId", d.getStewardId() != null ? d.getStewardId().toString() : null);
            dto.put("defaultAccessPolicy", d.getDefaultAccessPolicy());
            dto.put("createdAt", d.getCreatedAt());
            dto.put("updatedAt", d.getUpdatedAt());

            // Résoudre les noms owner/steward
            dto.put("ownerName", resolveUserName(d.getOwnerId()));
            dto.put("stewardName", resolveUserName(d.getStewardId()));

            // Nombre de Data Products associés
            long productCount = dataProductRepository.findByDomainIdOrderByCreatedAtDesc(d.getId()).size();
            dto.put("dataProductCount", productCount);

            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // GET /api/catalog/domains/{name} — get one domain by name
    // -------------------------------------------------------------------------

    @Operation(summary = "Get a catalog domain by name.")
    @GetMapping("/{name}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Map<String, Object>> getDomain(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        return domainRepository.findByName(name)
                .map(d -> {
                    Map<String, Object> dto = buildDomainDto(d);
                    return ResponseEntity.ok(dto);
                })
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
                .ownerId(parseUuid(body.get("ownerId")))
                .stewardId(parseUuid(body.get("stewardId")))
                .defaultAccessPolicy(body.containsKey("defaultAccessPolicy") && body.get("defaultAccessPolicy") != null
                        ? body.get("defaultAccessPolicy").toString() : "INTERNAL")
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
                    if (body.containsKey("ownerId")) {
                        existing.setOwnerId(parseUuid(body.get("ownerId")));
                    }
                    if (body.containsKey("stewardId")) {
                        existing.setStewardId(parseUuid(body.get("stewardId")));
                    }
                    if (body.containsKey("defaultAccessPolicy")) {
                        existing.setDefaultAccessPolicy(
                                body.get("defaultAccessPolicy") != null
                                        ? body.get("defaultAccessPolicy").toString() : null);
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

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Map<String, Object> buildDomainDto(Domain d) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", d.getId());
        dto.put("name", d.getName());
        dto.put("description", d.getDescription());
        dto.put("color", d.getColor());
        dto.put("ownerId", d.getOwnerId() != null ? d.getOwnerId().toString() : null);
        dto.put("stewardId", d.getStewardId() != null ? d.getStewardId().toString() : null);
        dto.put("defaultAccessPolicy", d.getDefaultAccessPolicy());
        dto.put("ownerName", resolveUserName(d.getOwnerId()));
        dto.put("stewardName", resolveUserName(d.getStewardId()));
        dto.put("dataProductCount", dataProductRepository.findByDomainIdOrderByCreatedAtDesc(d.getId()).size());
        dto.put("createdAt", d.getCreatedAt());
        dto.put("updatedAt", d.getUpdatedAt());
        return dto;
    }

    /** Resolve the display name of a user by UUID. Returns null if not found. */
    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> u.getName() != null ? u.getName() : u.getUsername())
                .orElse(null);
    }

    /** Parse a UUID from an Object (String or null). Returns null if blank or invalid. */
    private static UUID parseUuid(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        if (s.isEmpty()) return null;
        try {
            return UUID.fromString(s);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
