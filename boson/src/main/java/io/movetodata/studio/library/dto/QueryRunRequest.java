package io.movetodata.studio.library.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * Corps de la requête POST .../queries/{queryId}/run.
 */
@Getter
@Setter
@NoArgsConstructor
public class QueryRunRequest {

    /** Paramètres nommés à lier (clé = nom du paramètre, valeur = valeur). */
    private Map<String, Object> params;

    /** "draft" ou "published". */
    private String mode;
}
