package io.movetodata.ai.library.services;

import io.movetodata.connect.library.enums.SourceTypeEnum;
import io.movetodata.connect.library.models.DatabaseSourceConfig;
import io.movetodata.connect.library.models.Link;
import io.movetodata.connect.library.models.Results;
import io.movetodata.connect.library.repository.LinkRepository;
import io.movetodata.connect.library.services.JdbcUtils;
import io.movetodata.connect.library.services.SourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * TextToSqlService — F1 (Text-to-SQL) backend logic for Boson.
 *
 * Responsibilities:
 *  1. Resolve dataset → JDBC source via the connect_links table.
 *  2. Introspect the source schema (tables + columns) and format it as
 *     simplified DDL: "TABLE name (col1 TYPE, col2 TYPE, …)".
 *  3. Validate that a LLM-generated SQL is a safe DQL query via JdbcUtils.
 *
 * The generated DDL is forwarded to the movetodata-ai Python service — it
 * contains only table/column names and types, never actual data values.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TextToSqlService {

    /** Maximum number of tables included in the schema DDL sent to the LLM. */
    private static final int MAX_TABLES = 15;

    /** Maximum number of columns per table included in the DDL. */
    private static final int MAX_COLUMNS_PER_TABLE = 30;

    private final SourceService sourceService;
    private final LinkRepository linkRepository;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Resolve the source UUID associated with a dataset.
     *
     * @param datasetId UUID of the kitab dataset resource.
     * @param branch    Branch name (e.g. "master").
     * @return the source UUID.
     * @throws IllegalArgumentException if no link exists for the dataset.
     */
    public UUID getSourceIdForDataset(UUID datasetId, String branch) {
        Link link = linkRepository.findByDatasetIdAndBranch(datasetId, branch)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No link found for dataset " + datasetId + " / branch " + branch));

        if (link.getSourceId() == null) {
            throw new IllegalArgumentException(
                    "Link " + link.getId() + " has no associated source");
        }
        return link.getSourceId();
    }

    /**
     * Resolve the JDBC source associated with a dataset and return its
     * {@link DatabaseSourceConfig}.
     *
     * @param datasetId UUID of the kitab dataset resource.
     * @param branch    Branch name (e.g. "master").
     * @return the {@link DatabaseSourceConfig} for the linked JDBC source.
     * @throws IllegalArgumentException if no JDBC link exists for the dataset.
     */
    public DatabaseSourceConfig getSourceConfigForDataset(UUID datasetId, String branch) {
        UUID sourceId = getSourceIdForDataset(datasetId, branch);
        return sourceService.getSourceDatabaseSourceConfig(sourceId);
    }

    /**
     * Build a simplified DDL string for the given source, suitable for
     * inclusion in an LLM prompt.
     *
     * Format:
     * <pre>
     * TABLE schema1.table1 (col1 VARCHAR, col2 BIGINT, col3 DATE)
     * TABLE schema1.table2 (id INT, name VARCHAR)
     * …
     * </pre>
     *
     * At most {@value #MAX_TABLES} tables and {@value #MAX_COLUMNS_PER_TABLE}
     * columns per table are included to keep the prompt within a reasonable
     * token budget.
     *
     * @param config the database source configuration.
     * @return the DDL string, or an empty string if introspection is not
     *         supported for this DB type.
     */
    public String buildSchemaDdl(DatabaseSourceConfig config) {
        try {
            Results tablesResult = sourceService.getSourceTables(config);
            if (tablesResult.getResults().isEmpty()
                    || tablesResult.getResults().get(0).getData().isEmpty()) {
                log.warn("buildSchemaDdl: no tables found for source type {}", config.getDbmsType());
                return "";
            }

            List<List<String>> tables = tablesResult.getResults().get(0).getData();
            StringBuilder ddl = new StringBuilder();
            int tableCount = 0;

            for (List<String> row : tables) {
                if (tableCount >= MAX_TABLES) break;

                // Columns: [table_schema, table_name, table_type]
                String schema = row.size() > 0 ? row.get(0) : "";
                String tableName = row.size() > 1 ? row.get(1) : "";
                if (tableName == null || tableName.isBlank()) continue;

                String qualifiedName = (schema != null && !schema.isBlank())
                        ? schema + "." + tableName
                        : tableName;

                List<String> columnDefs = buildColumnDefs(config, tableName);
                if (columnDefs.isEmpty()) {
                    // Still include the table but with an empty column list
                    ddl.append("TABLE ").append(qualifiedName).append(" ()\n");
                } else {
                    ddl.append("TABLE ").append(qualifiedName)
                            .append(" (")
                            .append(String.join(", ", columnDefs))
                            .append(")\n");
                }
                tableCount++;
            }

            return ddl.toString().trim();

        } catch (Exception e) {
            log.warn("buildSchemaDdl: could not introspect source of type {} — {}",
                    config.getDbmsType(), e.getMessage());
            return "";
        }
    }

    /**
     * Validate that a SQL string is a safe DQL query (SELECT / WITH / EXPLAIN)
     * for the given DBMS type.
     *
     * @param sql        the SQL string to validate.
     * @param sourceType the DBMS type from {@link SourceTypeEnum}.
     * @return {@code true} if the query is a valid DQL statement.
     */
    public boolean validateDql(String sql, SourceTypeEnum sourceType) {
        if (sql == null || sql.isBlank()) return false;
        try {
            return JdbcUtils.isValidDQLQuery(sql, sourceType);
        } catch (Exception e) {
            log.warn("validateDql: JdbcUtils threw for type {} — {}", sourceType, e.getMessage());
            // Fallback: accept only simple SELECT
            return sql.trim().toUpperCase().startsWith("SELECT ");
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Fetch column definitions for a single table and format them as
     * {@code "column_name TYPE"} strings.
     */
    private List<String> buildColumnDefs(DatabaseSourceConfig config, String tableName) {
        try {
            Results columnsResult = sourceService.getSourceTableSchema(config, tableName);
            if (columnsResult.getResults().isEmpty()) return List.of();

            List<List<String>> rows = columnsResult.getResults().get(0).getData();
            List<String> defs = new ArrayList<>();
            int colCount = 0;

            for (List<String> row : rows) {
                if (colCount >= MAX_COLUMNS_PER_TABLE) break;
                // Columns: [column_name, data_type, …]
                if (row.size() < 2) continue;
                String colName = row.get(0);
                String colType = row.get(1);
                if (colName == null || colName.isBlank()) continue;
                defs.add(colName + " " + (colType != null ? colType.toUpperCase() : "UNKNOWN"));
                colCount++;
            }

            return defs;

        } catch (Exception e) {
            log.warn("buildColumnDefs: could not fetch schema for table {} — {}", tableName, e.getMessage());
            return List.of();
        }
    }
}
