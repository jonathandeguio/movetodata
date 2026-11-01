package io.movetodata.studio;

import io.movetodata.studio.library.dto.QueryDefDto;
import io.movetodata.studio.library.exceptions.SqlValidationException;
import io.movetodata.studio.library.services.StudioSqlValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests d'attaque et de conformité pour {@link StudioSqlValidator} — SPEC §6.
 *
 * Les tests marqués "doit ÉCHOUER" vérifient que les requêtes dangereuses
 * lèvent bien {@link SqlValidationException}.
 *
 * Les tests marqués "doit PASSER" vérifient que les requêtes valides
 * passent sans exception.
 */
@DisplayName("StudioSqlValidator — tests de validation SQL (SPEC §6)")
class StudioSqlValidatorTest {

    private StudioSqlValidator validator;

    @BeforeEach
    void setUp() {
        validator = new StudioSqlValidator();
    }

    // =========================================================================
    // Tests qui doivent ÉCHOUER
    // =========================================================================

    @Nested
    @DisplayName("Requêtes qui doivent être REJETÉES")
    class ShouldFail {

        @Test
        @DisplayName("1. Multi-statements : SELECT 1; DROP TABLE users")
        void multiStatements() {
            QueryDefDto q = readQuery("SELECT 1; DROP TABLE users");
            assertThatThrownBy(() -> validator.validate(q, Collections.emptySet()))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("Multi-instructions");
        }

        @Test
        @DisplayName("2. DELETE interdit")
        void deleteStatement() {
            QueryDefDto q = writeQuery("DELETE FROM commandes WHERE id = :id");
            assertThatThrownBy(() -> validator.validate(q, Collections.emptySet()))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("DELETE");
        }

        @Test
        @DisplayName("3. DDL DROP interdit")
        void ddlDrop() {
            QueryDefDto q = readQuery("DROP TABLE commandes");
            assertThatThrownBy(() -> validator.validate(q, Collections.emptySet()))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("DROP");
        }

        @Test
        @DisplayName("4. UPDATE sans WHERE interdit")
        void updateWithoutWhere() {
            QueryDefDto q = writeQuery("UPDATE commandes SET statut = 'X'");
            assertThatThrownBy(() -> validator.validate(q, Collections.emptySet()))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("WHERE");
        }

        @Test
        @DisplayName("5. Table non autorisée : pg_shadow avec allowedTables={commandes}")
        void unauthorisedTable() {
            QueryDefDto q = readQuery("SELECT * FROM pg_shadow");
            assertThatThrownBy(() -> validator.validate(q, Set.of("commandes")))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("pg_shadow");
        }

        @Test
        @DisplayName("6. Fonction dangereuse : pg_read_file")
        void dangerousFunction() {
            QueryDefDto q = readQuery("SELECT pg_read_file('/etc/passwd')");
            assertThatThrownBy(() -> validator.validate(q, Collections.emptySet()))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("pg_read_file");
        }

        @Test
        @DisplayName("7. GRANT interdit")
        void grantStatement() {
            QueryDefDto q = readQuery("GRANT ALL ON commandes TO public");
            assertThatThrownBy(() -> validator.validate(q, Collections.emptySet()))
                    .isInstanceOf(SqlValidationException.class)
                    .hasMessageContaining("GRANT");
        }
    }

    // =========================================================================
    // Tests qui doivent PASSER
    // =========================================================================

    @Nested
    @DisplayName("Requêtes qui doivent être ACCEPTÉES")
    class ShouldPass {

        @Test
        @DisplayName("8. INSERT write avec SELECT (doit passer)")
        void insertSelectWrite() {
            QueryDefDto q = writeQuery("INSERT INTO logs SELECT * FROM source");
            assertThatNoException()
                    .isThrownBy(() -> validator.validate(q, Collections.emptySet()));
        }

        @Test
        @DisplayName("9. SELECT simple avec paramètre nommé")
        void simpleSelect() {
            QueryDefDto q = readQuery("SELECT id, montant FROM commandes WHERE statut = :statut");
            assertThatNoException()
                    .isThrownBy(() -> validator.validate(q, Collections.emptySet()));
        }

        @Test
        @DisplayName("10. SELECT avec CTE (WITH ... SELECT)")
        void selectWithCte() {
            QueryDefDto q = readQuery("WITH t AS (SELECT 1 AS n) SELECT * FROM t");
            assertThatNoException()
                    .isThrownBy(() -> validator.validate(q, Collections.emptySet()));
        }

        @Test
        @DisplayName("11. UPDATE avec WHERE")
        void updateWithWhere() {
            QueryDefDto q = writeQuery("UPDATE commandes SET statut = :statut WHERE id = :id");
            assertThatNoException()
                    .isThrownBy(() -> validator.validate(q, Collections.emptySet()));
        }

        @Test
        @DisplayName("12. INSERT classique avec VALUES")
        void insertValues() {
            QueryDefDto q = writeQuery(
                    "INSERT INTO commandes (client, montant) VALUES (:client, :montant)");
            assertThatNoException()
                    .isThrownBy(() -> validator.validate(q, Collections.emptySet()));
        }

        @Test
        @DisplayName("13. SELECT sur table autorisée (allowedTables non vide)")
        void selectOnAllowedTable() {
            QueryDefDto q = readQuery("SELECT id, montant FROM commandes WHERE id = :id");
            assertThatNoException()
                    .isThrownBy(() -> validator.validate(q, Set.of("commandes")));
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private QueryDefDto readQuery(String sql) {
        return QueryDefDto.builder().id("q_test").kind("read").sql(sql).build();
    }

    private QueryDefDto writeQuery(String sql) {
        return QueryDefDto.builder().id("q_test").kind("write").sql(sql).build();
    }
}
