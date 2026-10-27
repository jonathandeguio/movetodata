package io.movetodata.catalog.library.models;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * A shared business glossary term. Terms are domain-scoped and may carry synonyms
 * (stored as a JSON array string) to allow LLM matching against column names.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_glossary_term")
public class CatalogGlossaryTerm {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private String id;

    @Column(name = "term", nullable = false, unique = true, length = 255)
    private String term;

    @Column(name = "definition", nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "domain", length = 255)
    private String domain;

    /** JSON array of synonym strings, e.g. ["client","customer","acheteur"] */
    @Column(name = "synonyms", columnDefinition = "TEXT")
    private String synonyms;

    @Column(name = "created_by", nullable = false, columnDefinition = "uuid")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
