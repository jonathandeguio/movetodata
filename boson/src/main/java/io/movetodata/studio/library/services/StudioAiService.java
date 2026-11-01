package io.movetodata.studio.library.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.studio.library.dto.AiChatRequest;
import io.movetodata.studio.library.dto.AiChatResponse;
import io.movetodata.studio.library.dto.CreateAppRequest;
import io.movetodata.studio.library.dto.DraftResponse;
import io.movetodata.studio.library.dto.GenerateAppRequest;
import io.movetodata.studio.library.dto.QueryDefDto;
import io.movetodata.studio.library.models.StudioAiMessage;
import io.movetodata.studio.library.repository.StudioAiMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import javax.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service orchestrateur pour le chat IA du Studio.
 *
 * Flux POST /api/studio/apps/{id}/ai :
 *  1. Lit le brouillon courant (définition + requêtes).
 *  2. Récupère les 10 derniers messages de la conversation.
 *  3. Appelle le service Python movetodata-ai/studio/ai.
 *  4. Revalide le SQL de chaque upsertQuery via StudioSqlValidator (SPEC §6).
 *  5. Persiste les messages user et assistant.
 *  6. Retourne {explanation, patch}.
 *
 * Flux POST /api/studio/apps/generate :
 *  1. Appelle movetodata-ai/studio/generate.
 *  2. Crée l'application avec la définition générée.
 *  3. Retourne le DraftResponse.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudioAiService {

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    @Qualifier("aiRestTemplate")
    private final RestTemplate restTemplate;

    private final StudioAppService          studioAppService;
    private final StudioAiMessageRepository aiMessageRepository;
    private final StudioSqlValidator        sqlValidator;
    private final ObjectMapper              objectMapper;

    // -------------------------------------------------------------------------
    // Chat IA
    // -------------------------------------------------------------------------

    /**
     * Orchestre un échange avec l'assistant IA pour une application existante.
     *
     * @param appId         identifiant de l'application
     * @param req           prompt utilisateur + nœud sélectionné
     * @param userId        identifiant de l'utilisateur courant
     * @return              explication + patch
     * @throws EntityNotFoundException         si l'application n'existe pas
     * @throws IllegalStateException           si le service IA est indisponible
     * @throws io.movetodata.studio.library.exceptions.SqlValidationException si le SQL généré est invalide
     */
    @Transactional
    public AiChatResponse chat(UUID appId, AiChatRequest req, UUID userId) {
        if (req.getPrompt() == null || req.getPrompt().isBlank()) {
            throw new IllegalArgumentException("Le prompt ne peut pas être vide.");
        }

        // 1. Lire le brouillon courant
        DraftResponse draft = studioAppService.getDraft(appId);
        String definitionJson = draft.getDefinition();

        // 2. Désérialiser la définition (Map générique)
        Map<String, Object> definitionMap;
        try {
            definitionMap = objectMapper.readValue(definitionJson,
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Studio AI: impossible de désérialiser la définition de l'app {} : {}", appId, e.getMessage());
            definitionMap = new LinkedHashMap<>();
        }

        // 3. Récupérer les 10 derniers messages (contexte IA)
        List<StudioAiMessage> recentMessages =
                aiMessageRepository.findTop10ByAppIdOrderByCreatedAtDesc(appId);
        Collections.reverse(recentMessages); // ordre chronologique

        List<Map<String, String>> historyForPython = new ArrayList<>();
        for (StudioAiMessage msg : recentMessages) {
            historyForPython.add(Map.of("role", msg.getRole(), "text", msg.getText()));
        }

        // 4. Construire le payload pour le service Python
        Map<String, Object> pythonPayload = new LinkedHashMap<>();
        pythonPayload.put("prompt", req.getPrompt());
        pythonPayload.put("appDefinition", definitionMap);
        if (req.getSelectedNodeId() != null && !req.getSelectedNodeId().isBlank()) {
            pythonPayload.put("selectedNodeId", req.getSelectedNodeId());
        }
        pythonPayload.put("messages", historyForPython);

        // 5. Appel au service Python
        Map<String, Object> pythonResponse = callPythonStudio("/studio/ai", pythonPayload);

        // 6. Extraire explanation et patch
        String explanation = (String) pythonResponse.getOrDefault("explanation", "");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> patch = (List<Map<String, Object>>)
                pythonResponse.getOrDefault("patch", List.of());

        // 7. Revalider le SQL de chaque upsertQuery (SPEC §6 — non négociable)
        revalidatePatchSql(patch);

        // 8. Persister les messages
        persistMessage(appId, userId, "user", req.getPrompt(), null);
        String patchJson = serializePatch(patch);
        persistMessage(appId, userId, "assistant", explanation, patchJson);

        log.info("Studio AI chat: appId={} ops={} user={}", appId, patch.size(), userId);
        return AiChatResponse.builder()
                .explanation(explanation)
                .patch(patch)
                .build();
    }

    // -------------------------------------------------------------------------
    // Génération complète d'application
    // -------------------------------------------------------------------------

    /**
     * Génère une application complète via l'IA et la persiste.
     *
     * @param req    paramètres de génération
     * @param userId identifiant de l'utilisateur
     * @return       brouillon de l'application créée
     */
    @Transactional
    public DraftResponse generate(GenerateAppRequest req, UUID userId) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Le nom de l'application est obligatoire.");
        }

        // Construire le payload pour le service Python
        Map<String, Object> pythonPayload = new LinkedHashMap<>();
        pythonPayload.put("name", req.getName());
        pythonPayload.put("description", req.getDescription() != null ? req.getDescription() : "");
        pythonPayload.put("datasourceId", req.getDatasourceId() != null
                ? req.getDatasourceId().toString() : "");
        pythonPayload.put("tableName", req.getTableName() != null ? req.getTableName() : "");

        // Appel au service Python
        Map<String, Object> pythonResponse = callPythonStudio("/studio/generate", pythonPayload);

        @SuppressWarnings("unchecked")
        Map<String, Object> generatedDef = (Map<String, Object>)
                pythonResponse.get("definition");
        if (generatedDef == null) {
            throw new IllegalStateException("Le service IA n'a pas retourné de définition.");
        }

        // Revalider le SQL dans les queries de la définition générée
        @SuppressWarnings("unchecked")
        Map<String, Object> queries = (Map<String, Object>) generatedDef.getOrDefault("queries", Map.of());
        revalidateDefinitionSql(queries);

        // Sérialiser la définition et créer l'app
        String definitionJson;
        try {
            definitionJson = objectMapper.writeValueAsString(generatedDef);
        } catch (Exception e) {
            throw new IllegalStateException("Impossible de sérialiser la définition générée : " + e.getMessage());
        }

        CreateAppRequest createReq = new CreateAppRequest();
        createReq.setName(req.getName());
        createReq.setDatasourceId(req.getDatasourceId());
        createReq.setDefinition(definitionJson);

        DraftResponse draft = studioAppService.createApp(createReq, userId);
        log.info("Studio AI generate: appId={} name={} user={}", draft.getAppId(), req.getName(), userId);
        return draft;
    }

    // -------------------------------------------------------------------------
    // Helpers privés
    // -------------------------------------------------------------------------

    /**
     * Appelle le service Python movetodata-ai sur le chemin donné.
     *
     * @throws IllegalStateException si le service est indisponible (503)
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> callPythonStudio(String path, Map<String, Object> payload) {
        String url = aiServiceUrl + path;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Réponse inattendue du service IA : " + response.getStatusCode());
            }
            return response.getBody();
        } catch (ResourceAccessException e) {
            log.warn("Studio AI: service Python inaccessible à {} : {}", url, e.getMessage());
            throw new IllegalStateException("Le service IA est indisponible. Veuillez réessayer plus tard.");
        } catch (Exception e) {
            log.error("Studio AI: erreur lors de l'appel à {} : {}", url, e.getMessage(), e);
            throw new IllegalStateException("Erreur lors de l'appel au service IA : " + e.getMessage());
        }
    }

    /**
     * Revalide le SQL de toutes les opérations upsertQuery du patch (SPEC §6).
     */
    private void revalidatePatchSql(List<Map<String, Object>> patch) {
        if (patch == null) return;
        for (Map<String, Object> op : patch) {
            if (!"upsertQuery".equals(op.get("op"))) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> queryMap = (Map<String, Object>) op.get("query");
            if (queryMap == null) continue;

            QueryDefDto qDto = QueryDefDto.builder()
                    .id((String) queryMap.get("id"))
                    .sql((String) queryMap.get("sql"))
                    .kind((String) queryMap.get("kind"))
                    .build();

            // Valider avec la liste de tables vide (aucune restriction de table en mode chat)
            sqlValidator.validate(qDto, Set.of());
        }
    }

    /**
     * Revalide le SQL de toutes les queries d'une définition générée.
     */
    @SuppressWarnings("unchecked")
    private void revalidateDefinitionSql(Map<String, Object> queries) {
        if (queries == null) return;
        for (Map.Entry<String, Object> entry : queries.entrySet()) {
            Object value = entry.getValue();
            if (!(value instanceof Map)) continue;
            Map<String, Object> queryMap = (Map<String, Object>) value;

            QueryDefDto qDto = QueryDefDto.builder()
                    .id(entry.getKey())
                    .sql((String) queryMap.get("sql"))
                    .kind((String) queryMap.get("kind"))
                    .build();

            sqlValidator.validate(qDto, Set.of());
        }
    }

    private void persistMessage(UUID appId, UUID userId, String role, String text, String patchJson) {
        StudioAiMessage msg = StudioAiMessage.builder()
                .id(UUID.randomUUID())
                .appId(appId)
                .role(role)
                .text(text != null ? text : "")
                .patch(patchJson)
                .applied(false)
                .build();
        aiMessageRepository.save(msg);
    }

    private String serializePatch(List<Map<String, Object>> patch) {
        if (patch == null || patch.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(patch);
        } catch (Exception e) {
            log.warn("Studio AI: impossible de sérialiser le patch : {}", e.getMessage());
            return null;
        }
    }
}
