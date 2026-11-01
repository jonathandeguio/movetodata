package io.movetodata.studio.library.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Requête POST /api/studio/apps/generate — Génération d'une application via l'IA.
 *
 * {@code name}         — Nom de l'application.
 * {@code description}  — Description en langage naturel de l'application souhaitée.
 * {@code datasourceId} — Identifiant de la connexion Data Platform.
 * {@code tableName}    — Table principale sur laquelle l'app sera construite.
 */
@Getter
@Setter
@NoArgsConstructor
public class GenerateAppRequest {

    private String name;
    private String description;
    private UUID   datasourceId;
    private String tableName;
}
