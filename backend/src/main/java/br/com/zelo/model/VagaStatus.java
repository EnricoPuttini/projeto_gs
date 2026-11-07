package br.com.zelo.model;

import java.util.Set;

/** ABERTA → EM_OFERTA → PREENCHIDA | ABERTA (oferta recusada/expirada) | PERDIDA (fila vazia ou vaga vencida). */
public enum VagaStatus implements StatusTransicionavel<VagaStatus> {
    ABERTA, EM_OFERTA, PREENCHIDA, PERDIDA;

    @Override
    public Set<VagaStatus> proximos() {
        return switch (this) {
            case ABERTA -> Set.of(EM_OFERTA, PERDIDA);
            case EM_OFERTA -> Set.of(PREENCHIDA, ABERTA, PERDIDA);
            case PREENCHIDA, PERDIDA -> Set.of();
        };
    }
}
