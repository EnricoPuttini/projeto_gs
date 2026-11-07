package br.com.zelo.bo;

import br.com.zelo.config.ZeloProperties;
import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Especialidade;
import br.com.zelo.model.Origem;
import br.com.zelo.model.Ubs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConfirmacaoBOTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 10, 18, 0);
    private static final Clock CLOCK = Clock.fixed(AGORA.atZone(SP).toInstant(), SP);
    private static final ZeloProperties PROPS = new ZeloProperties(List.of(), false, SP,
            new ZeloProperties.Encaixe(15), new ZeloProperties.Confirmacao(4), new ZeloProperties.Impacto(45));

    @Mock ConsultaDAO dao;
    @Mock ConsultaBO consultaBO;
    @Mock UbsBO ubs;
    @Mock ReferenciaBO referencia;
    @Mock CanalMensageria canal;

    ConfirmacaoBO bo;

    @BeforeEach
    void setUp() {
        bo = new ConfirmacaoBO(dao, consultaBO, ubs, referencia, canal, PROPS, CLOCK);
        when(ubs.buscar(1L)).thenReturn(new Ubs(1L, "UBS Teste", "Rua Teste", 0, 0));
        when(referencia.buscarEspecialidade(1L)).thenReturn(new Especialidade(1L, "Clinica Geral"));
    }

    private static Consulta consulta(long id, long pacienteId, LocalDateTime dataHora, ConsultaStatus status) {
        return new Consulta(id, pacienteId, 1L, 1L, dataHora, status, 0.3, Origem.NORMAL, false, AGORA.minusDays(5));
    }

    @Test
    void pedeConfirmacaoDasConsultasAgendadasDeAmanha() {
        LocalDateTime amanha9h = LocalDateTime.of(2026, 11, 11, 9, 0);
        when(dao.listarPorStatusEPeriodo(ConsultaStatus.AGENDADA, LocalDateTime.of(2026, 11, 11, 0, 0), LocalDateTime.of(2026, 11, 12, 0, 0)))
                .thenReturn(List.of(consulta(1, 10, amanha9h, ConsultaStatus.AGENDADA), consulta(2, 11, amanha9h, ConsultaStatus.AGENDADA)));

        int enviadas = bo.pedirConfirmacoesDeAmanha();

        assertThat(enviadas).isEqualTo(2);
        verify(consultaBO).transicionar(1L, ConsultaStatus.AGUARDANDO_CONFIRMACAO);
        verify(consultaBO).transicionar(2L, ConsultaStatus.AGUARDANDO_CONFIRMACAO);
        verify(canal).enviar(eq(10L), contains("Você vai?"), eq("CONFIRMACAO_D1"));
        verify(canal).enviar(eq(11L), any(), eq("CONFIRMACAO_D1"));
    }

    @Test
    void consultaQueFalhaNaTransicaoNaoImpedeAsOutras() {
        LocalDateTime amanha9h = LocalDateTime.of(2026, 11, 11, 9, 0);
        when(dao.listarPorStatusEPeriodo(any(), any(), any()))
                .thenReturn(List.of(consulta(1, 10, amanha9h, ConsultaStatus.AGENDADA), consulta(2, 11, amanha9h, ConsultaStatus.AGENDADA)));
        doThrow(new RegraNegocioException("inválida")).when(consultaBO).transicionar(1L, ConsultaStatus.AGUARDANDO_CONFIRMACAO);

        assertThat(bo.pedirConfirmacoesDeAmanha()).isEqualTo(1);

        verify(canal, never()).enviar(eq(10L), any(), any());
        verify(canal).enviar(eq(11L), any(), any());
    }

    @Test
    void semRespostaAteXHorasAntesViraNaoRespondidaELiberaVaga() {
        // agora = 18:00; limite configurado = 4 h => consultas ate 22:00 do mesmo dia ja devem ser liberadas
        LocalDateTime limite = AGORA.plusHours(4);
        when(dao.listarPorStatusAte(ConsultaStatus.AGUARDANDO_CONFIRMACAO, limite))
                .thenReturn(List.of(consulta(1, 10, LocalDateTime.of(2026, 11, 10, 21, 0), ConsultaStatus.AGUARDANDO_CONFIRMACAO)));

        int liberadas = bo.liberarSemResposta();

        assertThat(liberadas).isEqualTo(1);
        // ConsultaBO.transicionar e quem abre a vaga (e dispara o encaixe) ao ver NAO_RESPONDIDA
        verify(consultaBO).transicionar(1L, ConsultaStatus.NAO_RESPONDIDA);
        verify(canal).enviar(eq(10L), contains("foi liberada"), eq("CONSULTA_LIBERADA"));
    }

    @Test
    void naoLiberaNadaQuandoNaoHaConsultasNoPrazo() {
        when(dao.listarPorStatusAte(any(), any())).thenReturn(List.of());

        assertThat(bo.liberarSemResposta()).isZero();

        verify(consultaBO, never()).transicionar(anyLong(), any());
        verifyNoInteractions(canal);
    }
}
