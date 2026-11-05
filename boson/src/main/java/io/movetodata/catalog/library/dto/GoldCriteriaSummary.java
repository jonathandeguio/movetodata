package io.movetodata.catalog.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Résumé de l'évaluation des critères obligatoires pour la certification Gold.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoldCriteriaSummary {

    private List<CriterionCheck> criteria;

    private int passedCount;

    private int totalCount;

    /** Vrai si tous les critères sont remplis (passedCount == totalCount). */
    private boolean allPassed;

    /**
     * Vrai si l'utilisateur authentifié est CATALOG_STEWARD
     * et peut donc reviewer une demande PENDING.
     */
    private boolean canReview;
}
