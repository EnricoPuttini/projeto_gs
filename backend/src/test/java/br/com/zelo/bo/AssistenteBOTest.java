package br.com.zelo.bo;

import br.com.zelo.dto.AssistenteDTOs.Requisicao;
import br.com.zelo.dto.AssistenteDTOs.Resposta;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Direcao;
import br.com.zelo.model.Especialidade;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Origem;
import br.com.zelo.model.Paciente;
import br.com.zelo.model.Ubs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssistenteBOTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 10, 8, 0);
    private static final Clock CLOCK = Clock.fixed(AGORA.atZone(SP).toInstant(), SP);
    private static final LocalDateTime AMANHA_9H = AGORA.plusDays(1).withHour(9);

    @Mock PacienteBO pacientes;
    @Mock OfertaBO ofertaBO;
    @Mock EncaixeBO encaixe;
    @Mock ConsultaBO consultaBO;
    @Mock UbsBO ubs;
    @Mock ReferenciaBO referencia;
    @Mock MensagemBO mensagens;
    @Mock CanalMensageria canal;
    @Mock AlertaBO alertas;

    AssistenteBO bo;

    @BeforeEach
    void setUp() {
        bo = new AssistenteBO(new InterpretadorMensagem(), pacientes, ofertaBO, encaixe, consultaBO, ubs, referencia,
                mensagens, canal, alertas, CLOCK);
        when(pacientes.buscarEntidade(1L)).thenReturn(new Paciente(1L, "Cida Santos", LocalDate.of(1962, 3, 14),
                "(11) 90000-0001", 0, 0, true, true, false, false, false, false, 0));
        when(ubs.buscar(1L)).thenReturn(new Ubs(1L, "UBS Teste", "Rua Teste", 0, 0));
        when(referencia.buscarEspecialidade(1L)).thenReturn(new Especialidade(1L, "Clinica Geral"));
        when(ofertaBO.listarPorPaciente(1L, OfertaStatus.PENDENTE)).thenReturn(List.of());
        when(consultaBO.listarPorPaciente(1L)).thenReturn(List.of());
    }

    private static Consulta consulta(long id, ConsultaStatus status, Origem origem) {
        return new Consulta(id, 1L, 1L, 1L, AMANHA_9H, status, 0.2, origem, false, AGORA.minusDays(3));
    }

    private static OfertaVaga ofertaPendente() {
        return new OfertaVaga(70L, 5L, 1L, 200L, AGORA, AGORA.plusMinutes(15), OfertaStatus.PENDENTE);
    }

    private Resposta fala(String texto) {
        return bo.responder(new Requisicao(1L, texto));
    }

    @Test
    void simComOfertaPendenteAceitaAVaga() {
        when(ofertaBO.listarPorPaciente(1L, OfertaStatus.PENDENTE)).thenReturn(List.of(ofertaPendente()));
        when(encaixe.aceitar(70L)).thenReturn(consulta(300, ConsultaStatus.CONFIRMADA, Origem.ENCAIXE));

        Resposta r = fala("Quero a vaga");

        verify(encaixe).aceitar(70L);
        assertThat(r.resposta()).contains("Pronto, Cida!").contains("Clinica Geral").contains("UBS Teste");
    }

    @Test
    void naoPossoComOfertaPendenteRecusaAVaga() {
        when(ofertaBO.listarPorPaciente(1L, OfertaStatus.PENDENTE)).thenReturn(List.of(ofertaPendente()));

        Resposta r = fala("não posso");

        verify(encaixe).recusar(70L);
        verify(consultaBO, never()).cancelar(anyLong());
        assertThat(r.resposta()).contains("outra pessoa");
    }

    @Test
    void cancelarComOfertaPendenteRecusaAOfertaEnaoCancelaConsulta() {
        when(ofertaBO.listarPorPaciente(1L, OfertaStatus.PENDENTE)).thenReturn(List.of(ofertaPendente()));

        fala("cancela");

        verify(encaixe).recusar(70L);
        verify(consultaBO, never()).cancelar(anyLong());
    }

    @Test
    void simSemOfertaConfirmaConsultaAguardandoConfirmacao() {
        when(consultaBO.listarPorPaciente(1L)).thenReturn(List.of(consulta(10, ConsultaStatus.AGUARDANDO_CONFIRMACAO, Origem.NORMAL)));
        when(consultaBO.confirmar(10L)).thenReturn(consulta(10, ConsultaStatus.CONFIRMADA, Origem.NORMAL));

        Resposta r = fala("sim");

        verify(consultaBO).confirmar(10L);
        assertThat(r.resposta()).contains("confirmada");
    }

    @Test
    void simSemNadaPendenteNaoInventaAcao() {
        Resposta r = fala("sim");

        verify(consultaBO, never()).confirmar(anyLong());
        verify(encaixe, never()).aceitar(anyLong());
        assertThat(r.resposta()).contains("Não tenho nada");
    }

    @Test
    void naoQuandoPedidaConfirmacaoCancelaAConsultaELiberaAVaga() {
        when(consultaBO.listarPorPaciente(1L)).thenReturn(List.of(consulta(10, ConsultaStatus.AGUARDANDO_CONFIRMACAO, Origem.NORMAL)));
        when(consultaBO.cancelar(10L)).thenReturn(consulta(10, ConsultaStatus.CANCELADA, Origem.NORMAL));

        Resposta r = fala("não vou poder ir");

        verify(consultaBO).cancelar(10L);
        assertThat(r.resposta()).contains("cancelei").contains("outra pessoa vai aproveitar");
    }

    @Test
    void cancelaAProximaConsultaFutura() {
        Consulta passada = new Consulta(9L, 1L, 1L, 1L, AGORA.minusDays(2), ConsultaStatus.CONFIRMADA, 0.2, Origem.NORMAL, false, AGORA.minusDays(9));
        when(consultaBO.listarPorPaciente(1L)).thenReturn(List.of(passada, consulta(10, ConsultaStatus.CONFIRMADA, Origem.NORMAL)));
        when(consultaBO.cancelar(10L)).thenReturn(consulta(10, ConsultaStatus.CANCELADA, Origem.NORMAL));

        fala("Cancelar consulta");

        verify(consultaBO).cancelar(10L);
        verify(consultaBO, never()).cancelar(9L);
    }

    @Test
    void ofertaVencidaViraRespostaAmigavelEmVezDeErro() {
        when(ofertaBO.listarPorPaciente(1L, OfertaStatus.PENDENTE)).thenReturn(List.of(ofertaPendente()));
        when(encaixe.aceitar(70L)).thenThrow(new RegraNegocioException("O tempo da oferta acabou. A vaga foi oferecida ao próximo da fila."));

        Resposta r = fala("sim");

        assertThat(r.resposta()).contains("tempo da oferta acabou");
        assertThat(r.acoes()).isNotEmpty();
    }

    @Test
    void mostraAProximaConsulta() {
        when(consultaBO.listarPorPaciente(1L)).thenReturn(List.of(consulta(10, ConsultaStatus.CONFIRMADA, Origem.NORMAL)));

        Resposta r = fala("minha consulta");

        assertThat(r.resposta()).contains("Sua próxima consulta é de Clinica Geral");
    }

    @Test
    void registraEntradaESaidaNoHistorico() {
        fala("oi");

        verify(mensagens).registrar(eq(1L), eq(Direcao.ENTRADA), any(), eq("oi"), eq("TEXTO"));
        verify(canal).enviar(eq(1L), any(), eq("ASSISTENTE"));
    }

    @Test
    void saudacaoComOfertaPendenteLembraDaVagaComBotoes() {
        when(ofertaBO.listarPorPaciente(1L, OfertaStatus.PENDENTE)).thenReturn(List.of(ofertaPendente()));

        Resposta r = fala("oi");

        assertThat(r.resposta()).contains("vaga");
        assertThat(r.acoes()).extracting("rotulo").containsExactly("Quero a vaga", "Não posso");
    }
}
