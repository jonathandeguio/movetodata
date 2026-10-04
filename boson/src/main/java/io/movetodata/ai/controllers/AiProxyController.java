package io.movetodata.ai.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.ai.library.models.AiChatMessage;
import io.movetodata.ai.library.models.AiChatSession;
import io.movetodata.ai.library.models.AiSourceQuality;
import io.movetodata.ai.library.models.UploadedFile;
import io.movetodata.ai.library.repository.UploadedFileRepository;
import io.movetodata.ai.library.services.AiChatService;
import io.movetodata.ai.library.services.AiInsightsService;
import io.movetodata.ai.library.services.SmartConnectorService;
import io.movetodata.ai.library.services.TextToSqlService;
import io.movetodata.connect.library.models.DatabaseSourceConfig;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.Executor;

/**
 * Thin proxy from Boson → movetodata-ai Python service (port 8090).
 *
 * All /api/ai/** requests are forwarded to the Python service. The controller
 * validates that the fileId belongs to the authenticated user before proxying,
 * so the Python service never needs to re-verify ownership.
 *
 * Graceful degradation: if movetodata-ai is unreachable, a 503 is returned
 * instead of crashing. Boson never hard-depends on the AI service at startup.
 */
@Slf4j
@CrossOrigin
@EnableWebMvc
@RestController
@RequestMapping("/api/ai")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Proxy", description = "Proxy to movetodata-ai Python service")
public class AiProxyController {

    @Value("${MOVETODATA_AI_URL:http://movetodata-ai:8090}")
    private String aiServiceUrl;

    private final UploadedFileRepository uploadedFileRepository;
    private final RestTemplate restTemplate;
    private final TextToSqlService textToSqlService;
    private final AiInsightsService aiInsightsService;
    private final AiChatService aiChatService;
    private final SmartConnectorService smartConnectorService;
    private final Executor aiChatExecutor;
    private final ObjectMapper objectMapper;

    public AiProxyController(
            UploadedFileRepository uploadedFileRepository,
            @Qualifier("aiRestTemplate") RestTemplate restTemplate,
            TextToSqlService textToSqlService,
            AiInsightsService aiInsightsService,
            AiChatService aiChatService,
            SmartConnectorService smartConnectorService,
            @Qualifier("aiChatExecutor") Executor aiChatExecutor,
            ObjectMapper objectMapper) {
        this.uploadedFileRepository = uploadedFileRepository;
        this.restTemplate = restTemplate;
        this.textToSqlService = textToSqlService;
        this.aiInsightsService = aiInsightsService;
        this.aiChatService = aiChatService;
        this.smartConnectorService = smartConnectorService;
        this.aiChatExecutor = aiChatExecutor;
        this.objectMapper = objectMapper;
    }

    /**
     * POST /api/ai/analyze-file
     * Validates ownership of the fileId, then forwards to the Python service
     * which reads the file from the shared storage path — never retransmitted.
     *
     * Expected body: { "fileId": "uuid", "sheet": "Feuil1" }
     */
    @Operation(summary = "Trigger AI analysis for an uploaded file.")
    @PostMapping("/analyze-file")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> analyzeFile(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        UUID userId = authUser.getId();
        String fileId = (String) body.get("fileId");
        if (fileId == null || fileId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "fileId is required"));
        }

        UploadedFile entity = uploadedFileRepository.findByUuidAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));

        if (!entity.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied"));
        }

        // Build payload for the Python service — storagePath so it reads
        // directly from disk without retransmitting file bytes over HTTP.
        Map<String, Object> aiPayload = Map.of(
                "file_path", entity.getStoragePath(),
                "filename", entity.getFilename(),
                "sheet", body.getOrDefault("sheet", "")
        );

        return forwardToAiService("/analyze-file", HttpMethod.POST, aiPayload);
    }

    /**
     * POST /api/ai/text-to-sql
     *
     * Generates a SQL SELECT query from a natural-language question for a
     * given JDBC dataset.
     *
     * Flow:
     *  1. Resolve dataset → JDBC source via the Link table.
     *  2. Introspect the source schema and build a simplified DDL string.
     *  3. Forward to movetodata-ai /text-to-sql with { schema_ddl, question, source_type }.
     *  4. Validate the returned SQL with JdbcUtils.isValidDQLQuery().
     *  5. Return the result including the sourceId (for client-side execution).
     *
     * Expected body:
     * <pre>
     * { "datasetId": "uuid", "branch": "master", "question": "Quel est le CA par région ?" }
     * </pre>
     */
    @Operation(summary = "Generate SQL from a natural-language question (Text-to-SQL).")
    @PostMapping("/text-to-sql")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> textToSql(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        // --- 1. Parse request ---
        String datasetIdStr = (String) body.get("datasetId");
        String branch = (String) body.getOrDefault("branch", "master");
        String question = (String) body.get("question");

        if (datasetIdStr == null || datasetIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "datasetId is required"));
        }
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "question is required"));
        }

        UUID datasetId;
        try {
            datasetId = UUID.fromString(datasetIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "datasetId must be a valid UUID"));
        }

        // --- 2. Resolve dataset → JDBC source ---
        DatabaseSourceConfig sourceConfig;
        UUID sourceId;
        try {
            sourceConfig = textToSqlService.getSourceConfigForDataset(datasetId, branch);
            // Re-derive the source UUID from the Link (needed in the response for client-side execution)
            sourceId = textToSqlService.getSourceIdForDataset(datasetId, branch);
        } catch (IllegalArgumentException e) {
            log.warn("text-to-sql: dataset {} not linked to a JDBC source — {}", datasetId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "DATASET_NOT_LINKED", "detail", e.getMessage()));
        } catch (Exception e) {
            log.error("text-to-sql: error resolving source for dataset {} — {}", datasetId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SOURCE_RESOLUTION_ERROR", "detail", e.getMessage()));
        }

        // --- 3. Build schema DDL ---
        String schemaDdl;
        try {
            schemaDdl = textToSqlService.buildSchemaDdl(sourceConfig);
        } catch (Exception e) {
            log.warn("text-to-sql: schema introspection failed for dataset {} — {}", datasetId, e.getMessage());
            schemaDdl = ""; // forward with empty DDL; LLM may still partially answer
        }

        if (schemaDdl.isBlank()) {
            log.warn("text-to-sql: empty schema DDL for dataset {} — cannot generate reliable SQL", datasetId);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("error", "SCHEMA_UNAVAILABLE",
                            "detail", "Could not introspect the database schema for this source type."));
        }

        // --- 4. Forward to movetodata-ai ---
        String sourceType = sourceConfig.getDbmsType() != null
                ? sourceConfig.getDbmsType().name()
                : "ANSI";

        Map<String, Object> aiPayload = Map.of(
                "schema_ddl", schemaDdl,
                "question", question,
                "source_type", sourceType
        );

        ResponseEntity<Object> aiResponse = forwardToAiService("/text-to-sql", HttpMethod.POST, aiPayload);

        if (!aiResponse.getStatusCode().is2xxSuccessful()) {
            return aiResponse;
        }

        // --- 5. Validate the returned SQL ---
        @SuppressWarnings("unchecked")
        Map<String, Object> aiBody = (Map<String, Object>) aiResponse.getBody();
        if (aiBody == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "EMPTY_AI_RESPONSE"));
        }

        String generatedSql = (String) aiBody.get("sql");
        if (generatedSql != null && !generatedSql.isBlank()) {
            boolean isValidDql = textToSqlService.validateDql(generatedSql, sourceConfig.getDbmsType());
            if (!isValidDql) {
                log.warn("text-to-sql: generated SQL failed DQL validation for dataset {}: {}", datasetId, generatedSql);
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "INVALID_DQL",
                        "generatedSql", generatedSql,
                        "detail", "The generated query is not a valid SELECT statement."
                ));
            }
        }

        // --- 6. Enrich response with sourceId for client-side execution ---
        java.util.HashMap<String, Object> enriched = new java.util.HashMap<>(aiBody);
        enriched.put("sourceId", sourceId.toString());

        return ResponseEntity.ok(enriched);
    }

    /**
     * POST /api/ai/insights
     *
     * Fetches data for the requested dataset columns from the linked JDBC
     * source and forwards it to the Python analytics service.
     *
     * Flow:
     *  1. Validate request parameters.
     *  2. Fetch up to 10 000 rows via AiInsightsService (JDBC → in-memory).
     *  3. Build payload for movetodata-ai /insights.
     *  4. Forward to Python service and return the result.
     *
     * Expected body:
     * <pre>
     * {
     *   "datasetId": "uuid",
     *   "branch":    "master",
     *   "columnX":   "date",
     *   "columnY":   "ca",
     *   "type":      "anomaly" | "forecast" | "cluster" | "summary",
     *   "options":   { "forecast_horizon": 30, "cluster_k": null,
     *                  "anomaly_contamination": 0.05 }
     * }
     * </pre>
     */
    @Operation(summary = "Run augmented analytics (anomaly / forecast / cluster / summary).")
    @PostMapping("/insights")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> insights(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        // --- 1. Parse and validate request ---
        String datasetIdStr = (String) body.get("datasetId");
        String branch       = (String) body.getOrDefault("branch", "master");
        String columnX      = (String) body.get("columnX");
        String columnY      = (String) body.get("columnY");
        String type         = (String) body.get("type");

        if (datasetIdStr == null || datasetIdStr.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "datasetId is required"));
        if (columnX == null || columnX.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "columnX is required"));
        if (columnY == null || columnY.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "columnY is required"));
        if (type == null || type.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "type is required"));

        UUID datasetId;
        try {
            datasetId = UUID.fromString(datasetIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "datasetId must be a valid UUID"));
        }

        // --- 2. Fetch data from JDBC source ---
        Map<String, Object> fetched;
        try {
            fetched = aiInsightsService.fetchDataForInsights(datasetId, branch, columnX, columnY);
        } catch (IllegalArgumentException e) {
            log.warn("insights: cannot resolve source for dataset {} — {}", datasetId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "DATASET_NOT_LINKED", "detail", e.getMessage()));
        } catch (Exception e) {
            log.error("insights: data fetch failed for dataset {} — {}", datasetId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "DATA_FETCH_ERROR", "detail", e.getMessage()));
        }

        // --- 3. Build payload for Python service ---
        java.util.HashMap<String, Object> aiPayload = new java.util.HashMap<>(fetched);
        aiPayload.put("column_x", columnX);
        aiPayload.put("column_y", columnY);
        aiPayload.put("type", type);
        if (body.containsKey("options")) {
            aiPayload.put("options", body.get("options"));
        }

        // --- 4. Forward to movetodata-ai /insights ---
        return forwardToAiService("/insights", HttpMethod.POST, aiPayload);
    }

    // =========================================================================
    // F3 — Assistant IA conversationnel
    // =========================================================================

    /**
     * POST /api/ai/chat  (SSE streaming)
     *
     * Flow:
     *  1. Resolve or create the chat session.
     *  2. Persist the user message.
     *  3. Build the context map (schema DDL for the active source, if any).
     *  4. Fetch the last 10 messages as conversation history.
     *  5. Forward the payload to movetodata-ai /chat via HttpURLConnection
     *     (streaming — RestTemplate cannot proxy SSE).
     *  6. Forward each SSE chunk verbatim to the SseEmitter (browser).
     *  7. Once the Python service sends {"type":"done"}, persist the accumulated
     *     assistant message and complete the emitter.
     *
     * Expected body:
     * <pre>
     * {
     *   "sessionId": "uuid-v4",        // client-generated; created if absent
     *   "message":   "Ta question",
     *   "context": {
     *     "sourceId":     "uuid",       // nullable
     *     "openChartIds": [1, 2]        // nullable
     *   }
     * }
     * </pre>
     *
     * SSE event format (forwarded verbatim from Python):
     * <pre>
     *   data: {"type":"token",  "content":"Voici "}
     *   data: {"type":"token",  "content":"les ventes"}
     *   data: {"type":"done",   "model":"qwen2.5:14b", "tokens_used":312}
     *   data: {"type":"error",  "error":"LLM_UNAVAILABLE"}
     * </pre>
     */
    @Operation(summary = "Chat with the AI assistant (SSE streaming).")
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public SseEmitter chat(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        // SseEmitter with no timeout — the Python service may take 30+ s on
        // first token generation with a cold model.
        SseEmitter emitter = new SseEmitter(0L);

        UUID userId = authUser.getId();
        String message = (String) body.get("message");
        String sessionId = (String) body.get("sessionId");

        if (message == null || message.isBlank()) {
            try {
                emitter.send(SseEmitter.event()
                        .data("{\"type\":\"error\",\"error\":\"MESSAGE_REQUIRED\"}"));
            } catch (IOException ignored) {}
            emitter.complete();
            return emitter;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> contextIn = (Map<String, Object>) body.getOrDefault("context", Map.of());
        String sourceId = (String) contextIn.get("sourceId");
        @SuppressWarnings("unchecked")
        List<?> openChartIds = (List<?>) contextIn.getOrDefault("openChartIds", List.of());

        // Resolve/create session and persist user message (synchronous — fast)
        AiChatSession session;
        try {
            session = aiChatService.getOrCreateSession(sessionId, userId, sourceId);
            aiChatService.saveMessage(session.getUuid(), "user", message, null, null);
        } catch (Exception e) {
            log.error("chat: failed to initialise session for user {} — {}", userId, e.getMessage(), e);
            try {
                emitter.send(SseEmitter.event()
                        .data("{\"type\":\"error\",\"error\":\"SESSION_ERROR\"}"));
            } catch (IOException ignored) {}
            emitter.complete();
            return emitter;
        }

        final String sessionUuid = session.getUuid();

        // Build LLM context (schema DDL) — may throw, handled gracefully
        Map<String, Object> contextForPython = aiChatService.buildContext(sourceId, openChartIds);

        // Convert history to [{role, content}] — last 10 messages
        List<AiChatMessage> historyMsgs = aiChatService.getHistory(sessionUuid, 10);
        List<Map<String, String>> history = new ArrayList<>();
        for (AiChatMessage m : historyMsgs) {
            // Skip the message we just persisted (last "user" turn) — Python will append it
            history.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }

        // Build payload for Python
        Map<String, Object> pythonPayload = new HashMap<>();
        pythonPayload.put("session_id", sessionUuid);
        pythonPayload.put("message", message);
        pythonPayload.put("context", contextForPython);
        pythonPayload.put("history", history);

        // Stream in a background thread so the Tomcat thread is not blocked
        aiChatExecutor.execute(() -> streamChatFromPython(emitter, sessionUuid, pythonPayload));

        return emitter;
    }

    /**
     * GET /api/ai/chat/history?sessionId={uuid}&limit=50
     *
     * Returns the message history for a session as a JSON array.
     * Ownership is verified — only the session owner can retrieve history.
     */
    @Operation(summary = "Get chat history for a session.")
    @GetMapping("/chat/history")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> chatHistory(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam("sessionId") String sessionId,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {

        UUID userId = authUser.getId();

        // Ownership check — returns 404 if session doesn't exist or belongs to another user
        if (!aiChatService.sessionBelongsToUser(sessionId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied"));
        }

        List<AiChatMessage> messages = aiChatService.getHistory(sessionId, Math.min(limit, 200));
        return ResponseEntity.ok(messages);
    }

    /**
     * DELETE /api/ai/chat/session/{sessionId}
     *
     * Soft-deletes the session and all its messages.
     * Returns HTTP 204 No Content on success (including if session does not exist).
     */
    @Operation(summary = "Soft-delete a chat session and its messages.")
    @DeleteMapping("/chat/session/{sessionId}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Void> deleteSession(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("sessionId") String sessionId) {

        aiChatService.softDeleteSession(sessionId, authUser.getId());
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Internal SSE proxy helper
    // -------------------------------------------------------------------------

    /**
     * Opens an HTTP connection to the Python /chat endpoint, reads the SSE
     * stream line by line, and forwards each chunk to the SseEmitter.
     *
     * Accumulates the assistant content so it can be persisted once the stream
     * ends (on the "done" event).
     *
     * Must be called from a background thread — it blocks until the stream ends
     * or an error occurs.
     */
    private void streamChatFromPython(SseEmitter emitter,
                                       String sessionUuid,
                                       Map<String, Object> pythonPayload) {
        StringBuilder assistantContent = new StringBuilder();
        String[] finalModel = {"qwen2.5:14b"};
        int[] finalTokens = {0};

        HttpURLConnection conn = null;
        try {
            String chatUrl = aiServiceUrl + "/chat";
            conn = (HttpURLConnection) new URL(chatUrl).openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "text/event-stream");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(0); // no timeout — streaming may last minutes

            String jsonBody = objectMapper.writeValueAsString(pythonPayload);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
            }

            int status = conn.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                log.warn("chat SSE proxy: Python service returned HTTP {} for session {}",
                        status, sessionUuid);
                safeSend(emitter, "{\"type\":\"error\",\"error\":\"AI_SERVICE_ERROR\"}");
                emitter.complete();
                return;
            }

            // Read SSE lines
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data: ")) continue;
                    String data = line.substring(6).trim();
                    safeSend(emitter, data);

                    // Parse event to accumulate assistant text
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> event = objectMapper.readValue(data, Map.class);
                        String type = (String) event.get("type");
                        if ("token".equals(type)) {
                            Object c = event.get("content");
                            if (c != null) assistantContent.append(c.toString());
                        } else if ("done".equals(type)) {
                            Object m = event.get("model");
                            if (m != null) finalModel[0] = m.toString();
                            Object tu = event.get("tokens_used");
                            if (tu instanceof Number) finalTokens[0] = ((Number) tu).intValue();
                        } else if ("error".equals(type)) {
                            log.warn("chat SSE proxy: Python sent error event for session {}: {}",
                                    sessionUuid, data);
                        }
                    } catch (Exception parseEx) {
                        log.debug("chat SSE proxy: could not parse event data — {}", parseEx.getMessage());
                    }
                }
            }

            // Persist accumulated assistant message
            if (assistantContent.length() > 0) {
                aiChatService.saveMessage(sessionUuid, "assistant",
                        assistantContent.toString(), finalModel[0], finalTokens[0]);
            }

            emitter.complete();

        } catch (IOException e) {
            log.warn("chat SSE proxy: I/O error streaming from Python for session {} — {}",
                    sessionUuid, e.getMessage());
            safeSend(emitter, "{\"type\":\"error\",\"error\":\"LLM_UNAVAILABLE\"}");
            emitter.complete();
        } catch (Exception e) {
            log.error("chat SSE proxy: unexpected error for session {} — {}",
                    sessionUuid, e.getMessage(), e);
            emitter.completeWithError(e);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /** Send an SSE data event, swallowing IOExceptions (client may have disconnected). */
    private void safeSend(SseEmitter emitter, String data) {
        try {
            emitter.send(SseEmitter.event().data(data));
        } catch (IOException ignored) {
            // Client disconnected — not an error
        }
    }

    // =========================================================================
    // F4 — Smart Connector
    // =========================================================================

    /**
     * POST /api/ai/smart-connector/analyze
     *
     * Triggers a Smart Connector analysis on a source:
     *  1. Fetches a 1 000-row sample via JDBC.
     *  2. Forwards to movetodata-ai /smart-connector/analyze.
     *  3. Persists the quality score in ai_source_quality.
     *  4. Returns the full analysis result.
     *
     * Expected body:
     * <pre>{ "sourceId": "uuid" }</pre>
     */
    @Operation(summary = "Analyse source quality and suggest charts (Smart Connector).")
    @PostMapping("/smart-connector/analyze")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> smartConnectorAnalyze(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody Map<String, Object> body) {

        String sourceIdStr = (String) body.get("sourceId");
        if (sourceIdStr == null || sourceIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sourceId is required"));
        }

        UUID sourceId;
        try {
            sourceId = UUID.fromString(sourceIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "sourceId must be a valid UUID"));
        }

        try {
            Map<String, Object> result = smartConnectorService.analyzeSample(sourceId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("smart-connector/analyze: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "SOURCE_NOT_FOUND", "detail", e.getMessage()));
        } catch (Exception e) {
            log.error("smart-connector/analyze: unexpected error for source {} — {}", sourceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "ANALYSIS_ERROR", "detail", e.getMessage()));
        }
    }

    /**
     * GET /api/ai/smart-connector/score/{sourceId}
     *
     * Returns the cached quality score for the given source.
     * Returns 404 if no analysis has been run yet.
     */
    @Operation(summary = "Get cached quality score for a source.")
    @GetMapping("/smart-connector/score/{sourceId}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> smartConnectorScore(
            @PathVariable("sourceId") String sourceIdStr) {

        UUID sourceId;
        try {
            sourceId = UUID.fromString(sourceIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "sourceId must be a valid UUID"));
        }

        return smartConnectorService.getQualityScore(sourceId)
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "NO_ANALYSIS_YET",
                                "detail", "No analysis has been run for source " + sourceId)));
    }

    /**
     * POST /api/ai/smart-connector/scores/batch
     *
     * Batch lookup of quality scores for multiple sources.
     * Used by the Connect source list badge renderer — one call instead of N.
     *
     * Expected body: { "sourceIds": ["uuid1", "uuid2", ...] }
     */
    @Operation(summary = "Batch get quality scores for multiple sources.")
    @PostMapping("/smart-connector/scores/batch")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> smartConnectorScoresBatch(
            @RequestBody Map<String, Object> body) {

        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("sourceIds");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<UUID> uuids = new ArrayList<>();
        for (String id : ids) {
            try {
                uuids.add(UUID.fromString(id));
            } catch (IllegalArgumentException ignored) {}
        }

        List<AiSourceQuality> results = smartConnectorService.getQualityScores(uuids);
        return ResponseEntity.ok(results);
    }

    /**
     * Generic pass-through for any other /api/ai/** endpoint (e.g., /health,
     * /text-to-sql, /insights, /chat).
     */
    @Operation(summary = "Generic proxy to the AI service.")
    @RequestMapping(value = "/**", method = {RequestMethod.GET, RequestMethod.POST})
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<Object> genericProxy(
            @RequestBody(required = false) Map<String, Object> body,
            HttpMethod method,
            HttpServletRequest request) {

        String subPath = request.getRequestURI().replaceFirst("/api/ai", "");
        return forwardToAiService(subPath, method, body);
    }

    // -------------------------------------------------------------------------

    private ResponseEntity<Object> forwardToAiService(
            String path, HttpMethod method, Object body) {
        try {
            String url = aiServiceUrl + path;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Object> response =
                    restTemplate.exchange(url, method, entity, Object.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

        } catch (ResourceAccessException e) {
            log.warn("movetodata-ai unreachable at {}: {}", aiServiceUrl, e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "AI service unavailable",
                            "detail", "The movetodata-ai service is not reachable. Please retry later."
                    ));
        } catch (Exception e) {
            log.error("Error forwarding to AI service at {}: {}", aiServiceUrl, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI service error", "detail", e.getMessage()));
        }
    }
}
