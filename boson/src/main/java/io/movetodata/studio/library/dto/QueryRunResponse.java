package io.movetodata.studio.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Réponse de l'endpoint POST .../queries/{queryId}/run.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryRunResponse {

    /** Lignes retournées (requêtes read). Vide pour les write. */
    private List<Map<String, Object>> rows;

    /** Nombre de lignes affectées (requêtes write). 0 pour les read. */
    private int rowsAffected;

    /** Durée d'exécution en millisecondes. */
    private long durationMs;
}
