package br.com.zelo.config;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Relogio do modo demo: o do sistema mais um deslocamento que o botao "Avancar relogio" aumenta.
 * Existe so quando ZELO_DEMO_MODE=true; em producao o bean e Clock.system puro.
 */
public class AjustavelClock extends Clock {

    private final ZoneId zona;
    private final AtomicLong deslocamentoSegundos = new AtomicLong();

    public AjustavelClock(ZoneId zona) {
        this.zona = zona;
    }

    public void avancar(Duration duracao) {
        deslocamentoSegundos.addAndGet(duracao.toSeconds());
    }

    public void zerar() {
        deslocamentoSegundos.set(0);
    }

    @Override
    public ZoneId getZone() {
        return zona;
    }

    @Override
    public Clock withZone(ZoneId novaZona) {
        throw new UnsupportedOperationException("AjustavelClock usa sempre a zona configurada.");
    }

    @Override
    public Instant instant() {
        return Instant.now().plusSeconds(deslocamentoSegundos.get());
    }
}
