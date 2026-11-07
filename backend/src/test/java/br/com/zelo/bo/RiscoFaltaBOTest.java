package br.com.zelo.bo;

import br.com.zelo.model.Paciente;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RiscoFaltaBOTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 10, 8, 0);
    private static final Clock CLOCK = Clock.fixed(AGORA.atZone(SP).toInstant(), SP);

    private static Paciente paciente(int idade, boolean bolsa, int faltas) {
        return new Paciente(1L, "Ficticio", LocalDate.of(2026 - idade, 1, 1), "(11) 90000-0000", 0, 0,
                false, false, false, bolsa, false, false, faltas);
    }

    @Test
    void semPesosOResultadoEASigmoideDoIntercepto() {
        RiscoFaltaBO bo = new RiscoFaltaBO(new RiscoFaltaBO.Modelo("T", 0.0, 0.5, Map.of()), CLOCK);

        assertThat(bo.calcular(paciente(30, false, 0), AGORA.plusDays(3), false)).isEqualTo(0.5);
    }

    @Test
    void aplicaPesosSobreAsFeatures() {
        // z = -2 + 0,1*idade(30) + 1,0*faltas(2) = 3  →  sigmoide(3) = 0,953
        RiscoFaltaBO bo = new RiscoFaltaBO(new RiscoFaltaBO.Modelo("T", -2.0, 0.5,
                Map.of("idade", 0.1, "faltasAnteriores", 1.0)), CLOCK);

        assertThat(bo.calcular(paciente(30, false, 2), AGORA.plusDays(1), false)).isEqualTo(0.953);
    }

    @Test
    void diasDeAntecedenciaContamAPartirDeHoje() {
        RiscoFaltaBO bo = new RiscoFaltaBO(new RiscoFaltaBO.Modelo("T", 0.0, 0.5, Map.of("diasAntecedencia", 0.1)), CLOCK);

        double em10Dias = bo.calcular(paciente(30, false, 0), AGORA.plusDays(10), false);
        double hoje = bo.calcular(paciente(30, false, 0), AGORA, false);

        assertThat(em10Dias).isGreaterThan(hoje);
        assertThat(hoje).isEqualTo(0.5);
    }

    @Test
    void flagsEntramComoZeroOuUm() {
        RiscoFaltaBO bo = new RiscoFaltaBO(new RiscoFaltaBO.Modelo("T", 0.0, 0.5,
                Map.of("bolsaFamilia", 2.0, "lembreteEnviado", -2.0)), CLOCK);

        assertThat(bo.calcular(paciente(30, true, 0), AGORA, false)).isGreaterThan(0.85);
        assertThat(bo.calcular(paciente(30, false, 0), AGORA, true)).isLessThan(0.15);
    }

    @Test
    void featureDesconhecidaNoJsonFalhaNaSubida() {
        assertThatThrownBy(() -> new RiscoFaltaBO(new RiscoFaltaBO.Modelo("T", 0, 0.5, Map.of("altura", 1.0)), CLOCK))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("altura");
    }

    @Test
    void limiarDefineSeORiscoEAlto() {
        RiscoFaltaBO bo = new RiscoFaltaBO(new RiscoFaltaBO.Modelo("T", 0, 0.6, Map.of()), CLOCK);

        assertThat(bo.alto(0.6)).isTrue();
        assertThat(bo.alto(0.59)).isFalse();
        assertThat(bo.alto(null)).isFalse();
    }

    @Test
    void carregaOModeloProvisorioDoClasspath() throws Exception {
        RiscoFaltaBO bo = new RiscoFaltaBO(new ObjectMapper(), CLOCK);

        double risco = bo.calcular(paciente(40, true, 3), AGORA.plusDays(20), false);

        assertThat(risco).isBetween(0.0, 1.0);
        assertThat(bo.limiarAlto()).isBetween(0.0, 1.0);
    }
}
