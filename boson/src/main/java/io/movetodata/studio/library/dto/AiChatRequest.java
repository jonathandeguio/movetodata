package io.movetodata.studio.library.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Requête POST /api/studio/apps/{id}/ai — Chat avec l'assistant IA.
 *
 * {@code prompt}         — Question ou instruction de l'utilisateur.
 * {@code selectedNodeId} — Identifiant du nœud sélectionné dans le canvas (optionnel).
 */
@Getter
@Setter
@NoArgsConstructor
public class AiChatRequest {

    private String prompt;
    private String selectedNodeId;
}
