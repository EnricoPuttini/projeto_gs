package br.com.zelo.model;

import java.util.Set;

public enum OfertaStatus implements StatusTransicionavel<OfertaStatus> {
    PENDENTE, ACEITA, RECUSADA, EXPIRADA;

    @Override
    public Set<OfertaStatus> proximos() {
        return this == PENDENTE ? Set.of(ACEITA, RECUSADA, EXPIRADA) : Set.of();
    }
}
