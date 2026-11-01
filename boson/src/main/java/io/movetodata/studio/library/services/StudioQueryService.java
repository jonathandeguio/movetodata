package io.movetodata.studio.library.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.connect.library.models.DatabaseSourceConfig;
import io.movetodata.connect.library.models.Source;
import io.movetodata.connect.library.repository.DatabaseSourceConfigRepository;
import io.movetodata.connect.library.repository.SourcesRepository;
import io.movetodata.connect.library.services.JDBCService;
import io.movetodata.studio.library.dto.DraftResponse;
import io.movetodata.studio.library.dto.QueryDefDto;
import io.movetodata.studio.library.dto.QueryRunResponse;
import io.movetodata.studio.library.exceptions.QueryExecutionException;
import io.movetodata.studio.library.exceptions.SqlValidationException;
import io.movetodata.studio.library.models.StudioQueryAudit;
import io.movetodata.studio.library.repository.StudioAppRepository;
import io.movetodata.studio.library.repository.StudioQueryAuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Exécution sécurisée des requêtes Studio — SPEC §6, non négociable.
 *
 * Garanties :
 * <ul>
 *   <li>Validation SQL via {@link StudioSqlValidator} avant chaque exécution.</li>
 *   <li>Paramètres liés via {@link PreparedStatement} (jamais de concaténation).</li>
 *   <li>LIMIT 1000 imposé sur les SELECT.</li>
 *   <li>Timeout 10 s sur chaque statement.</li>
 *   <li>Chaque exécution journalisée dans {@code studio_query_audit}.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudioQueryService {

    private static final int  READ_LIMIT   = 1000;
    private static final int  TIMEOUT_SEC  = 10;

    /** Regex des paramètres nommés :paramName dans le SQL. */
    private static final Pattern NAMED_PARAM = Pattern.compile(":([a-zA-Z_][a-zA-Z0-9_]*)");

    private final StudioAppService           appService;
    private final StudioAppRepository        appRepository;
    private final SourcesRepository          sourcesRepository;
    private final DatabaseSourceConfigRepository dbSourceConfigRepository;
    private final JDBCService                jdbcService;
    private final StudioSqlValidator         sqlValidator;
    private final StudioQueryAuditRepository auditRepository;

    // -------------------------------------------------------------------------
    // Point d'entrée principal
    // -------------------------------------------------------------------------

    /**
     * Exécute une requête identifiée par {@code queryId} dans l'application {@code appId}.
     *
     * @param appId    UUID de l'application Studio
     * @param queryId  identifiant de la requête (clé dans {@code queries})
     * @param params   paramètres nommés à lier
     * @param mode     "draft" ou "published"
     * @param userId   UUID de l'utilisateur courant (pour l'audit)
     * @return {@link QueryRunResponse} contenant les lignes ou le nombre de lignes affectées
     * @throws SqlValidationException   si le SQL viole les règles SPEC §6
     * @throws QueryExecutionException  si l'exécution JDBC échoue
     * @throws EntityNotFoundException  si l'app ou la requête est introuvable
     */
    @Transactional
    public QueryRunResponse execute(UUID appId, String queryId,
                                    Map<String, Object> params,
                                    String mode, UUID userId) {

        long startMs = System.currentTimeMillis();
        String errorMsg = null;
        int rowCount  = 0;
        int version   = 0;

        try {
            // 1. Récupérer la définition (brouillon ou publiée)
            DraftResponse def = "published".equals(mode)
                    ? appService.getPublished(appId)
                    : appService.getDraft(appId);
            version = def.getVersion();

            // 2. Parser la définition JSON et extraire le QueryDef
            QueryDefDto queryDef = extractQuery(def.getDefinition(), queryId);

            // 3. Valider le SQL (règles SPEC §6 — non négociable)
            sqlValidator.validate(queryDef, Collections.emptySet());

            // 4. Obtenir la connexion JDBC depuis la datasource de l'app
            DatabaseSourceConfig dbConfig = resolveDatasource(appId);

            // 5. Construire et exécuter le PreparedStatement
            QueryRunResponse result = executeQuery(queryDef, params, dbConfig);
            rowCount = result.getRowsAffected() > 0
                    ? result.getRowsAffected()
                    : result.getRows().size();

            long durationMs = System.currentTimeMillis() - startMs;
            log.info("Studio query executed: appId={} queryId={} mode={} rows={} durationMs={}",
                    appId, queryId, mode, rowCount, durationMs);

            return QueryRunResponse.builder()
                    .rows(result.getRows())
                    .rowsAffected(result.getRowsAffected())
                    .durationMs(durationMs)
                    .build();

        } catch (SqlValidationException | EntityNotFoundException e) {
            errorMsg = e.getMessage();
            throw e;
        } catch (Exception e) {
            errorMsg = e.getMessage();
            throw new QueryExecutionException("Erreur lors de l'exécution de la requête : " + e.getMessage(), e);
        } finally {
            long durationMs = System.currentTimeMillis() - startMs;
            writeAudit(appId, version, queryId, userId, params, rowCount, (int) durationMs, errorMsg);
        }
    }

    // -------------------------------------------------------------------------
    // Extraction du QueryDef depuis le JSON
    // -------------------------------------------------------------------------

    private QueryDefDto extractQuery(String definitionJson, String queryId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(definitionJson);
            JsonNode queries = root.path("queries");
            JsonNode queryNode = queries.path(queryId);

            if (queryNode.isMissingNode()) {
                throw new EntityNotFoundException(
                        "Requête introuvable dans la définition de l'application : " + queryId);
            }

            String sql    = queryNode.path("sql").asText();
            String kind   = queryNode.path("kind").asText();

            List<String> paramsList = new ArrayList<>();
            JsonNode paramsNode = queryNode.path("params");
            if (paramsNode.isArray()) {
                paramsNode.forEach(p -> paramsList.add(p.asText()));
            }

            return QueryDefDto.builder()
                    .id(queryId)
                    .kind(kind)
                    .sql(sql)
                    .params(paramsList)
                    .build();

        } catch (EntityNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new QueryExecutionException(
                    "Impossible de lire la définition de l'application : " + e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // Résolution de la datasource JDBC
    // -------------------------------------------------------------------------

    private DatabaseSourceConfig resolveDatasource(UUID appId) {
        UUID datasourceId = appRepository.findByIdAndDeletedAtIsNull(appId)
                .orElseThrow(() -> new EntityNotFoundException("Application introuvable : " + appId))
                .getDatasourceId();

        Source source = sourcesRepository.findById(datasourceId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Datasource introuvable : " + datasourceId));

        return dbSourceConfigRepository.findById(source.getSourceConfig())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Configuration JDBC introuvable pour la datasource : " + datasourceId));
    }

    // -------------------------------------------------------------------------
    // Exécution JDBC sécurisée
    // -------------------------------------------------------------------------

    private QueryRunResponse executeQuery(QueryDefDto queryDef,
                                          Map<String, Object> params,
                                          DatabaseSourceConfig dbConfig) throws Exception {

        // Substitution des paramètres nommés → ? (jamais de concaténation)
        List<String> orderedParamNames = new ArrayList<>();
        String preparedSql = substitutedNamedParams(queryDef.getSql(), orderedParamNames);

        // Pour les read : imposer LIMIT 1000 si absent
        if ("read".equals(queryDef.getKind())) {
            preparedSql = ensureLimit(preparedSql, READ_LIMIT);
        }

        Connection conn = jdbcService.getJdbcConnection(dbConfig);
        try {
            if ("write".equals(queryDef.getKind())) {
                return executeWrite(conn, preparedSql, orderedParamNames, params);
            } else {
                return executeRead(conn, preparedSql, orderedParamNames, params);
            }
        } finally {
            try { conn.close(); } catch (Exception ignored) { /* intentionally ignored */ }
        }
    }

    // -------------------------------------------------------------------------
    // Exécution d'un SELECT
    // -------------------------------------------------------------------------

    private QueryRunResponse executeRead(Connection conn, String sql,
                                         List<String> paramNames,
                                         Map<String, Object> params) throws Exception {
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setQueryTimeout(TIMEOUT_SEC);
        bindParams(ps, paramNames, params);

        ResultSet rs = ps.executeQuery();
        ResultSetMetaData meta = rs.getMetaData();
        int cols = meta.getColumnCount();

        List<Map<String, Object>> rows = new ArrayList<>();
        while (rs.next()) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 1; i <= cols; i++) {
                row.put(meta.getColumnLabel(i), rs.getObject(i));
            }
            rows.add(row);
        }
        rs.close();
        ps.close();

        return QueryRunResponse.builder()
                .rows(rows)
                .rowsAffected(0)
                .durationMs(0)
                .build();
    }

    // -------------------------------------------------------------------------
    // Exécution d'un INSERT/UPDATE
    // -------------------------------------------------------------------------

    private QueryRunResponse executeWrite(Connection conn, String sql,
                                          List<String> paramNames,
                                          Map<String, Object> params) throws Exception {
        conn.setAutoCommit(false);
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setQueryTimeout(TIMEOUT_SEC);
            bindParams(ps, paramNames, params);

            int affected = ps.executeUpdate();
            conn.commit();
            ps.close();

            return QueryRunResponse.builder()
                    .rows(Collections.emptyList())
                    .rowsAffected(affected)
                    .durationMs(0)
                    .build();
        } catch (Exception e) {
            try { conn.rollback(); } catch (Exception ignored) { /* intentionally ignored */ }
            throw e;
        } finally {
            try { conn.setAutoCommit(true); } catch (Exception ignored) { /* intentionally ignored */ }
        }
    }

    // -------------------------------------------------------------------------
    // Helpers JDBC
    // -------------------------------------------------------------------------

    /**
     * Remplace les paramètres nommés {@code :paramName} par {@code ?} et
     * peuple {@code orderedParamNames} dans l'ordre d'apparition.
     * Jamais de concaténation de valeurs — SPEC §6 non négociable.
     */
    private String substitutedNamedParams(String sql, List<String> orderedParamNames) {
        Matcher m = NAMED_PARAM.matcher(sql);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            orderedParamNames.add(m.group(1));
            m.appendReplacement(sb, "?");
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private void bindParams(PreparedStatement ps,
                            List<String> paramNames,
                            Map<String, Object> params) throws Exception {
        for (int i = 0; i < paramNames.size(); i++) {
            Object value = params != null ? params.getOrDefault(paramNames.get(i), null) : null;
            ps.setObject(i + 1, value);
        }
    }

    /**
     * Ajoute {@code LIMIT <max>} si aucune clause LIMIT (ou TOP / ROWNUM) n'est déjà présente.
     * Approche simple basée sur la chaîne (le SQL a déjà été validé par JSqlParser).
     */
    private String ensureLimit(String sql, int max) {
        String lower = sql.toLowerCase(java.util.Locale.ROOT);
        if (lower.contains(" limit ") || lower.contains("\nlimit ")
                || lower.contains("rownum") || lower.startsWith("select top")) {
            return sql;
        }
        return sql + " LIMIT " + max;
    }

    // -------------------------------------------------------------------------
    // Audit
    // -------------------------------------------------------------------------

    private void writeAudit(UUID appId, int version, String queryId,
                            UUID userId, Map<String, Object> params,
                            int rowCount, int durationMs, String error) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String paramsJson = mapper.writeValueAsString(params);

            StudioQueryAudit audit = StudioQueryAudit.builder()
                    .appId(appId)
                    .version(version)
                    .queryId(queryId)
                    .userId(userId)
                    .params(paramsJson)
                    .rowCount(rowCount)
                    .durationMs(durationMs)
                    .error(error)
                    .build();
            auditRepository.save(audit);
        } catch (Exception e) {
            // L'échec de l'audit ne doit pas faire rater l'exécution
            log.error("Impossible d'écrire l'audit pour queryId={}: {}", queryId, e.getMessage());
        }
    }
}
