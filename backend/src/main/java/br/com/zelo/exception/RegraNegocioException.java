package br.com.zelo.exception;

/** Violacao de regra de negocio (ex.: transicao de status invalida). Vira HTTP 422. */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String message) {
        super(message);
    }
}
