package io.movetodata.catalog.controllers;

import io.movetodata.catalog.library.models.CatalogGlossaryDataProduct;
import io.movetodata.catalog.library.models.CatalogGlossaryTerm;
import io.movetodata.catalog.library.models.CatalogProductView;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.CatalogGlossaryDataProductRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Glossaire métier + tracking des consultations de DataProducts.
 *
 *   GET    /api/catalog/glossary               — list all terms (avec viewCount + Data Products liés)
 *   GET    /api/catalog/glossary?domain=X      — filter by domain
 *   GET    /api/catalog/glossary/{id}          — get one term (incrémente viewCount)
 *   POST   /api/catalog/glossary               — create term
 *   PUT    /api/catalog/glossary/{id}          — update term
 *   DELETE /api/catalog/glossary/{id}          — delete term
 *
 *   POST   /api/catalog/glossary/{id}/link-data-product      — lier un Data Product
 *   DELETE /api/catalog/glossary/{id}/link-data-product/{dp} — délier un Data Product
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

    private final CatalogGlossaryTermRepository       glossaryRepository;
    private final CatalogGlossaryDataProductRepository glossaryDpRepository;
    private final CatalogProductViewRepository         viewRepository;
    private final DataProductRepository                dataProductRepository;

    // =========================================================================
    // Glossaire — CRUD
    // =========================================================================

    @Operation(summary = "List all glossary terms (optionally filtered by domain), with linked Data Products.")
    @GetMapping("/api/catalog/glossary")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<Map<String, Object>>> listTerms(
            @RequestParam(value = "domain", required = false) String domain) {

        List<CatalogGlossaryTerm> terms = (domain != null && !domain.isBlank())
                ? glossaryRepository.findByDomainOrderByTermAsc(domain)
                : glossaryRepository.findAllByOrderByTermAsc();

        List<Map<String, Object>> result = terms.stream()
                .map(this::buildTermDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Get a glossary term by ID and increment its view count.")
    @GetMapping("/api/catalog/glossary/{id}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    @Transactional
    public ResponseEntity<Map<String, Object>> getTerm(@PathVariable("id") String id) {
        Optional<CatalogGlossaryTerm> opt = glossaryRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        CatalogGlossaryTerm gt = opt.get();

        // Incrémenter viewCount
        long current = gt.getViewCount() != null ? gt.getViewCount() : 0L;
        gt.setViewCount(current + 1L);
        glossaryRepository.save(gt);

        return ResponseEntity.ok(buildTermDto(gt));
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
                .viewCount(0L)
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
    @Transactional
    public ResponseEntity<Void> deleteTerm(@PathVariable("id") String id) {
        Optional<CatalogGlossaryTerm> opt = glossaryRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        // Supprimer les liens Data Products
        List<CatalogGlossaryDataProduct> links =
                glossaryDpRepository.findByGlossaryTermId(UUID.fromString(id));
        glossaryDpRepository.deleteAll(links);

        glossaryRepository.delete(opt.get());
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Liens Glossaire ↔ Data Products
    // =========================================================================

    @Operation(summary = "Link a glossary term to a Data Product.")
    @PostMapping("/api/catalog/glossary/{id}/link-data-product")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> linkDataProduct(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {

        String dataProductName = body.containsKey("dataProductName") && body.get("dataProductName") != null
                ? body.get("dataProductName").toString().trim() : "";

        if (dataProductName.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (glossaryRepository.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (dataProductRepository.findByName(dataProductName).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UUID termId = UUID.fromString(id);
        if (!glossaryDpRepository.existsByGlossaryTermIdAndDataProductName(termId, dataProductName)) {
            CatalogGlossaryDataProduct link = CatalogGlossaryDataProduct.builder()
                    .glossaryTermId(termId)
                    .dataProductName(dataProductName)
                    .build();
            glossaryDpRepository.save(link);
            log.info("glossary-dp link created: termId={} dp={}", id, dataProductName);
        }

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Unlink a glossary term from a Data Product.")
    @DeleteMapping("/api/catalog/glossary/{id}/link-data-product/{dataProductName}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    @Transactional
    public ResponseEntity<Void> unlinkDataProduct(
            @PathVariable("id") String id,
            @PathVariable("dataProductName") String dataProductName) {

        if (glossaryRepository.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UUID termId = UUID.fromString(id);
        glossaryDpRepository.deleteByGlossaryTermIdAndDataProductName(termId, dataProductName);
        log.info("glossary-dp link removed: termId={} dp={}", id, dataProductName);
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

    // =========================================================================
    // Helper
    // =========================================================================

    private Map<String, Object> buildTermDto(CatalogGlossaryTerm gt) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", gt.getId());
        dto.put("term", gt.getTerm());
        dto.put("definition", gt.getDefinition());
        dto.put("domain", gt.getDomain());
        dto.put("synonyms", gt.getSynonyms());
        dto.put("viewCount", gt.getViewCount() != null ? gt.getViewCount() : 0L);
        dto.put("createdAt", gt.getCreatedAt());
        dto.put("updatedAt", gt.getUpdatedAt());

        // Data Products liés
        List<String> linkedDps = glossaryDpRepository
                .findByGlossaryTermId(UUID.fromString(gt.getId()))
                .stream()
                .map(CatalogGlossaryDataProduct::getDataProductName)
                .collect(Collectors.toList());
        dto.put("linkedDataProducts", linkedDps);

        return dto;
    }
}
