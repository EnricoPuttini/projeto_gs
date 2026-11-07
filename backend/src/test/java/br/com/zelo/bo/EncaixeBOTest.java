package br.com.zelo.bo;

import br.com.zelo.config.ZeloProperties;
import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.dao.OfertaDAO;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Especialidade;
import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.FilaStatus;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Origem;
import br.com.zelo.model.Paciente;
import br.com.zelo.model.Ubs;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EncaixeBOTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 10, 8, 0);
    private static final Clock CLOCK = Clock.fixed(AGORA.atZone(SP).toInstant(), SP);
    private static final ZeloProperties PROPS = new ZeloProperties(List.of(), false, SP,
            new ZeloProperties.Encaixe(15), new ZeloProperties.Confirmacao(4), new ZeloProperties.Impacto(45));
    private static final long VAGA_ID = 5L;

    @Mock VagaBO vagas;
    @Mock OfertaDAO ofertas;
    @Mock ConsultaDAO consultas;
    @Mock FilaBO fila;
    @Mock PacienteBO pacientes;
    @Mock UbsBO ubs;
    @Mock ReferenciaBO referencia;
    @Mock RankingFila ranking;
    @Mock RiscoFaltaBO risco;
    @Mock CanalMensageria canal;

    EncaixeBO bo;
    Vaga vaga;

    @BeforeEach
    void setUp() {
        bo = new EncaixeBO(vagas, ofertas, consultas, fila, pacientes, ubs, referencia, ranking, risco, canal, PROPS, CLOCK);
        vaga = new Vaga(VAGA_ID, 100L, 1L, 1L, AGORA.plusDays(1), VagaStatus.ABERTA, AGORA);
        when(vagas.buscarTravando(VAGA_ID)).thenReturn(vaga);
        when(vagas.buscar(VAGA_ID)).thenReturn(vaga);
        when(consultas.buscarPorId(100L)).thenReturn(Optional.of(consultaOrigem(99L)));
        when(ofertas.pacientesJaOfertados(VAGA_ID)).thenReturn(new HashSet<>());
        when(ubs.buscar(1L)).thenReturn(new Ubs(1L, "UBS Teste", "Rua Teste", -23.56, -46.64));
        when(referencia.buscarEspecialidade(1L)).thenReturn(new Especialidade(1L, "Clinica Geral"));
        when(risco.calcular(any(), any(), anyBoolean())).thenReturn(0.2);
    }

    private static Consulta consultaOrigem(long pacienteId) {
        return new Consulta(100L, pacienteId, 1L, 1L, AGORA.plusDays(1), ConsultaStatus.CANCELADA, 0.3, Origem.NORMAL, false, AGORA);
    }

    private static Paciente paciente(long id) {
        return new Paciente(id, "Paciente " + id, LocalDate.of(1960, 1, 1), "(11) 90000-0000", -23.57, -46.64,
                false, false, false, false, false, false, 0);
    }

    private static FilaEspera filaDe(long filaId, long pacienteId) {
        return new FilaEspera(filaId, pacienteId, 1L, 1L, AGORA.minusDays(10), 2, FilaStatus.ATIVA);
    }

    private RankingFila.Candidato candidato(long filaId, long pacienteId) {
        return new RankingFila.Candidato(filaDe(filaId, pacienteId), paciente(pacienteId), true, 10, 1.0, 0.2);
    }

    private void filaComCandidatos(RankingFila.Candidato... ordenados) {
        when(fila.listarAtivas(1L, 1L)).thenReturn(java.util.Arrays.stream(ordenados).map(RankingFila.Candidato::fila).toList());
        when(pacientes.mapaPorId()).thenReturn(Map.of());
        when(ranking.ranquear(any(), any(), any(), any())).thenReturn(List.of(ordenados));
    }

    private OfertaVaga ofertaPendente(long id, long pacienteId, LocalDateTime expiraEm) {
        return new OfertaVaga(id, VAGA_ID, pacienteId, 200L, AGORA.minusMinutes(5), expiraEm, OfertaStatus.PENDENTE);
    }

    // ---------- ofertarProximo ----------

    @Test
    void ofertaAoPrimeiroDoRankingComValidadeConfiguravel() {
        filaComCandidatos(candidato(200L, 7L), candidato(201L, 8L));
        when(ofertas.inserir(any())).thenReturn(70L);
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA.plusMinutes(15))));

        Optional<OfertaVaga> oferta = bo.ofertarProximo(VAGA_ID);

        assertThat(oferta).isPresent();
        ArgumentCaptor<OfertaVaga> salva = ArgumentCaptor.forClass(OfertaVaga.class);
        verify(ofertas).inserir(salva.capture());
        assertThat(salva.getValue().pacienteId()).isEqualTo(7L);
        assertThat(salva.getValue().filaId()).isEqualTo(200L);
        assertThat(salva.getValue().status()).isEqualTo(OfertaStatus.PENDENTE);
        assertThat(salva.getValue().enviadaEm()).isEqualTo(AGORA);
        assertThat(salva.getValue().expiraEm()).isEqualTo(AGORA.plusMinutes(15));
        verify(vagas).transicionar(VAGA_ID, VagaStatus.EM_OFERTA);
        verify(canal).enviar(eq(7L), contains("Abriu uma vaga de Clinica Geral"), eq("OFERTA_VAGA"));
    }

    @Test
    void travaALinhaDaVagaAntesDeEscolher() {
        filaComCandidatos(candidato(200L, 7L));
        when(ofertas.inserir(any())).thenReturn(70L);

        bo.ofertarProximo(VAGA_ID);

        var ordem = inOrder(vagas, ofertas);
        ordem.verify(vagas).buscarTravando(VAGA_ID);
        ordem.verify(ofertas).inserir(any());
    }

    @Test
    void filaVaziaPerdeAVaga() {
        when(fila.listarAtivas(1L, 1L)).thenReturn(List.of());

        assertThat(bo.ofertarProximo(VAGA_ID)).isEmpty();

        verify(vagas).transicionar(VAGA_ID, VagaStatus.PERDIDA);
        verify(ofertas, never()).inserir(any());
        verifyNoInteractions(canal);
    }

    @Test
    void naoReofereceParaQuemJaRecebeuNemParaQuemCancelou() {
        when(ofertas.pacientesJaOfertados(VAGA_ID)).thenReturn(new HashSet<>(List.of(8L)));
        when(fila.listarAtivas(1L, 1L)).thenReturn(List.of(filaDe(1, 7), filaDe(2, 8), filaDe(3, 99)));
        when(pacientes.mapaPorId()).thenReturn(Map.of());
        when(ranking.ranquear(any(), any(), any(), any())).thenReturn(List.of());

        bo.ofertarProximo(VAGA_ID);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FilaEspera>> enviados = ArgumentCaptor.forClass(List.class);
        verify(ranking).ranquear(any(), enviados.capture(), any(), any());
        // 8 ja recusou/expirou; 99 e quem cancelou a consulta de origem
        assertThat(enviados.getValue()).extracting(FilaEspera::pacienteId).containsExactly(7L);
    }

    @Test
    void vagaDeHorarioQueJaPassouViraPerdida() {
        vaga = new Vaga(VAGA_ID, 100L, 1L, 1L, AGORA.minusMinutes(1), VagaStatus.ABERTA, AGORA.minusDays(1));
        when(vagas.buscar(VAGA_ID)).thenReturn(vaga);

        assertThat(bo.ofertarProximo(VAGA_ID)).isEmpty();

        verify(vagas).transicionar(VAGA_ID, VagaStatus.PERDIDA);
        verifyNoInteractions(fila);
    }

    @Test
    void vagaQueNaoEstaAbertaNaoGeraNovaOferta() {
        // Segunda chamada concorrente: ao obter o lock ela ja ve EM_OFERTA e nao faz nada.
        when(vagas.buscar(VAGA_ID)).thenReturn(new Vaga(VAGA_ID, 100L, 1L, 1L, AGORA.plusDays(1), VagaStatus.EM_OFERTA, AGORA));

        assertThat(bo.ofertarProximo(VAGA_ID)).isEmpty();

        verify(ofertas, never()).inserir(any());
        verify(vagas, never()).transicionar(anyLong(), any());
    }

    // ---------- aceitar ----------

    @Test
    void aceitarCriaConsultaDeEncaixeMarcaFilaEVaga() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA.plusMinutes(10))));
        when(pacientes.buscarEntidade(7L)).thenReturn(paciente(7L));
        when(consultas.inserir(any())).thenReturn(300L);
        Consulta criada = new Consulta(300L, 7L, 1L, 1L, vaga.dataHora(), ConsultaStatus.CONFIRMADA, 0.2, Origem.ENCAIXE, false, AGORA);
        when(consultas.buscarPorId(300L)).thenReturn(Optional.of(criada));

        Consulta resultado = bo.aceitar(70L);

        assertThat(resultado).isEqualTo(criada);
        verify(ofertas).atualizarStatus(70L, OfertaStatus.ACEITA);
        ArgumentCaptor<Consulta> nova = ArgumentCaptor.forClass(Consulta.class);
        verify(consultas).inserir(nova.capture());
        assertThat(nova.getValue().origem()).isEqualTo(Origem.ENCAIXE);
        assertThat(nova.getValue().status()).isEqualTo(ConsultaStatus.CONFIRMADA);
        assertThat(nova.getValue().dataHora()).isEqualTo(vaga.dataHora());
        assertThat(nova.getValue().pacienteId()).isEqualTo(7L);
        verify(fila).transicionar(200L, FilaStatus.ATENDIDA);
        verify(vagas).transicionar(VAGA_ID, VagaStatus.PREENCHIDA);
    }

    @Test
    void aceitarOfertaVencidaExpiraEOferecaAoProximoEAvisa() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA)));
        filaComCandidatos(candidato(201L, 8L));
        when(ofertas.inserir(any())).thenReturn(71L);

        assertThatThrownBy(() -> bo.aceitar(70L))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("tempo da oferta acabou");

        verify(ofertas).atualizarStatus(70L, OfertaStatus.EXPIRADA);
        verify(vagas).transicionar(VAGA_ID, VagaStatus.ABERTA);
        verify(canal).enviar(eq(7L), contains("tempo"), eq("OFERTA_EXPIRADA"));
        // o proximo candidato recebe a vaga
        verify(ofertas).inserir(argThat(o -> o.pacienteId() == 8L));
        verify(consultas, never()).inserir(any());
    }

    @Test
    void aceitarOfertaJaRespondidaEhRecusado() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(
                new OfertaVaga(70L, VAGA_ID, 7L, 200L, AGORA.minusMinutes(5), AGORA.plusMinutes(5), OfertaStatus.EXPIRADA)));

        assertThatThrownBy(() -> bo.aceitar(70L))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("não está mais disponível");

        verify(consultas, never()).inserir(any());
    }

    // ---------- recusar / expirar ----------

    @Test
    void recusarDevolveAVagaEOferecaAoProximo() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA.plusMinutes(10))));
        filaComCandidatos(candidato(201L, 8L));
        when(ofertas.inserir(any())).thenReturn(71L);

        bo.recusar(70L);

        verify(ofertas).atualizarStatus(70L, OfertaStatus.RECUSADA);
        verify(vagas).transicionar(VAGA_ID, VagaStatus.ABERTA);
        verify(ofertas).inserir(argThat(o -> o.pacienteId() == 8L));
    }

    @Test
    void recusarSemMaisNinguemNaFilaPerdeAVaga() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA.plusMinutes(10))));
        when(fila.listarAtivas(1L, 1L)).thenReturn(List.of());

        bo.recusar(70L);

        verify(vagas).transicionar(VAGA_ID, VagaStatus.PERDIDA);
    }

    @Test
    void expirarSoAfetaOfertaVencida() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA.plusMinutes(1))));

        bo.expirar(70L);

        verify(ofertas, never()).atualizarStatus(anyLong(), any());
    }

    @Test
    void expirarOfertaVencidaPassaAVagaAoProximo() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(ofertaPendente(70L, 7L, AGORA.minusSeconds(1))));
        filaComCandidatos(candidato(201L, 8L));
        when(ofertas.inserir(any())).thenReturn(71L);

        bo.expirar(70L);

        verify(ofertas).atualizarStatus(70L, OfertaStatus.EXPIRADA);
        verify(ofertas).inserir(argThat(o -> o.pacienteId() == 8L));
    }

    @Test
    void expirarOfertaJaRespondidaNaoFazNada() {
        when(ofertas.buscarPorId(70L)).thenReturn(Optional.of(
                new OfertaVaga(70L, VAGA_ID, 7L, 200L, AGORA.minusMinutes(30), AGORA.minusMinutes(15), OfertaStatus.ACEITA)));

        bo.expirar(70L);

        verify(ofertas, never()).atualizarStatus(anyLong(), any());
    }
}
