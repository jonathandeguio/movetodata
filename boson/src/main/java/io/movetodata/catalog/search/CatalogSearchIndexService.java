package io.movetodata.catalog.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.catalog.library.dto.CatalogSearchResponse;
import io.movetodata.catalog.library.dto.CatalogSearchResponse.CatalogFacets;
import io.movetodata.catalog.library.dto.DataProductSummary;
import io.movetodata.catalog.library.models.DataProduct;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.catalog.library.repository.DomainRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.action.delete.DeleteRequest;
import org.opensearch.action.index.IndexRequest;
import org.opensearch.action.search.SearchRequest;
import org.opensearch.action.search.SearchResponse;
import org.opensearch.client.RequestOptions;
import org.opensearch.client.RestHighLevelClient;
import org.opensearch.client.core.MainResponse;
import org.opensearch.client.indices.CreateIndexRequest;
import org.opensearch.client.indices.GetIndexRequest;
import org.opensearch.common.xcontent.XContentType;
import org.opensearch.index.query.BoolQueryBuilder;
import org.opensearch.index.query.QueryBuilders;
import org.opensearch.search.aggregations.AggregationBuilders;
import org.opensearch.search.aggregations.bucket.terms.Terms;
import org.opensearch.search.builder.SearchSourceBuilder;
import org.opensearch.search.sort.SortOrder;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service d'indexation et de recherche full-text via OpenSearch.
 * Fallback transparent vers la recherche SQL si OpenSearch est indisponible.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogSearchIndexService {

    static final String INDEX_NAME = "catalog_data_products";

    private final RestHighLevelClient openSearchClient;
    private final DataProductRepository dataProductRepository;
    private final DomainRepository domainRepository;
    private final ObjectMapper objectMapper;

    private volatile boolean openSearchAvailable = false;

    // -------------------------------------------------------------------------
    // Initialisation
    // -------------------------------------------------------------------------

    @PostConstruct
    public void init() {
        try {
            MainResponse response = openSearchClient.info(RequestOptions.DEFAULT);
            log.info("OpenSearch reachable — cluster: {}, version: {}",
                    response.getClusterName(), response.getVersion().getNumber());
            openSearchAvailable = true;
            ensureIndexExists();
        } catch (Exception e) {
            log.warn("OpenSearch not available at startup — search will use SQL fallback. Reason: {}", e.getMessage());
            openSearchAvailable = false;
        }
    }

    public boolean isOpenSearchAvailable() {
        return openSearchAvailable;
    }

    // -------------------------------------------------------------------------
    // Indexation
    // -------------------------------------------------------------------------

    /**
     * Indexe ou réindexe un Data Product.
     * Idempotent — utilise l'upsert (index avec l'id du document = nom du produit).
     */
    public void indexDataProduct(DataProduct dp) {
        if (!openSearchAvailable) {
            return;
        }
        try {
            String domainName = resolveDomainName(dp.getDomainId());
            Map<String, Object> doc = buildDocument(dp, domainName);
            String json = objectMapper.writeValueAsString(doc);

            IndexRequest request = new IndexRequest(INDEX_NAME)
                    .id(dp.getName())
                    .source(json, XContentType.JSON);
            openSearchClient.index(request, RequestOptions.DEFAULT);
        } catch (Exception e) {
            log.warn("OpenSearch indexDataProduct failed for '{}': {}", dp.getName(), e.getMessage());
        }
    }

    /**
     * Supprime un Data Product de l'index.
     */
    public void deleteFromIndex(String name) {
        if (!openSearchAvailable) {
            return;
        }
        try {
            DeleteRequest request = new DeleteRequest(INDEX_NAME, name);
            openSearchClient.delete(request, RequestOptions.DEFAULT);
        } catch (Exception e) {
            log.warn("OpenSearch deleteFromIndex failed for '{}': {}", name, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Recherche
    // -------------------------------------------------------------------------

    /**
     * Recherche full-text avec facettes.
     * Délègue à OpenSearch si disponible, sinon SQL fallback.
     */
    public CatalogSearchResponse search(CatalogSearchRequest req) {
        if (openSearchAvailable) {
            try {
                return searchViaOpenSearch(req);
            } catch (Exception e) {
                log.warn("OpenSearch search failed — falling back to SQL. Reason: {}", e.getMessage());
            }
        }
        return searchViaSql(req);
    }

    // -------------------------------------------------------------------------
    // OpenSearch search
    // -------------------------------------------------------------------------

    private CatalogSearchResponse searchViaOpenSearch(CatalogSearchRequest req) throws IOException {
        SearchSourceBuilder source = new SearchSourceBuilder();

        // --- Query ---
        BoolQueryBuilder bool = QueryBuilders.boolQuery();

        if (req.getQ() != null && !req.getQ().isBlank()) {
            bool.must(QueryBuilders.multiMatchQuery(req.getQ(), "name^3", "displayName^2", "description", "tags", "domainName"));
        } else {
            bool.must(QueryBuilders.matchAllQuery());
        }

        // Filters
        if (req.getQualityLevels() != null && !req.getQualityLevels().isEmpty()) {
            bool.filter(QueryBuilders.termsQuery("qualityLevel", req.getQualityLevels()));
        }
        if (req.getAccessPolicies() != null && !req.getAccessPolicies().isEmpty()) {
            bool.filter(QueryBuilders.termsQuery("accessPolicy", req.getAccessPolicies()));
        }
        if (req.getDomainIds() != null && !req.getDomainIds().isEmpty()) {
            bool.filter(QueryBuilders.termsQuery("domainId", req.getDomainIds()));
        }
        if (req.getSourceTypes() != null && !req.getSourceTypes().isEmpty()) {
            bool.filter(QueryBuilders.termsQuery("sourceType", req.getSourceTypes()));
        }

        source.query(bool);

        // --- Tri ---
        String sort = req.getSort() != null ? req.getSort() : "RELEVANCE";
        switch (sort) {
            case "TRUST_SCORE":
                source.sort("trustScore", SortOrder.DESC);
                break;
            case "UPDATED_AT":
                source.sort("updatedAt", SortOrder.DESC);
                break;
            case "POPULARITY":
                source.sort("viewCount", SortOrder.DESC);
                break;
            default:
                break; // RELEVANCE = score OpenSearch
        }

        // --- Pagination ---
        int page = req.getPage() > 0 ? req.getPage() : 1;
        int size = req.getSize() > 0 ? req.getSize() : 20;
        source.from((page - 1) * size).size(size);

        // --- Facettes ---
        source.aggregation(AggregationBuilders.terms("by_quality").field("qualityLevel").size(10));
        source.aggregation(AggregationBuilders.terms("by_access").field("accessPolicy").size(10));
        source.aggregation(AggregationBuilders.terms("by_domain").field("domainName").size(50));
        source.aggregation(AggregationBuilders.terms("by_source").field("sourceType").size(50));

        SearchRequest searchRequest = new SearchRequest(INDEX_NAME);
        searchRequest.source(source);
        SearchResponse response = openSearchClient.search(searchRequest, RequestOptions.DEFAULT);

        // --- Résultats ---
        List<DataProductSummary> items = new ArrayList<>();
        for (var hit : response.getHits().getHits()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> src = (Map<String, Object>) hit.getSourceAsMap();
            items.add(mapHitToSummary(src));
        }

        // --- Facettes ---
        Map<String, Long> byQuality = extractAgg(response, "by_quality");
        Map<String, Long> byAccess  = extractAgg(response, "by_access");
        Map<String, Long> byDomain  = extractAgg(response, "by_domain");
        Map<String, Long> bySource  = extractAgg(response, "by_source");

        return CatalogSearchResponse.builder()
                .items(items)
                .total((int) response.getHits().getTotalHits().value)
                .facets(CatalogFacets.builder()
                        .qualityLevel(byQuality)
                        .accessPolicy(byAccess)
                        .domainName(byDomain)
                        .sourceType(bySource)
                        .build())
                .build();
    }

    // -------------------------------------------------------------------------
    // SQL fallback search
    // -------------------------------------------------------------------------

    private CatalogSearchResponse searchViaSql(CatalogSearchRequest req) {
        List<DataProduct> all = req.getQ() != null && !req.getQ().isBlank()
                ? dataProductRepository.search(req.getQ().trim())
                : dataProductRepository.findAll();

        // Filters
        if (req.getQualityLevels() != null && !req.getQualityLevels().isEmpty()) {
            final List<String> ql = req.getQualityLevels();
            all = all.stream().filter(dp -> ql.contains(dp.getQualityLevel())).collect(Collectors.toList());
        }
        if (req.getAccessPolicies() != null && !req.getAccessPolicies().isEmpty()) {
            final List<String> ap = req.getAccessPolicies();
            all = all.stream().filter(dp -> ap.contains(dp.getAccessPolicy())).collect(Collectors.toList());
        }
        if (req.getDomainIds() != null && !req.getDomainIds().isEmpty()) {
            final List<String> di = req.getDomainIds();
            all = all.stream().filter(dp -> di.contains(dp.getDomainId())).collect(Collectors.toList());
        }
        if (req.getSourceTypes() != null && !req.getSourceTypes().isEmpty()) {
            final List<String> st = req.getSourceTypes();
            all = all.stream().filter(dp -> st.contains(dp.getSourceType())).collect(Collectors.toList());
        }

        // Tri
        String sort = req.getSort() != null ? req.getSort() : "RELEVANCE";
        switch (sort) {
            case "TRUST_SCORE":
                all.sort(Comparator.comparingDouble(
                    dp -> dp.getTrustScore() != null ? -dp.getTrustScore().doubleValue() : 0.0));
                break;
            case "UPDATED_AT":
                all.sort(Comparator.comparing(
                    dp -> dp.getUpdatedAt() != null ? dp.getUpdatedAt() : java.time.Instant.EPOCH,
                    Comparator.reverseOrder()));
                break;
            case "POPULARITY":
                all.sort(Comparator.comparingLong(
                    dp -> dp.getViewCount() != null ? -dp.getViewCount() : 0L));
                break;
            default:
                break; // RELEVANCE — conserver l'ordre SQL
        }

        // Facettes sur l'ensemble filtré (avant pagination)
        Map<String, Long> byQuality = all.stream()
                .filter(dp -> dp.getQualityLevel() != null)
                .collect(Collectors.groupingBy(DataProduct::getQualityLevel, Collectors.counting()));
        Map<String, Long> byAccess = all.stream()
                .filter(dp -> dp.getAccessPolicy() != null)
                .collect(Collectors.groupingBy(DataProduct::getAccessPolicy, Collectors.counting()));
        Map<String, Long> bySource = all.stream()
                .filter(dp -> dp.getSourceType() != null)
                .collect(Collectors.groupingBy(DataProduct::getSourceType, Collectors.counting()));

        // Domaines : résolution du nom
        Map<String, Long> byDomain = new LinkedHashMap<>();
        all.stream()
           .filter(dp -> dp.getDomainId() != null)
           .collect(Collectors.groupingBy(DataProduct::getDomainId, Collectors.counting()))
           .forEach((domainId, count) -> {
               String dName = resolveDomainName(domainId);
               byDomain.merge(dName != null ? dName : domainId, count, Long::sum);
           });

        int total = all.size();

        // Pagination
        int page = req.getPage() > 0 ? req.getPage() : 1;
        int size = req.getSize() > 0 ? req.getSize() : 20;
        int from = Math.min((page - 1) * size, total);
        int to   = Math.min(from + size, total);
        List<DataProduct> paged = all.subList(from, to);

        // Conversion en DataProductSummary
        List<DataProductSummary> items = paged.stream()
                .map(dp -> DataProductSummary.from(
                        dp,
                        resolveDomainName(dp.getDomainId()),
                        null, // ownerName : non chargé dans le fallback SQL (non bloquant)
                        false,
                        false,
                        dp.getTrustScore() != null && dp.getTrustScore().intValue() < 60))
                .collect(Collectors.toList());

        return CatalogSearchResponse.builder()
                .items(items)
                .total(total)
                .facets(CatalogFacets.builder()
                        .qualityLevel(byQuality)
                        .accessPolicy(byAccess)
                        .domainName(byDomain)
                        .sourceType(bySource)
                        .build())
                .build();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void ensureIndexExists() {
        try {
            boolean exists = openSearchClient
                    .indices()
                    .exists(new GetIndexRequest(INDEX_NAME), RequestOptions.DEFAULT);
            if (!exists) {
                CreateIndexRequest create = new CreateIndexRequest(INDEX_NAME);
                create.source(buildIndexMappings(), XContentType.JSON);
                openSearchClient.indices().create(create, RequestOptions.DEFAULT);
                log.info("OpenSearch index '{}' created.", INDEX_NAME);
            }
        } catch (Exception e) {
            log.warn("Could not create OpenSearch index: {}", e.getMessage());
        }
    }

    private String buildIndexMappings() {
        return "{"
            + "\"mappings\":{"
            + "\"properties\":{"
            + "\"name\":{\"type\":\"text\",\"fields\":{\"keyword\":{\"type\":\"keyword\"}}},"
            + "\"displayName\":{\"type\":\"text\"},"
            + "\"description\":{\"type\":\"text\"},"
            + "\"tags\":{\"type\":\"text\",\"fields\":{\"keyword\":{\"type\":\"keyword\"}}},"
            + "\"domainName\":{\"type\":\"keyword\"},"
            + "\"domainId\":{\"type\":\"keyword\"},"
            + "\"qualityLevel\":{\"type\":\"keyword\"},"
            + "\"accessPolicy\":{\"type\":\"keyword\"},"
            + "\"sourceType\":{\"type\":\"keyword\"},"
            + "\"trustScore\":{\"type\":\"float\"},"
            + "\"viewCount\":{\"type\":\"long\"},"
            + "\"updatedAt\":{\"type\":\"date\"}"
            + "}}}";
    }

    private Map<String, Object> buildDocument(DataProduct dp, String domainName) {
        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("name",         dp.getName());
        doc.put("displayName",  dp.getDisplayName());
        doc.put("description",  dp.getDescription());
        doc.put("domainName",   domainName);
        doc.put("domainId",     dp.getDomainId());
        doc.put("qualityLevel", dp.getQualityLevel());
        doc.put("accessPolicy", dp.getAccessPolicy());
        doc.put("sourceType",   dp.getSourceType());
        doc.put("trustScore",   dp.getTrustScore() != null ? dp.getTrustScore().floatValue() : null);
        doc.put("viewCount",    dp.getViewCount() != null ? dp.getViewCount() : 0L);
        doc.put("updatedAt",    dp.getUpdatedAt() != null ? dp.getUpdatedAt().toString() : null);
        doc.put("tags",         List.of());
        return doc;
    }

    private DataProductSummary mapHitToSummary(Map<String, Object> src) {
        Object tsObj = src.get("trustScore");
        Integer trustScore = tsObj != null
                ? (int) (Double.parseDouble(tsObj.toString()) * 100)
                : null;
        Object vcObj = src.get("viewCount");
        long viewCount = vcObj != null ? Long.parseLong(vcObj.toString()) : 0L;

        return DataProductSummary.builder()
                .name(str(src, "name"))
                .fqn(str(src, "name"))
                .displayName(str(src, "displayName"))
                .description(str(src, "description"))
                .qualityLevel(str(src, "qualityLevel"))
                .accessPolicy(str(src, "accessPolicy"))
                .hasPii(false)
                .domainName(str(src, "domainName"))
                .domainId(str(src, "domainId"))
                .sourceType(str(src, "sourceType"))
                .tags(List.of())
                .trustScore(trustScore)
                .ownerName(null)
                .updatedAt(null)
                .viewCount(viewCount)
                .driftAlert(false)
                .trustLowAlert(trustScore != null && trustScore < 60)
                .build();
    }

    private Map<String, Long> extractAgg(SearchResponse response, String aggName) {
        Map<String, Long> result = new LinkedHashMap<>();
        try {
            Terms terms = response.getAggregations().get(aggName);
            if (terms != null) {
                for (Terms.Bucket bucket : terms.getBuckets()) {
                    result.put(bucket.getKeyAsString(), bucket.getDocCount());
                }
            }
        } catch (Exception e) {
            log.debug("extractAgg '{}' failed: {}", aggName, e.getMessage());
        }
        return result;
    }

    private String resolveDomainName(String domainId) {
        if (domainId == null) return null;
        try {
            return domainRepository.findById(domainId)
                    .map(d -> d.getName())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private static String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }
}
