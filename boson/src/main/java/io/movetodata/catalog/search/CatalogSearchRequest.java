package io.movetodata.catalog.search;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Paramètres de recherche transmis à {@link CatalogSearchIndexService}.
 */
@Getter
@Builder
public class CatalogSearchRequest {
    private String       q;
    private List<String> qualityLevels;
    private List<String> accessPolicies;
    private List<String> domainIds;
    private List<String> sourceTypes;
    /** RELEVANCE | TRUST_SCORE | UPDATED_AT | POPULARITY */
    private String       sort;
    private int          page;
    private int          size;
}
