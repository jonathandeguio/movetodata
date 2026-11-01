package io.movetodata.studio.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Représentation d'un QueryDef extrait de la définition JSON d'une application Studio.
 * Utilisé en interne par {@code StudioSqlValidator} et {@code StudioQueryService}.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryDefDto {

    /** Identifiant de la requête (ex. "q_list"). */
    private String id;

    /** "read" ou "write". */
    private String kind;

    /** SQL avec paramètres nommés :paramName. */
    private String sql;

    /** Noms des paramètres déclarés. */
    private List<String> params;
}
