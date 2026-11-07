package br.com.zelo.model;

import java.util.Set;

/**
 * AGENDADA → AGUARDANDO_CONFIRMACAO → CONFIRMADA | CANCELADA | NAO_RESPONDIDA;
 * CONFIRMADA e NAO_RESPONDIDA ainda podem virar REALIZADA ou FALTA (o paciente pode aparecer mesmo sem responder).
 * Encaixes nascem CONFIRMADA (criados no aceite da oferta), sem passar por transicao.
 */
public enum ConsultaStatus implements StatusTransicionavel<ConsultaStatus> {
    AGENDADA, AGUARDANDO_CONFIRMACAO, CONFIRMADA, CANCELADA, NAO_RESPONDIDA, REALIZADA, FALTA;

    @Override
    public Set<ConsultaStatus> proximos() {
        return switch (this) {
            case AGENDADA -> Set.of(AGUARDANDO_CONFIRMACAO, CANCELADA);
            case AGUARDANDO_CONFIRMACAO -> Set.of(CONFIRMADA, CANCELADA, NAO_RESPONDIDA);
            case CONFIRMADA -> Set.of(REALIZADA, FALTA, CANCELADA);
            // A vaga de uma NAO_RESPONDIDA ja foi liberada, entao cancelar depois nao faz sentido (evita vaga duplicada).
            case NAO_RESPONDIDA -> Set.of(REALIZADA, FALTA);
            case CANCELADA, REALIZADA, FALTA -> Set.of();
        };
    }

    /** Consulta cancelada ou nao respondida libera a vaga. */
    public boolean liberaVaga() {
        return this == CANCELADA || this == NAO_RESPONDIDA;
    }
}
