package io.movetodata.studio.library.exceptions;

/**
 * Levée quand l'exécution d'une requête SQL échoue côté JDBC.
 */
public class QueryExecutionException extends RuntimeException {

    public QueryExecutionException(String message) {
        super(message);
    }

    public QueryExecutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
