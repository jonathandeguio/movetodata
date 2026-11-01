package io.movetodata.studio.library.exceptions;

/**
 * Levée quand une requête SQL ne satisfait pas les contraintes de la SPEC §6.
 * Non négociable : aucun SQL interdit ne doit passer.
 */
public class SqlValidationException extends RuntimeException {

    public SqlValidationException(String message) {
        super(message);
    }
}
