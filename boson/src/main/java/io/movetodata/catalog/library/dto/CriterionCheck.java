package io.movetodata.catalog.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Résultat de vérification d'un critère Gold individuel.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriterionCheck {

    /** Identifiant technique du critère (ex. "sla_30d"). */
    private String key;

    /** Libellé lisible (en français). */
    private String label;

    /** Vrai si le critère est rempli. */
    private boolean passed;

    /** Explication détaillée (état actuel, valeur mesurée, etc.). */
    private String explanation;

    /**
     * Lien vers la ressource concernée dans le portail
     * (ex. onglet Qualité, onglet Gouvernance). Optionnel.
     */
    private String link;
}
