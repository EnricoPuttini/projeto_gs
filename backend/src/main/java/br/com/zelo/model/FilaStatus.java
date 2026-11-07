package br.com.zelo.model;

import java.util.Set;

public enum FilaStatus implements StatusTransicionavel<FilaStatus> {
    ATIVA, ATENDIDA, SAIU;

    @Override
    public Set<FilaStatus> proximos() {
        return this == ATIVA ? Set.of(ATENDIDA, SAIU) : Set.of();
    }
}
