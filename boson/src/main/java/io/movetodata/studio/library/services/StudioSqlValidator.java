package io.movetodata.studio.library.services;

import io.movetodata.studio.library.dto.QueryDefDto;
import io.movetodata.studio.library.exceptions.SqlValidationException;
import lombok.extern.slf4j.Slf4j;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.Statements;
import net.sf.jsqlparser.statement.delete.Delete;
import net.sf.jsqlparser.statement.drop.Drop;
import net.sf.jsqlparser.statement.execute.Execute;
import net.sf.jsqlparser.statement.grant.Grant;
import net.sf.jsqlparser.statement.insert.Insert;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.truncate.Truncate;
import net.sf.jsqlparser.statement.update.Update;
import net.sf.jsqlparser.util.TablesNamesFinder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Validateur SQL pour le Studio de Webapps IA — SPEC §6, non négociable.
 *
 * Règles appliquées :
 * <ul>
 *   <li>Une seule instruction par requête (multi-statements interdits).</li>
 *   <li>read  : SELECT uniquement (CTE autorisées), pas de fonction dangereuse.</li>
 *   <li>write : INSERT ou UPDATE uniquement ; UPDATE doit avoir un WHERE.</li>
 *   <li>Toujours interdits : DELETE, DDL (CREATE/DROP/ALTER/TRUNCATE), GRANT, EXECUTE.</li>
 *   <li>Tables référencées ∈ allowedTables si la liste est non vide.</li>
 * </ul>
 */
@Slf4j
@Service
public class StudioSqlValidator {

    /**
     * Fonctions PostgreSQL/MySQL dangereuses interdites dans toute requête.
     * Comparaison insensible à la casse.
     */
    private static final List<String> DANGEROUS_FUNCTIONS = Arrays.asList(
            "pg_read_file",
            "pg_ls_dir",
            "lo_export",
            "load_file"
    );

    /**
     * Mots-clés SQL qui démarrent des instructions DDL/GRANT interdites.
     * Vérification pré-parse (certains parsers acceptent certaines variantes).
     * Format : le premier mot de l'instruction, en majuscules.
     */
    private static final List<String> FORBIDDEN_KEYWORDS = Arrays.asList(
            "GRANT", "REVOKE", "CREATE", "ALTER", "DROP", "TRUNCATE", "EXECUTE", "EXEC"
    );

    // -------------------------------------------------------------------------
    // Point d'entrée principal
    // -------------------------------------------------------------------------

    /**
     * Valide un {@link QueryDefDto} selon les règles SPEC §6.
     *
     * @param query        la requête à valider
     * @param allowedTables ensemble des tables autorisées (insensible à la casse) ;
     *                       si vide, pas de restriction de tables
     * @throws SqlValidationException si la requête viole une règle
     */
    public void validate(QueryDefDto query, Set<String> allowedTables) {
        if (query == null || query.getSql() == null || query.getSql().isBlank()) {
            throw new SqlValidationException("Le SQL de la requête est vide ou absent.");
        }

        String sql = query.getSql().trim();

        // 1. Vérification des fonctions dangereuses (chaîne, rapide)
        checkDangerousFunctions(sql);

        // 1b. Vérification des mots-clés d'instructions interdites (pré-parse)
        checkForbiddenKeyword(sql);

        // 2. Parse et détection multi-instructions
        Statement stmt = parseAndCheckSingleStatement(sql);

        // 3. Interdictions absolues (toujours, quel que soit kind)
        checkForbiddenStatementTypes(stmt);

        // 4. Validation selon le kind
        String kind = query.getKind();
        if ("read".equals(kind)) {
            validateRead(stmt);
        } else if ("write".equals(kind)) {
            validateWrite(stmt);
        } else {
            throw new SqlValidationException("Kind inconnu : « " + kind + " ». Valeurs acceptées : read, write.");
        }

        // 5. Vérification des tables autorisées
        if (!allowedTables.isEmpty()) {
            checkAllowedTables(stmt, allowedTables);
        }
    }

    // -------------------------------------------------------------------------
    // Étape 1 — Fonctions dangereuses
    // -------------------------------------------------------------------------

    private void checkDangerousFunctions(String sql) {
        String sqlLower = sql.toLowerCase(Locale.ROOT);
        for (String fn : DANGEROUS_FUNCTIONS) {
            // Cherche fn( (avec éventuel espace avant la parenthèse)
            String pattern = fn.toLowerCase(Locale.ROOT);
            int idx = sqlLower.indexOf(pattern);
            while (idx != -1) {
                // Vérifier que c'est bien un appel de fonction (suivi de '(' ou d'espaces puis '(')
                int after = idx + pattern.length();
                String remainder = sqlLower.substring(after).stripLeading();
                if (remainder.startsWith("(")) {
                    throw new SqlValidationException(
                            "Fonction SQL interdite détectée : " + fn);
                }
                idx = sqlLower.indexOf(pattern, idx + 1);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Étape 1b — Mot-clé d'instruction interdit
    // -------------------------------------------------------------------------

    /**
     * Rejette les instructions dont le premier mot correspond à un mot-clé interdit.
     * N'examine que le premier mot du SQL (la détection multi-instructions est faite par le parseur).
     * Ce contrôle pré-parse gère les cas où JSqlParser ne peut pas parser la syntaxe (ex. GRANT ALL).
     */
    private void checkForbiddenKeyword(String sql) {
        String firstWord = sql.strip().split("\\s+")[0].toUpperCase(Locale.ROOT);
        for (String keyword : FORBIDDEN_KEYWORDS) {
            if (keyword.equals(firstWord)) {
                throw new SqlValidationException(
                        keyword + " est interdit dans le Studio (SPEC §6).");
            }
        }
    }

    // -------------------------------------------------------------------------
    // Étape 2 — Parse + détection multi-instructions
    // -------------------------------------------------------------------------

    private Statement parseAndCheckSingleStatement(String sql) {
        try {
            Statements stmts = CCJSqlParserUtil.parseStatements(sql + ";");
            List<Statement> list = stmts.getStatements();
            if (list.size() > 1) {
                throw new SqlValidationException(
                        "Multi-instructions interdites (" + list.size() + " instructions détectées).");
            }
            if (list.isEmpty()) {
                throw new SqlValidationException("Aucune instruction SQL détectée.");
            }
            return list.get(0);
        } catch (JSQLParserException e) {
            throw new SqlValidationException("SQL invalide (impossible à parser) : " + e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Étape 3 — Types d'instructions toujours interdits
    // -------------------------------------------------------------------------

    private void checkForbiddenStatementTypes(Statement stmt) {
        if (stmt instanceof Delete) {
            throw new SqlValidationException("DELETE est interdit dans le Studio.");
        }
        if (stmt instanceof Drop) {
            throw new SqlValidationException("DROP est interdit dans le Studio.");
        }
        if (stmt instanceof Truncate) {
            throw new SqlValidationException("TRUNCATE est interdit dans le Studio.");
        }
        if (stmt instanceof Grant) {
            throw new SqlValidationException("GRANT est interdit dans le Studio.");
        }
        if (stmt instanceof Execute) {
            throw new SqlValidationException("EXECUTE est interdit dans le Studio.");
        }
        // DDL résiduel : CREATE, ALTER (pas de type JSqlParser dédié pour ALTER dans toutes versions)
        String stmtClass = stmt.getClass().getSimpleName().toUpperCase(Locale.ROOT);
        if (stmtClass.startsWith("CREATE") || stmtClass.startsWith("ALTER")) {
            throw new SqlValidationException("Instructions DDL (CREATE/ALTER) interdites dans le Studio.");
        }
    }

    // -------------------------------------------------------------------------
    // Étape 4a — Validation read
    // -------------------------------------------------------------------------

    private void validateRead(Statement stmt) {
        if (!(stmt instanceof Select)) {
            throw new SqlValidationException(
                    "Une requête de type « read » doit être un SELECT. "
                    + "Type détecté : " + stmt.getClass().getSimpleName() + ".");
        }
        // SELECT valide — les CTEs (WITH ... SELECT) sont gérées nativement par JSqlParser
        // comme un Select avec withItemsList non null.
    }

    // -------------------------------------------------------------------------
    // Étape 4b — Validation write
    // -------------------------------------------------------------------------

    private void validateWrite(Statement stmt) {
        if (stmt instanceof Insert) {
            // INSERT autorisé — y compris INSERT ... SELECT
            return;
        }
        if (stmt instanceof Update) {
            Update update = (Update) stmt;
            if (update.getWhere() == null) {
                throw new SqlValidationException(
                        "UPDATE sans clause WHERE est interdit (risque de mise à jour de toute la table).");
            }
            return;
        }
        throw new SqlValidationException(
                "Une requête de type « write » doit être un INSERT ou un UPDATE. "
                + "Type détecté : " + stmt.getClass().getSimpleName() + ".");
    }

    // -------------------------------------------------------------------------
    // Étape 5 — Tables autorisées
    // -------------------------------------------------------------------------

    private void checkAllowedTables(Statement stmt, Set<String> allowedTables) {
        TablesNamesFinder finder = new TablesNamesFinder();
        List<String> referenced = finder.getTableList(stmt);

        for (String table : referenced) {
            // Normaliser : enlever les guillemets et schéma éventuel
            String normalised = normaliseTableName(table);
            boolean allowed = allowedTables.stream()
                    .anyMatch(t -> t.equalsIgnoreCase(normalised));
            if (!allowed) {
                throw new SqlValidationException(
                        "Table non autorisée référencée dans la requête : « " + normalised
                        + " ». Tables autorisées : " + allowedTables + ".");
            }
        }
    }

    /**
     * Retire les guillemets doubles/backticks et le schéma éventuel.
     * Ex. : {@code "public"."commandes"} → {@code commandes}
     */
    private String normaliseTableName(String raw) {
        if (raw == null) return "";
        // Prendre la partie après le dernier '.'
        String name = raw.contains(".") ? raw.substring(raw.lastIndexOf('.') + 1) : raw;
        // Retirer les guillemets
        return name.replace("\"", "").replace("`", "").trim();
    }
}
