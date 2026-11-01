package io.movetodata.studio.library.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Élément renvoyé par GET /api/studio/apps.
 *
 * {@code nodeCount} : nombre de nœuds dans la définition JSON du brouillon courant
 * (0 si aucun brouillon ou définition null).
 */
@Data
@Builder
public class AppListItem {

    private UUID    id;
    private String  name;
    /** DRAFT ou PUBLISHED */
    private String  status;
    private UUID    datasourceId;
    private int     nodeCount;
    private Instant updatedAt;
}
