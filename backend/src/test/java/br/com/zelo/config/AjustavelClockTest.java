package br.com.zelo.config;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class AjustavelClockTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Test
    void avancarDesloca15MinutosParaFrente() {
        AjustavelClock clock = new AjustavelClock(SP);
        Instant antes = clock.instant();

        clock.avancar(Duration.ofMinutes(15));

        long segundos = Duration.between(antes, clock.instant()).toSeconds();
        assertThat(segundos).isBetween(899L, 902L);
    }

    @Test
    void avancosSeAcumulamEZerarVoltaAoRelogioReal() {
        AjustavelClock clock = new AjustavelClock(SP);

        clock.avancar(Duration.ofMinutes(15));
        clock.avancar(Duration.ofMinutes(15));
        assertThat(Duration.between(Instant.now(), clock.instant()).toMinutes()).isEqualTo(30);

        clock.zerar();
        assertThat(Duration.between(Instant.now(), clock.instant()).toSeconds()).isBetween(-1L, 1L);
    }

    @Test
    void usaSempreAZonaConfigurada() {
        assertThat(new AjustavelClock(SP).getZone()).isEqualTo(SP);
    }
}
