package io.movetodata.catalog.library.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * Réponse paginée de l'endpoint GET /api/catalog/data-products.
 * Contient les résultats + les facettes pour les filtres UI.
 */
@Getter
@Builder
public class CatalogSearchResponse {

    private List<DataProductSummary> items;
    private int total;
    private CatalogFacets facets;

    @Getter
    @Builder
    public static class CatalogFacets {
        /** Nombre de produits par niveau de qualité : GOLD, SILVER, BRONZE. */
        private Map<String, Long> qualityLevel;
        /** Nombre de produits par politique d'accès : PUBLIC, INTERNAL, RESTRICTED. */
        private Map<String, Long> accessPolicy;
        /** Nombre de produits par nom de domaine. */
        private Map<String, Long> domainName;
        /** Nombre de produits par type de source. */
        private Map<String, Long> sourceType;
    }
}
