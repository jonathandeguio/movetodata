package io.movetodata.studio.library.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Corps de la requête POST /api/studio/apps.
 *
 * {@code definition} est optionnel : s'il est null, le service génère
 * une définition vide standard (stack racine sans enfant).
 */
@Data
public class CreateAppRequest {

    /** Nom de l'application (obligatoire). */
    private String name;

    /** Identifiant de la connexion Data Platform (connect_sources.id). */
    private UUID datasourceId;

    /**
     * Définition initiale JSON (AppDefinition sérialisée).
     * Null = le service génère une définition par défaut.
     */
    private String definition;
}
