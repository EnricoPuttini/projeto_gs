package br.com.zelo.bo;

import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.FilaStatus;
import br.com.zelo.model.Paciente;
import br.com.zelo.model.Ubs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.lenient;

/** Ordem do encaixe: prioridade legal → gravidade → dias de espera → distancia → menor risco → id. */
@ExtendWith(MockitoExtension.class)
class RankingFilaTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 10, 8, 0);
    private static final Clock CLOCK = Clock.fixed(AGORA.atZone(SP).toInstant(), SP);
    private static final Ubs UBS = new Ubs(1L, "UBS Teste", "Rua Teste", -23.5600, -46.6400);
    private static final LocalDateTime VAGA = AGORA.plusDays(1);

    @Mock RiscoFaltaBO risco;
    RankingFila ranking;

    @BeforeEach
    void setUp() {
        lenient().when(risco.calcular(any(), any(), anyBoolean())).thenReturn(0.3);
        ranking = new RankingFila(risco, CLOCK);
    }

    /** Adulto de 30 anos, sem prioridade, a ~1,1 km da UBS (por padrao). */
    private static Paciente adulto(long id, double lat) {
        return new Paciente(id, "Paciente " + id, LocalDate.of(1996, 1, 1), "(11) 90000-000" + id, lat, -46.6400,
                false, false, false, false, false, false, 0);
    }

    private static Paciente idoso(long id) {
        return new Paciente(id, "Idoso " + id, LocalDate.of(1950, 1, 1), "(11) 90000-000" + id, -23.5700, -46.6400,
                false, false, false, false, false, false, 0);
    }

    private static FilaEspera fila(long id, long pacienteId, int gravidade, int diasEspera) {
        return new FilaEspera(id, pacienteId, 1L, 1L, AGORA.minusDays(diasEspera), gravidade, FilaStatus.ATIVA);
    }

    private List<Long> ordem(List<FilaEspera> fila, Paciente... pacientes) {
        Map<Long, Paciente> porId = new java.util.HashMap<>();
        for (Paciente p : pacientes) {
            porId.put(p.id(), p);
        }
        return ranking.ranquear(UBS, fila, porId, VAGA).stream().map(c -> c.fila().id()).toList();
    }

    @Test
    void prioridadeLegalVenceGravidadeEEspera() {
        // idoso com gravidade 1 e pouca espera passa na frente de adulto grave que espera ha mais tempo
        assertThat(ordem(List.of(fila(1, 1, 3, 100), fila(2, 2, 1, 1)), adulto(1, -23.5700), idoso(2)))
                .containsExactly(2L, 1L);
    }

    @Test
    void gravidadeVenceDiasDeEspera() {
        assertThat(ordem(List.of(fila(1, 1, 1, 200), fila(2, 2, 3, 5)), adulto(1, -23.57), adulto(2, -23.57)))
                .containsExactly(2L, 1L);
    }

    @Test
    void maisDiasDeEsperaVenceDistancia() {
        // paciente 1 esta mais perto, mas o 2 espera ha mais tempo
        assertThat(ordem(List.of(fila(1, 1, 2, 10), fila(2, 2, 2, 30)), adulto(1, -23.5601), adulto(2, -23.5800)))
                .containsExactly(2L, 1L);
    }

    @Test
    void empateEmTudoAteAquiDesempataPelaDistancia() {
        assertThat(ordem(List.of(fila(1, 1, 2, 10), fila(2, 2, 2, 10)), adulto(1, -23.5800), adulto(2, -23.5620)))
                .containsExactly(2L, 1L);
    }

    @Test
    void empateTotalDesempataPeloMenorRiscoDeFalta() {
        Paciente a = adulto(1, -23.57);
        Paciente b = adulto(2, -23.57);
        lenient().when(risco.calcular(a, VAGA, false)).thenReturn(0.8);
        lenient().when(risco.calcular(b, VAGA, false)).thenReturn(0.1);

        assertThat(ordem(List.of(fila(1, 1, 2, 10), fila(2, 2, 2, 10)), a, b)).containsExactly(2L, 1L);
    }

    @Test
    void empateAbsolutoUsaIdDaFilaParaSerDeterministico() {
        assertThat(ordem(List.of(fila(9, 2, 2, 10), fila(4, 1, 2, 10)), adulto(1, -23.57), adulto(2, -23.57)))
                .containsExactly(4L, 9L);
    }

    @Test
    void expoeOsCriteriosCalculados() {
        RankingFila.Candidato c = ranking.ranquear(UBS, List.of(fila(1, 2, 2, 12)), Map.of(2L, idoso(2)), VAGA).getFirst();

        assertThat(c.prioridadeLegal()).isTrue();
        assertThat(c.diasEspera()).isEqualTo(12);
        assertThat(c.distanciaKm()).isBetween(1.0, 1.2);
    }
}
