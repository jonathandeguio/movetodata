package io.movetodata.catalog.library.services;

import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service in-memory pour le suivi de l'état du TrustScoreRefreshJob.
 *
 * Stocke le timestamp du dernier run, le nombre d'alertes envoyées et le statut
 * (OK | FAILED | UNKNOWN). Consulté par CatalogHealthController pour enrichir
 * la réponse GET /api/catalog/health avec les informations de dépendance.
 *
 * L'état est volatile (non persisté) : il redevient UNKNOWN après un redémarrage,
 * ce qui est acceptable car le job est planifié toutes les 6 heures.
 */
@Service
public class CatalogJobStatusService {

    public enum JobStatus { UNKNOWN, OK, FAILED }

    private volatile Instant   lastRunAt    = null;
    private volatile int       lastAlertCount = 0;
    private volatile JobStatus lastStatus   = JobStatus.UNKNOWN;

    /** Appelé au début de chaque exécution. */
    public void recordRunStart() {
        // rien à faire pour l'instant — l'état est mis à jour à la fin
    }

    /** Appelé à la fin d'une exécution réussie. */
    public void recordRunSuccess(int alertCount) {
        this.lastRunAt     = Instant.now();
        this.lastAlertCount = alertCount;
        this.lastStatus    = JobStatus.OK;
    }

    /** Appelé quand le job a levé une exception non rattrapée. */
    public void recordRunFailure() {
        this.lastRunAt  = Instant.now();
        this.lastStatus = JobStatus.FAILED;
    }

    public Instant   getLastRunAt()     { return lastRunAt; }
    public int       getLastAlertCount(){ return lastAlertCount; }
    public JobStatus getLastStatus()    { return lastStatus; }
}
