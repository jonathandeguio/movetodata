package io.movetodata.studio.library.dto;

import lombok.Data;

/**
 * Corps de la requête PUT /api/studio/apps/{id}/draft.
 *
 * {@code expectedVersion} implémente le verrou optimiste :
 * si la version courante en base est différente, un 409 Conflict est renvoyé.
 */
@Data
public class SaveDraftRequest {

    /** Définition JSON à persister (AppDefinition sérialisée). */
    private String definition;

    /**
     * Version que le client pense être la version courante.
     * Doit correspondre à la version du brouillon actuel en base.
     */
    private int expectedVersion;
}
