package io.movetodata.studio.library.services;

import io.movetodata.studio.library.dto.AppListItem;
import io.movetodata.studio.library.dto.CreateAppRequest;
import io.movetodata.studio.library.dto.DraftResponse;
import io.movetodata.studio.library.dto.SaveDraftRequest;
import io.movetodata.studio.library.models.StudioApp;
import io.movetodata.studio.library.models.StudioAppVersion;
import io.movetodata.studio.library.repository.StudioAppRepository;
import io.movetodata.studio.library.repository.StudioAppVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import javax.persistence.OptimisticLockException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudioAppService {

    private final StudioAppRepository        appRepository;
    private final StudioAppVersionRepository versionRepository;

    // -------------------------------------------------------------------------
    // Constantes
    // -------------------------------------------------------------------------

    /** Nombre maximal d'occurrences de "\"id\":" à compter comme proxy du nombre de nœuds. */
    private static final String NODE_COUNT_PROBE = "\"id\":";

    // -------------------------------------------------------------------------
    // listApps
    // -------------------------------------------------------------------------

    /**
     * Retourne la liste des applications non supprimées.
     * Si {@code query} est non-null et non vide, filtre sur le nom (insensible à la casse).
     */
    public List<AppListItem> listApps(String query) {
        List<StudioApp> apps = appRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc();

        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            apps = apps.stream()
                    .filter(a -> a.getName().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        return apps.stream()
                .map(app -> {
                    int nodeCount = 0;
                    StudioAppVersion draft = versionRepository
                            .findTopByAppIdAndPublishedFalseOrderByVersionDesc(app.getId())
                            .orElse(null);
                    if (draft != null && draft.getDefinition() != null) {
                        nodeCount = countNodes(draft.getDefinition());
                    }
                    return AppListItem.builder()
                            .id(app.getId())
                            .name(app.getName())
                            .status(app.getStatus())
                            .datasourceId(app.getDatasourceId())
                            .nodeCount(nodeCount)
                            .updatedAt(app.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // createApp
    // -------------------------------------------------------------------------

    /**
     * Crée une nouvelle application avec une version 1.
     * Si {@code req.definition} est null, une définition par défaut est générée.
     */
    @Transactional
    public DraftResponse createApp(CreateAppRequest req, UUID createdBy) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom de l'application est obligatoire.");
        }

        UUID appId = UUID.randomUUID();
        String definition = req.getDefinition() != null
                ? req.getDefinition()
                : buildDefaultDefinition(appId, req.getName(), req.getDatasourceId());

        StudioApp app = StudioApp.builder()
                .id(appId)
                .name(req.getName().trim())
                .datasourceId(req.getDatasourceId())
                .status("DRAFT")
                .createdBy(createdBy)
                .build();
        appRepository.save(app);

        StudioAppVersion version = StudioAppVersion.builder()
                .id(UUID.randomUUID())
                .appId(appId)
                .version(1)
                .definition(definition)
                .createdBy(createdBy)
                .published(false)
                .build();
        StudioAppVersion saved = versionRepository.save(version);

        log.info("Studio app created: id={} name={} by user={}", appId, app.getName(), createdBy);

        return toDraftResponse(saved);
    }

    // -------------------------------------------------------------------------
    // getDraft
    // -------------------------------------------------------------------------

    /**
     * Retourne la version brouillon courante (dernière version non publiée).
     *
     * @throws EntityNotFoundException si l'app n'existe pas ou a été supprimée,
     *                                  ou s'il n'existe aucun brouillon.
     */
    public DraftResponse getDraft(UUID appId) {
        assertAppExists(appId);
        StudioAppVersion draft = versionRepository
                .findTopByAppIdAndPublishedFalseOrderByVersionDesc(appId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucun brouillon trouvé pour l'application : " + appId));
        return toDraftResponse(draft);
    }

    // -------------------------------------------------------------------------
    // saveDraft
    // -------------------------------------------------------------------------

    /**
     * Sauvegarde une nouvelle version du brouillon avec verrou optimiste.
     *
     * @throws OptimisticLockException si {@code req.expectedVersion} ne correspond pas
     *                                  à la version courante en base (conflit).
     */
    @Transactional
    public DraftResponse saveDraft(UUID appId, SaveDraftRequest req, UUID updatedBy) {
        assertAppExists(appId);

        StudioAppVersion currentDraft = versionRepository
                .findTopByAppIdAndPublishedFalseOrderByVersionDesc(appId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucun brouillon trouvé pour l'application : " + appId));

        if (currentDraft.getVersion() != req.getExpectedVersion()) {
            log.warn("Version conflict: appId={} expected={} current={}",
                    appId, req.getExpectedVersion(), currentDraft.getVersion());
            throw new OptimisticLockException(
                    "Conflit de version — version courante : " + currentDraft.getVersion());
        }

        StudioAppVersion newVersion = StudioAppVersion.builder()
                .id(UUID.randomUUID())
                .appId(appId)
                .version(currentDraft.getVersion() + 1)
                .definition(req.getDefinition())
                .createdBy(updatedBy)
                .published(false)
                .build();
        StudioAppVersion saved = versionRepository.save(newVersion);

        // Mettre à jour updated_at de l'app parente
        appRepository.findByIdAndDeletedAtIsNull(appId).ifPresent(app -> {
            app.setUpdatedAt(Instant.now());
            appRepository.save(app);
        });

        log.info("Studio draft saved: appId={} newVersion={} by user={}", appId, saved.getVersion(), updatedBy);
        return toDraftResponse(saved);
    }

    // -------------------------------------------------------------------------
    // deleteApp
    // -------------------------------------------------------------------------

    /**
     * Suppression logique : positionne {@code deletedAt}.
     *
     * @throws EntityNotFoundException si l'app n'existe pas ou est déjà supprimée.
     */
    @Transactional
    public void deleteApp(UUID appId) {
        StudioApp app = appRepository.findByIdAndDeletedAtIsNull(appId)
                .orElseThrow(() -> new EntityNotFoundException("Application non trouvée : " + appId));
        app.setDeletedAt(Instant.now());
        appRepository.save(app);
        log.info("Studio app deleted (soft): id={}", appId);
    }

    // -------------------------------------------------------------------------
    // publishApp
    // -------------------------------------------------------------------------

    /**
     * Publie le brouillon courant en marquant la version {@code published = true}.
     * Met également à jour le statut de l'app en PUBLISHED.
     *
     * @throws EntityNotFoundException si l'app ou son brouillon est introuvable.
     */
    @Transactional
    public DraftResponse publishApp(UUID appId, UUID publishedBy) {
        StudioApp app = appRepository.findByIdAndDeletedAtIsNull(appId)
                .orElseThrow(() -> new EntityNotFoundException("Application non trouvée : " + appId));

        StudioAppVersion draft = versionRepository
                .findTopByAppIdAndPublishedFalseOrderByVersionDesc(appId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucun brouillon à publier pour l'application : " + appId));

        draft.setPublished(true);
        versionRepository.save(draft);

        app.setStatus("PUBLISHED");
        app.setUpdatedAt(Instant.now());
        appRepository.save(app);

        log.info("Studio app published: appId={} version={} by user={}", appId, draft.getVersion(), publishedBy);
        return toDraftResponse(draft);
    }

    // -------------------------------------------------------------------------
    // getPublished
    // -------------------------------------------------------------------------

    /**
     * Retourne la dernière version publiée.
     *
     * @throws EntityNotFoundException si l'app n'a jamais été publiée.
     */
    public DraftResponse getPublished(UUID appId) {
        assertAppExists(appId);
        StudioAppVersion published = versionRepository
                .findTopByAppIdAndPublishedTrueOrderByVersionDesc(appId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucune version publiée pour l'application : " + appId));
        return toDraftResponse(published);
    }

    // -------------------------------------------------------------------------
    // Helpers privés
    // -------------------------------------------------------------------------

    private void assertAppExists(UUID appId) {
        appRepository.findByIdAndDeletedAtIsNull(appId)
                .orElseThrow(() -> new EntityNotFoundException("Application non trouvée : " + appId));
    }

    private DraftResponse toDraftResponse(StudioAppVersion v) {
        return DraftResponse.builder()
                .id(v.getId())
                .appId(v.getAppId())
                .version(v.getVersion())
                .definition(v.getDefinition())
                .createdAt(v.getCreatedAt())
                .build();
    }

    /**
     * Compte le nombre de nœuds dans la définition JSON en cherchant les occurrences
     * de {@code "id":} — approximation rapide sans parsing JSON complet.
     * Soustrait 1 pour exclure le champ top-level {@code "id": "<appId>"}.
     */
    private int countNodes(String definition) {
        if (definition == null || definition.isEmpty()) return 0;
        int count = 0;
        int idx   = 0;
        while ((idx = definition.indexOf(NODE_COUNT_PROBE, idx)) != -1) {
            count++;
            idx += NODE_COUNT_PROBE.length();
        }
        // l'AppDefinition elle-même contient un "id": → retirer 1
        return Math.max(0, count - 1);
    }

    /**
     * Génère la définition JSON par défaut pour une nouvelle application.
     * Correspond à une AppDefinition avec un canvas vide (stack racine, aucun enfant).
     */
    private String buildDefaultDefinition(UUID appId, String name, UUID datasourceId) {
        String pageId  = "p_main";
        String rootId  = "n_root";
        String safeId  = appId.toString();
        String safeDsId = datasourceId != null ? datasourceId.toString() : "";
        // Echapper le nom pour éviter les problèmes JSON basiques
        String safeName = name.replace("\\", "\\\\").replace("\"", "\\\"");
        return "{"
                + "\"schemaVersion\":1,"
                + "\"id\":\"" + safeId + "\","
                + "\"name\":\"" + safeName + "\","
                + "\"datasourceId\":\"" + safeDsId + "\","
                + "\"queries\":{},"
                + "\"state\":{},"
                + "\"pages\":[{"
                +   "\"id\":\"" + pageId + "\","
                +   "\"name\":\"Accueil\","
                +   "\"root\":{"
                +     "\"id\":\"" + rootId + "\","
                +     "\"type\":\"stack\","
                +     "\"props\":{\"gap\":16},"
                +     "\"children\":[]"
                +   "}"
                + "}]"
                + "}";
    }
}
