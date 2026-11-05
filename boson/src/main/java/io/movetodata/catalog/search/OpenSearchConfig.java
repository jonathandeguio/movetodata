package io.movetodata.catalog.search;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.opensearch.client.RestClient;
import org.opensearch.client.RestHighLevelClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

/**
 * Configuration du client OpenSearch.
 * <p>
 * Le bean {@link RestHighLevelClient} est disponible dans le contexte Spring.
 * Si OpenSearch est absent au démarrage, le service {@link CatalogSearchIndexService}
 * détecte l'état via {@link CatalogSearchIndexService#isOpenSearchAvailable()} et
 * bascule automatiquement sur la recherche SQL.
 * <p>
 * Variable d'environnement : {@code OPENSEARCH_URL} (défaut : {@code http://localhost:9200}).
 */
@Slf4j
@Configuration
public class OpenSearchConfig {

    @Value("${OPENSEARCH_URL:http://localhost:9200}")
    private String openSearchUrl;

    @Bean(destroyMethod = "close")
    public RestHighLevelClient openSearchClient() {
        try {
            URI uri = URI.create(openSearchUrl);
            int port = uri.getPort() > 0 ? uri.getPort() : 9200;
            String scheme = uri.getScheme() != null ? uri.getScheme() : "http";
            String host = uri.getHost() != null ? uri.getHost() : "localhost";

            log.info("OpenSearch client configured — {}://{}:{}", scheme, host, port);
            return new RestHighLevelClient(
                    RestClient.builder(new HttpHost(host, port, scheme))
                              .setRequestConfigCallback(rc -> rc
                                      .setConnectTimeout(2_000)
                                      .setSocketTimeout(10_000))
            );
        } catch (Exception e) {
            log.warn("OpenSearch client configuration failed — search will fall back to SQL. Reason: {}", e.getMessage());
            // Retourne un client mal configuré ; le service de recherche le détecte au premier ping.
            return new RestHighLevelClient(
                    RestClient.builder(new HttpHost("localhost", 9200, "http"))
            );
        }
    }
}
