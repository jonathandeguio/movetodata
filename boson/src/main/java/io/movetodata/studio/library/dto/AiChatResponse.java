package io.movetodata.studio.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * Réponse de l'assistant IA Studio.
 *
 * {@code explanation} — Explication en langage naturel de ce qui a été fait.
 * {@code patch}       — Tableau de PatchOp sérialisés en Map (à dispatcher via applyOps côté front).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {

    private String explanation;
    private List<Map<String, Object>> patch;
}
