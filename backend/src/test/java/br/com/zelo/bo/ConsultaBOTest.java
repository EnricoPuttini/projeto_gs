package br.com.zelo.bo;

import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.dto.ConsultaRequest;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Origem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsultaBOTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    /** Relogio fixo: 10/11/2026 08:00 em Sao Paulo, para testes deterministicos. */
    private static final Clock CLOCK = Clock.fixed(LocalDateTime.of(2026, 11, 10, 8, 0).atZone(SP).toInstant(), SP);

    @Mock ConsultaDAO dao;
    @Mock VagaBO vagas;
    @Mock PacienteBO pacientes;
    @Mock UbsBO ubs;
    @Mock ReferenciaBO referencia;

    ConsultaBO bo;

    @BeforeEach
    void setUp() {
        bo = new ConsultaBO(dao, vagas, pacientes, ubs, referencia, CLOCK);
    }

    private static Consulta consulta(ConsultaStatus status) {
        return new Consulta(7L, 1L, 1L, 1L, LocalDateTime.of(2026, 11, 11, 9, 0), status, 0.3, Origem.NORMAL, false,
                LocalDateTime.of(2026, 11, 1, 9, 0));
    }

    @Test
    void cancelarGravaStatusEAbreVaga() {
        when(dao.buscarPorIdParaAtualizar(7L)).thenReturn(Optional.of(consulta(ConsultaStatus.AGUARDANDO_CONFIRMACAO)));

        Consulta resultado = bo.cancelar(7L);

        assertThat(resultado.status()).isEqualTo(ConsultaStatus.CANCELADA);
        verify(dao).atualizarStatus(7L, ConsultaStatus.CANCELADA);
        verify(vagas).abrirAPartirDe(argThat(c -> c.id().equals(7L) && c.status() == ConsultaStatus.CANCELADA));
    }

    @Test
    void confirmarNaoLiberaVaga() {
        when(dao.buscarPorIdParaAtualizar(7L)).thenReturn(Optional.of(consulta(ConsultaStatus.AGUARDANDO_CONFIRMACAO)));

        bo.confirmar(7L);

        verify(dao).atualizarStatus(7L, ConsultaStatus.CONFIRMADA);
        verifyNoInteractions(vagas);
    }

    @Test
    void naoRespondidaLiberaVaga() {
        when(dao.buscarPorIdParaAtualizar(7L)).thenReturn(Optional.of(consulta(ConsultaStatus.AGUARDANDO_CONFIRMACAO)));

        bo.transicionar(7L, ConsultaStatus.NAO_RESPONDIDA);

        verify(vagas).abrirAPartirDe(any());
    }

    @Test
    void transicaoInvalidaNaoGravaNemAbreVaga() {
        when(dao.buscarPorIdParaAtualizar(7L)).thenReturn(Optional.of(consulta(ConsultaStatus.REALIZADA)));

        assertThatThrownBy(() -> bo.cancelar(7L))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("REALIZADA → CANCELADA");

        verify(dao, never()).atualizarStatus(anyLong(), any());
        verifyNoInteractions(vagas);
    }

    @Test
    void consultaInexistenteLancaNaoEncontrado() {
        when(dao.buscarPorIdParaAtualizar(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bo.cancelar(99L)).isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void naoAgendaNoPassado() {
        ConsultaRequest r = new ConsultaRequest(1L, 1L, 1L, LocalDateTime.of(2026, 11, 10, 7, 59));

        assertThatThrownBy(() -> bo.agendar(r))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("futuro");
        verify(dao, never()).inserir(any());
    }

    @Test
    void agendaNasceAgendadaComOrigemNormal() {
        LocalDateTime quando = LocalDateTime.of(2026, 11, 12, 9, 0);
        when(dao.inserir(any())).thenReturn(10L);
        when(dao.buscarPorId(10L)).thenReturn(Optional.of(consulta(ConsultaStatus.AGENDADA)));

        bo.agendar(new ConsultaRequest(1L, 1L, 1L, quando));

        verify(dao).inserir(argThat(c -> c.status() == ConsultaStatus.AGENDADA && c.origem() == Origem.NORMAL
                && c.criadaEm().equals(LocalDateTime.of(2026, 11, 10, 8, 0)) && c.dataHora().equals(quando)));
    }

    @Test
    void relogioInjetadoDefineAgendaDoDia() {
        bo.listarAgenda(1L, null);

        verify(dao).listarPorUbsEPeriodo(1L, LocalDateTime.of(2026, 11, 10, 0, 0), LocalDateTime.of(2026, 11, 11, 0, 0));
        assertThat(Instant.now(CLOCK)).isEqualTo(CLOCK.instant());
    }
}
