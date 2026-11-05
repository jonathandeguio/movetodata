package io.movetodata.catalog.library.models;

import lombok.*;

import javax.persistence.*;
import java.io.Serializable;
import java.util.UUID;

/**
 * Join table between a glossary term and a Data Product name.
 * Allows cross-referencing terms with the data products they describe.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "catalog_glossary_data_product")
@IdClass(CatalogGlossaryDataProduct.PK.class)
public class CatalogGlossaryDataProduct {

    @Id
    @Column(name = "glossary_term_id", columnDefinition = "uuid", nullable = false)
    private UUID glossaryTermId;

    @Id
    @Column(name = "data_product_name", nullable = false, length = 255)
    private String dataProductName;

    // -------------------------------------------------------------------------
    // Composite primary key
    // -------------------------------------------------------------------------

    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class PK implements Serializable {
        private UUID glossaryTermId;
        private String dataProductName;
    }
}
