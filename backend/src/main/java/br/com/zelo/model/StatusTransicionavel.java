package br.com.zelo.model;

import br.com.zelo.exception.RegraNegocioException;

import java.util.Set;

/**
 * Maquina de estados declarativa: cada enum diz para onde pode ir. Os BOs chamam
 * {@link #validarTransicaoPara} antes de gravar, entao nenhum status muda "na mao".
 */
public interface StatusTransicionavel<E extends Enum<E>> {

    Set<E> proximos();

    @SuppressWarnings("unchecked")
    default void validarTransicaoPara(E destino) {
        if (!proximos().contains(destino)) {
            throw new RegraNegocioException("Transição de status inválida: %s → %s."
                    .formatted(((E) this).name(), destino.name()));
        }
    }
}
