package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CatalogGlossaryTerm;
import io.movetodata.catalog.library.models.CatalogProductView;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogGlossaryTermRepository;
import io.movetodata.catalog.library.repository.CatalogProductViewRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Glossaire métier + tracking des consultations de DataProducts.
 *
 *   GET    /api/catalog/glossary               — list all terms
 *   GET    /api/catalog/glossary?domain=X      — filter by domain
 *   POST   /api/catalog/glossary               — create term
 *   PUT    /api/catalog/glossary/{id}          — update term
 *   DELETE /api/catalog/glossary/{id}          — delete term
 *
 *   POST   /api/catalog/data-products/{name}/view  — record a page view
 */
@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Data Catalog — Glossaire", description = "Business glossary and view tracking.")
public class CatalogGlossaryController {

    private final CatalogGlossaryTermRepository glossaryRepository;
    private final CatalogProductViewRepository  viewRepository;
    private final DataProductRepository         dataProductRepository;

    // =========================================================================
    // Glossaire
    // =========================================================================

    @Operation(summary = "List all glossary terms (optionally filtered by domain).")
    @GetMapping("/api/catalog/glossary")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<CatalogGlossaryTerm>> listTerms(
            @RequestParam(value = "domain", required = false) String domain) {

        if (domain != null && !domain.isBlank()) {
            return ResponseEntity.ok(glossaryRepository.findByDomainOrderByTermAsc(domain));
        }
        return ResponseEntity.ok(glossaryRepository.findAllByOrderByTermAsc());
    }

    @Operation(summary = "Create a glossary term.")
    @PostMapping("/api/catalog/glossary")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogGlossaryTerm> createTerm(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        String term = body.getOrDefault("term", "").toString().trim();
        String definition = body.getOrDefault("definition", "").toString().trim();
        if (term.isEmpty() || definition.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        CatalogGlossaryTerm gt = CatalogGlossaryTerm.builder()
                .id(UUID.randomUUID().toString())
                .term(term)
                .definition(definition)
                .domain(body.containsKey("domain") && body.get("domain") != null
                        ? body.get("domain").toString() : null)
                .synonyms(body.containsKey("synonyms") && body.get("synonyms") != null
                        ? body.get("synonyms").toString() : null)
                .createdBy(authUser.getId())
                .build();

        CatalogGlossaryTerm saved = glossaryRepository.save(gt);
        log.info("glossary-term created: id={} term={}", saved.getId(), saved.getTerm());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @Operation(summary = "Update a glossary term.")
    @PutMapping("/api/catalog/glossary/{id}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<CatalogGlossaryTerm> updateTerm(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {

        Optional<CatalogGlossaryTerm> opt = glossaryRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        CatalogGlossaryTerm gt = opt.get();
        if (body.containsKey("term") && body.get("term") != null)
            gt.setTerm(body.get("term").toString().trim());
        if (body.containsKey("definition") && body.get("definition") != null)
            gt.setDefinition(body.get("definition").toString().trim());
        if (body.containsKey("domain"))
            gt.setDomain(body.get("domain") != null ? body.get("domain").toString() : null);
        if (body.containsKey("synonyms"))
            gt.setSynonyms(body.get("synonyms") != null ? body.get("synonyms").toString() : null);

        return ResponseEntity.ok(glossaryRepository.save(gt));
    }

    @Operation(summary = "Delete a glossary term.")
    @DeleteMapping("/api/catalog/glossary/{id}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteTerm(@PathVariable("id") String id) {
        Optional<CatalogGlossaryTerm> opt = glossaryRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        glossaryRepository.delete(opt.get());
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // View tracking
    // =========================================================================

    @Operation(summary = "Record a DataProduct page view (for usage_score).")
    @PostMapping("/api/catalog/data-products/{name}/view")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> recordView(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("name") String name) {

        Optional<DataProduct> dp = dataProductRepository.findByName(name);
        if (dp.isEmpty()) return ResponseEntity.notFound().build();

        CatalogProductView view = CatalogProductView.builder()
                .id(UUID.randomUUID().toString())
                .dataProductId(dp.get().getId())
                .viewerId(authUser.getId())
                .viewedAt(Instant.now())
                .build();
        viewRepository.save(view);
        return ResponseEntity.ok().build();
    }
}
