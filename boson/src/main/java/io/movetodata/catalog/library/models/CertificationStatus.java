package io.movetodata.catalog.library.models;

/** Statut d'une demande de certification dans le workflow. */
public enum CertificationStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CORRECTION_REQUESTED
}
