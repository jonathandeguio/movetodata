package io.movetodata.studio.library.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Réponse renvoyée par GET /api/studio/apps/{id}/draft
 * et GET /api/studio/apps/{id}/published.
 */
@Data
@Builder
public class DraftResponse {

    private UUID    id;
    private UUID    appId;
    private int     version;
    /** Définition JSON de l'application (AppDefinition sérialisée). */
    private String  definition;
    private Instant createdAt;
}
