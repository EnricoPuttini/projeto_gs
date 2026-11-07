package br.com.zelo.exception;

/** Registro inexistente. Vira HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String recurso, Long id) {
        super(recurso + " " + id + " não encontrado(a).");
    }
}
