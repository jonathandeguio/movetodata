package io.movetodata.ai.library.services;

import io.movetodata.connect.library.models.DatabaseSourceConfig;
import io.movetodata.connect.library.models.Result;
import io.movetodata.connect.library.models.Results;
import io.movetodata.connect.library.services.JDBCService;
import io.movetodata.connect.library.services.SourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AiInsightsService — F2 (Augmented Analytics) backend logic for Boson.
 *
 * Responsibilities:
 *  1. Resolve dataset → JDBC source (via TextToSqlService).
 *  2. Determine the target table that exposes column_x and column_y.
 *  3. Fetch up to {@value #MAX_ROWS} rows via JDBC.
 *  4. Convert the result set to the list-of-lists format expected by the
 *     movetodata-ai Python service.
 *
 * Sovereignty: the data is fetched from the customer's own infrastructure and
 * forwarded only to the movetodata-ai service running on the same Docker
 * network — it never leaves the MoveToData infrastructure.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiInsightsService {

    /** Hard cap on rows forwarded to the Python analytics service. */
    static final int MAX_ROWS = 10_000;

    private final TextToSqlService textToSqlService;
    private final SourceService sourceService;
    private final JDBCService jdbcService;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Fetch up to {@value #MAX_ROWS} rows of (column_x, column_y) data from
     * the JDBC source linked to the given dataset.
     *
     * The method:
     * <ol>
     *   <li>Resolves the source config from the dataset / branch.</li>
     *   <li>Discovers tables in the source and picks the first table that
     *       exposes both {@code columnX} and {@code columnY}.</li>
     *   <li>Executes {@code SELECT columnX, columnY FROM table LIMIT maxRows}.</li>
     * </ol>
     *
     * @param datasetId UUID of the kitab dataset resource.
     * @param branch    Branch name (e.g. "master").
     * @param columnX   Name of the X-axis / dimension column.
     * @param columnY   Name of the metric / value column.
     * @return A map containing:
     *         <ul>
     *           <li>{@code data}    – list of rows (each row is a list of string values)</li>
     *           <li>{@code columns} – list of column name strings</li>
     *         </ul>
     * @throws IllegalArgumentException if no suitable source / table is found.
     * @throws Exception                on JDBC or network errors.
     */
    public Map<String, Object> fetchDataForInsights(
            UUID datasetId,
            String branch,
            String columnX,
            String columnY) throws Exception {

        DatabaseSourceConfig config =
                textToSqlService.getSourceConfigForDataset(datasetId, branch);

        // Find a table that contains both requested columns
        String tableName = resolveTable(config, columnX, columnY);

        // Build SELECT query with sanitised identifiers
        String safeColX = sanitizeIdentifier(columnX);
        String safeColY = sanitizeIdentifier(columnY);
        String safeTable = sanitizeIdentifier(tableName);

        String sql = String.format(
                "SELECT %s, %s FROM %s LIMIT %d",
                safeColX, safeColY, safeTable, MAX_ROWS
        );

        log.info(
                "fetchDataForInsights: dataset={} branch={} sql={}",
                datasetId, branch, sql
        );

        Results results = jdbcService.executeJdbc(config, sql);
        return convertResults(results, columnX, columnY);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Iterate through the source tables and return the name of the first table
     * that exposes both {@code columnX} and {@code columnY}.
     *
     * Falls back to the first available table if column introspection fails for
     * all tables — the SQL query will then surface a descriptive JDBC error.
     */
    private String resolveTable(
            DatabaseSourceConfig config,
            String columnX,
            String columnY) {

        try {
            Results tablesResult = sourceService.getSourceTables(config);
            if (tablesResult.getResults().isEmpty()) {
                throw new IllegalArgumentException(
                        "No tables found in source — cannot resolve target table");
            }

            List<List<String>> tables = tablesResult.getResults().get(0).getData();
            String fallback = null;

            for (List<String> row : tables) {
                String tableName = row.size() > 1 ? row.get(1) : null;
                if (tableName == null || tableName.isBlank()) continue;

                if (fallback == null) {
                    fallback = tableName;
                }

                // Try to verify that the table has both columns
                try {
                    Results schemaResult =
                            sourceService.getSourceTableSchema(config, tableName);
                    if (schemaResult.getResults().isEmpty()) continue;

                    Set<String> colNames = schemaResult.getResults()
                            .get(0)
                            .getData()
                            .stream()
                            .filter(r -> !r.isEmpty())
                            .map(r -> r.get(0).toLowerCase())
                            .collect(Collectors.toSet());

                    if (colNames.contains(columnX.toLowerCase())
                            && colNames.contains(columnY.toLowerCase())) {
                        return tableName;
                    }
                } catch (Exception e) {
                    log.debug("resolveTable: schema introspection failed for table {} — {}",
                            tableName, e.getMessage());
                }
            }

            if (fallback != null) {
                log.warn(
                        "resolveTable: could not verify columns in any table — "
                        + "falling back to first table '{}'",
                        fallback
                );
                return fallback;
            }

            throw new IllegalArgumentException("Source has no tables available");

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Table resolution failed: " + e.getMessage(), e);
        }
    }

    /**
     * Convert a {@link Results} object (list-of-string rows) to the map format
     * expected by the Python /insights endpoint.
     */
    private Map<String, Object> convertResults(
            Results results,
            String columnX,
            String columnY) {

        List<List<Object>> data = new ArrayList<>();
        List<String> columns = List.of(columnX, columnY);

        if (results == null || results.getResults().isEmpty()) {
            return Map.of("data", data, "columns", columns);
        }

        for (Result result : results.getResults()) {
            List<List<String>> rows = result.getData();
            if (rows == null) continue;
            for (List<String> row : rows) {
                // Each row has 2 elements aligned with [columnX, columnY]
                List<Object> converted = new ArrayList<>();
                for (String val : row) {
                    converted.add(val);  // strings; pandas coerces numerics
                }
                data.add(converted);
            }
        }

        return Map.of("data", data, "columns", columns);
    }

    /**
     * Sanitize a SQL identifier by stripping non-alphanumeric-underscore
     * characters. This is a defence-in-depth measure; the column / table names
     * ultimately come from the authenticated user's chart configuration.
     */
    private static String sanitizeIdentifier(String name) {
        if (name == null) throw new IllegalArgumentException("Identifier must not be null");
        // Keep letters, digits, underscores, and dots (for schema.table)
        String sanitized = name.replaceAll("[^\\w.]", "");
        if (sanitized.isBlank()) {
            throw new IllegalArgumentException("Identifier is empty after sanitisation: " + name);
        }
        return sanitized;
    }
}
