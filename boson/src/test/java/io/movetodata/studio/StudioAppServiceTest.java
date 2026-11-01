package io.movetodata.studio;

import io.movetodata.studio.library.dto.AppListItem;
import io.movetodata.studio.library.dto.CreateAppRequest;
import io.movetodata.studio.library.dto.DraftResponse;
import io.movetodata.studio.library.dto.SaveDraftRequest;
import io.movetodata.studio.library.models.StudioApp;
import io.movetodata.studio.library.models.StudioAppVersion;
import io.movetodata.studio.library.repository.StudioAppRepository;
import io.movetodata.studio.library.repository.StudioAppVersionRepository;
import io.movetodata.studio.library.services.StudioAppService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.persistence.EntityNotFoundException;
import javax.persistence.OptimisticLockException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudioAppServiceTest {

    @Mock
    private StudioAppRepository appRepository;

    @Mock
    private StudioAppVersionRepository versionRepository;

    private StudioAppService service;

    private final UUID USER_ID = UUID.randomUUID();
    private final UUID APP_ID  = UUID.randomUUID();
    private final UUID DS_ID   = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new StudioAppService(appRepository, versionRepository);
    }

    // -------------------------------------------------------------------------
    // createApp — crée la version 1
    // -------------------------------------------------------------------------

    @Test
    void createApp_shouldPersistAppAndVersion1() {
        // Arrange
        CreateAppRequest req = new CreateAppRequest();
        req.setName("Mon App");
        req.setDatasourceId(DS_ID);

        when(appRepository.save(any(StudioApp.class))).thenAnswer(inv -> inv.getArgument(0));
        when(versionRepository.save(any(StudioAppVersion.class))).thenAnswer(inv -> {
            StudioAppVersion v = inv.getArgument(0);
            // Simuler l'attribution d'un id par la base
            return StudioAppVersion.builder()
                    .id(UUID.randomUUID())
                    .appId(v.getAppId())
                    .version(v.getVersion())
                    .definition(v.getDefinition())
                    .createdBy(v.getCreatedBy())
                    .published(v.isPublished())
                    .createdAt(Instant.now())
                    .build();
        });

        // Act
        DraftResponse result = service.createApp(req, USER_ID);

        // Assert
        assertThat(result.getVersion()).isEqualTo(1);
        assertThat(result.getDefinition()).contains("\"schemaVersion\":1");
        assertThat(result.getDefinition()).contains("Mon App");

        ArgumentCaptor<StudioAppVersion> vCaptor = ArgumentCaptor.forClass(StudioAppVersion.class);
        verify(versionRepository).save(vCaptor.capture());
        assertThat(vCaptor.getValue().getVersion()).isEqualTo(1);
        assertThat(vCaptor.getValue().isPublished()).isFalse();
        assertThat(vCaptor.getValue().getCreatedBy()).isEqualTo(USER_ID);
    }

    @Test
    void createApp_withExplicitDefinition_shouldUseProvidedDefinition() {
        // Arrange
        String customDef = "{\"schemaVersion\":1,\"id\":\"abc\",\"name\":\"X\","
                + "\"datasourceId\":\"" + DS_ID + "\","
                + "\"queries\":{},\"state\":{},\"pages\":[]}";
        CreateAppRequest req = new CreateAppRequest();
        req.setName("X");
        req.setDatasourceId(DS_ID);
        req.setDefinition(customDef);

        when(appRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(versionRepository.save(any())).thenAnswer(inv -> {
            StudioAppVersion v = inv.getArgument(0);
            return StudioAppVersion.builder()
                    .id(UUID.randomUUID()).appId(v.getAppId()).version(v.getVersion())
                    .definition(v.getDefinition()).createdBy(v.getCreatedBy())
                    .published(false).createdAt(Instant.now()).build();
        });

        // Act
        DraftResponse result = service.createApp(req, USER_ID);

        // Assert
        assertThat(result.getDefinition()).isEqualTo(customDef);
    }

    @Test
    void createApp_withEmptyName_shouldThrowIllegalArgument() {
        CreateAppRequest req = new CreateAppRequest();
        req.setName("  ");
        req.setDatasourceId(DS_ID);

        assertThatThrownBy(() -> service.createApp(req, USER_ID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // -------------------------------------------------------------------------
    // saveDraft — verrou optimiste
    // -------------------------------------------------------------------------

    @Test
    void saveDraft_withCorrectExpectedVersion_shouldCreateNewVersion() {
        // Arrange
        StudioApp app = buildApp(APP_ID);
        StudioAppVersion currentDraft = buildVersion(APP_ID, 1, false);

        when(appRepository.findByIdAndDeletedAtIsNull(APP_ID)).thenReturn(Optional.of(app));
        when(versionRepository.findTopByAppIdAndPublishedFalseOrderByVersionDesc(APP_ID))
                .thenReturn(Optional.of(currentDraft));
        when(versionRepository.save(any())).thenAnswer(inv -> {
            StudioAppVersion v = inv.getArgument(0);
            return StudioAppVersion.builder()
                    .id(UUID.randomUUID()).appId(v.getAppId()).version(v.getVersion())
                    .definition(v.getDefinition()).createdBy(v.getCreatedBy())
                    .published(false).createdAt(Instant.now()).build();
        });
        when(appRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SaveDraftRequest req = new SaveDraftRequest();
        req.setDefinition("{\"updated\":true}");
        req.setExpectedVersion(1);

        // Act
        DraftResponse result = service.saveDraft(APP_ID, req, USER_ID);

        // Assert
        assertThat(result.getVersion()).isEqualTo(2);
        assertThat(result.getDefinition()).isEqualTo("{\"updated\":true}");
    }

    @Test
    void saveDraft_withWrongExpectedVersion_shouldThrowOptimisticLockException() {
        // Arrange
        StudioApp app = buildApp(APP_ID);
        StudioAppVersion currentDraft = buildVersion(APP_ID, 3, false);

        when(appRepository.findByIdAndDeletedAtIsNull(APP_ID)).thenReturn(Optional.of(app));
        when(versionRepository.findTopByAppIdAndPublishedFalseOrderByVersionDesc(APP_ID))
                .thenReturn(Optional.of(currentDraft));

        SaveDraftRequest req = new SaveDraftRequest();
        req.setDefinition("{}");
        req.setExpectedVersion(1); // wrong — current is 3

        // Act & Assert
        assertThatThrownBy(() -> service.saveDraft(APP_ID, req, USER_ID))
                .isInstanceOf(OptimisticLockException.class)
                .hasMessageContaining("3");
    }

    // -------------------------------------------------------------------------
    // deleteApp
    // -------------------------------------------------------------------------

    @Test
    void deleteApp_shouldSetDeletedAt() {
        // Arrange
        StudioApp app = buildApp(APP_ID);
        when(appRepository.findByIdAndDeletedAtIsNull(APP_ID)).thenReturn(Optional.of(app));
        when(appRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        service.deleteApp(APP_ID);

        // Assert
        ArgumentCaptor<StudioApp> captor = ArgumentCaptor.forClass(StudioApp.class);
        verify(appRepository).save(captor.capture());
        assertThat(captor.getValue().getDeletedAt()).isNotNull();
    }

    @Test
    void deleteApp_appNotFound_shouldThrowEntityNotFoundException() {
        when(appRepository.findByIdAndDeletedAtIsNull(APP_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteApp(APP_ID))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // -------------------------------------------------------------------------
    // publishApp
    // -------------------------------------------------------------------------

    @Test
    void publishApp_shouldMarkVersionPublishedAndUpdateStatus() {
        // Arrange
        StudioApp app = buildApp(APP_ID);
        StudioAppVersion draft = buildVersion(APP_ID, 2, false);

        when(appRepository.findByIdAndDeletedAtIsNull(APP_ID)).thenReturn(Optional.of(app));
        when(versionRepository.findTopByAppIdAndPublishedFalseOrderByVersionDesc(APP_ID))
                .thenReturn(Optional.of(draft));
        when(versionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(appRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        DraftResponse result = service.publishApp(APP_ID, USER_ID);

        // Assert — la version est maintenant publiée
        assertThat(result.getVersion()).isEqualTo(2);

        ArgumentCaptor<StudioAppVersion> vCaptor = ArgumentCaptor.forClass(StudioAppVersion.class);
        verify(versionRepository).save(vCaptor.capture());
        assertThat(vCaptor.getValue().isPublished()).isTrue();

        ArgumentCaptor<StudioApp> aCaptor = ArgumentCaptor.forClass(StudioApp.class);
        verify(appRepository).save(aCaptor.capture());
        assertThat(aCaptor.getValue().getStatus()).isEqualTo("PUBLISHED");
    }

    // -------------------------------------------------------------------------
    // listApps — filtre par nom
    // -------------------------------------------------------------------------

    @Test
    void listApps_withQuery_shouldFilterByNameCaseInsensitive() {
        // Arrange
        StudioApp app1 = buildApp(UUID.randomUUID()); app1.setName("Tableau des ventes");
        StudioApp app2 = buildApp(UUID.randomUUID()); app2.setName("Dashboard RH");

        when(appRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc())
                .thenReturn(List.of(app1, app2));
        when(versionRepository.findTopByAppIdAndPublishedFalseOrderByVersionDesc(any()))
                .thenReturn(Optional.empty());

        // Act
        List<AppListItem> results = service.listApps("ventes");

        // Assert
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Tableau des ventes");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private StudioApp buildApp(UUID id) {
        return StudioApp.builder()
                .id(id)
                .name("Test App")
                .datasourceId(DS_ID)
                .status("DRAFT")
                .createdBy(USER_ID)
                .updatedAt(Instant.now())
                .build();
    }

    private StudioAppVersion buildVersion(UUID appId, int version, boolean published) {
        return StudioAppVersion.builder()
                .id(UUID.randomUUID())
                .appId(appId)
                .version(version)
                .definition("{\"schemaVersion\":1}")
                .createdBy(USER_ID)
                .published(published)
                .createdAt(Instant.now())
                .build();
    }
}
