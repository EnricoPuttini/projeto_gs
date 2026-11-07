package br.com.zelo.bo;

import br.com.zelo.dao.AlertaDAO;
import br.com.zelo.dao.LocalSalvoDAO;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.integration.PrevisaoChuva;
import br.com.zelo.model.Abrigo;
import br.com.zelo.model.Alerta;
import br.com.zelo.model.Alerta.Nivel;
import br.com.zelo.model.AreaRisco;
import br.com.zelo.model.LocalSalvo;
import br.com.zelo.model.LocalSalvo.IntensidadeAlerta;
import br.com.zelo.model.LocalSalvo.TipoLocal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AlertaBOTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 12, 14, 20);
    private static final Clock CLOCK = Clock.fixed(AGORA.atZone(SP).toInstant(), SP);

    /** Area de 350 m de raio e limiar 15 mm (soma das proximas 3 h). */
    private static final AreaRisco AREA = new AreaRisco(1L, "Margem do Córrego Teste", -23.5640, -46.6440, 350, 15.0);
    private static final Abrigo ABRIGO_PERTO = new Abrigo(10L, "EMEF Perto", "Rua do Alto, 10", -23.5610, -46.6420, 200);
    private static final Abrigo ABRIGO_LONGE = new Abrigo(11L, "EMEF Longe", "Rua da Vila, 80", -23.5720, -46.6620, 250);
    private static final LocalSalvo DENTRO = local(100L, 1L, -23.5645, -46.6445, IntensidadeAlerta.ALARME);
    private static final LocalSalvo FORA = local(101L, 2L, -23.5800, -46.6600, IntensidadeAlerta.VIBRAR);

    @Mock ReferenciaBO referencia;
    @Mock LocalSalvoDAO locais;
    @Mock AlertaDAO alertas;
    @Mock PrevisaoChuva previsao;
    @Mock CanalMensageria canal;

    AlertaBO bo;

    private static LocalSalvo local(long id, long pacienteId, double lat, double lng, IntensidadeAlerta intensidade) {
        return new LocalSalvo(id, pacienteId, "Casa", lat, lng, TipoLocal.CASA, intensidade, true);
    }

    @BeforeEach
    void setUp() {
        bo = new AlertaBO(referencia, locais, alertas, previsao, canal, CLOCK);
        when(referencia.listarAreasRisco()).thenReturn(List.of(AREA));
        when(referencia.listarAbrigos()).thenReturn(List.of(ABRIGO_LONGE, ABRIGO_PERTO));
        when(locais.listarAtivos()).thenReturn(List.of(DENTRO, FORA));
        when(alertas.inserir(any())).thenReturn(900L);
    }

    @Test
    void chuvaNoLimiteAlertaSoQuemMoraDentroDoRaio() {
        when(previsao.proximasHoras(AREA, 3)).thenReturn(Optional.of(15.0));

        int criados = bo.processarAreas();

        assertThat(criados).isEqualTo(1);
        ArgumentCaptor<Alerta> salvo = ArgumentCaptor.forClass(Alerta.class);
        verify(alertas, times(1)).inserir(salvo.capture());
        assertThat(salvo.getValue().localId()).isEqualTo(100L);
        assertThat(salvo.getValue().areaId()).isEqualTo(1L);
        assertThat(salvo.getValue().chuvaMm()).isEqualTo(15.0);
        assertThat(salvo.getValue().nivel()).isEqualTo(Nivel.ATENCAO);
        assertThat(salvo.getValue().janela()).isEqualTo(LocalDateTime.of(2026, 11, 12, 14, 0));
        verify(canal, never()).enviar(eq(2L), any(), any());
    }

    @Test
    void mensagemTrazOQueFazerOAbrigoMaisProximoEALinkDeRota() {
        when(previsao.proximasHoras(AREA, 3)).thenReturn(Optional.of(20.0));

        bo.processarAreas();

        ArgumentCaptor<String> texto = ArgumentCaptor.forClass(String.class);
        verify(canal).enviar(eq(1L), texto.capture(), eq("ALERTA_ENCHENTE"));
        assertThat(texto.getValue())
                .contains("vai chover forte perto de Casa")
                .contains("EMEF Perto")
                .doesNotContain("EMEF Longe")
                .contains("https://www.google.com/maps/dir/?api=1&origin=-23.564500,-46.644500&destination=-23.561000,-46.642000&travelmode=walking")
                .contains("estou seguro");
        ArgumentCaptor<Alerta> salvo = ArgumentCaptor.forClass(Alerta.class);
        verify(alertas).inserir(salvo.capture());
        assertThat(salvo.getValue().abrigoId()).isEqualTo(10L);
    }

    @Test
    void chuvaAbaixoDoLimiarNaoGeraAlerta() {
        when(previsao.proximasHoras(AREA, 3)).thenReturn(Optional.of(14.9));

        assertThat(bo.processarAreas()).isZero();

        verify(alertas, never()).inserir(any());
        verifyNoInteractions(canal);
    }

    @Test
    void apiForaDoArNaoQuebraENaoAlerta() {
        when(previsao.proximasHoras(AREA, 3)).thenReturn(Optional.empty());

        assertThat(bo.processarAreas()).isZero();

        verify(alertas, never()).inserir(any());
    }

    @Test
    void naoAlertaDeNovoNaMesmaHora() {
        when(previsao.proximasHoras(AREA, 3)).thenReturn(Optional.of(40.0));
        when(alertas.existe(100L, 1L, LocalDateTime.of(2026, 11, 12, 14, 0))).thenReturn(true);

        assertThat(bo.processarAreas()).isZero();

        verify(alertas, never()).inserir(any());
        verifyNoInteractions(canal);
    }

    @Test
    void umaAreaSemPrevisaoNaoImpedeAsOutras() {
        AreaRisco outra = new AreaRisco(2L, "Outra", -23.5800, -46.6600, 300, 10.0);
        when(referencia.listarAreasRisco()).thenReturn(List.of(AREA, outra));
        when(previsao.proximasHoras(AREA, 3)).thenReturn(Optional.empty());
        when(previsao.proximasHoras(outra, 3)).thenReturn(Optional.of(30.0));

        assertThat(bo.processarAreas()).isEqualTo(1);

        verify(canal).enviar(eq(2L), any(), eq("ALERTA_ENCHENTE"));
    }

    @Test
    void nivelCresceComARazaoEntreChuvaELimiar() {
        assertThat(AlertaBO.nivel(15, 15)).isEqualTo(Nivel.ATENCAO);
        assertThat(AlertaBO.nivel(22.4, 15)).isEqualTo(Nivel.ATENCAO);
        assertThat(AlertaBO.nivel(22.5, 15)).isEqualTo(Nivel.ALTO);
        assertThat(AlertaBO.nivel(30, 15)).isEqualTo(Nivel.CRITICO);
    }

    @Test
    void confirmarSeguroGravaOHorarioDoRelogioInjetado() {
        Alerta existente = new Alerta(900L, 100L, 1L, 10L, 20, Nivel.ALTO, AGORA, AGORA.withMinute(0), null);
        when(alertas.buscarPorId(900L)).thenReturn(Optional.of(existente));

        bo.confirmarSeguro(900L);

        verify(alertas).marcarSeguro(900L, AGORA);
    }

    @Test
    void assistenteConfirmaTodosOsAlertasAbertosDaPessoa() {
        Alerta a1 = new Alerta(1L, 100L, 1L, 10L, 20, Nivel.ALTO, AGORA, AGORA, null);
        Alerta a2 = new Alerta(2L, 100L, 2L, 10L, 20, Nivel.ALTO, AGORA, AGORA, null);
        when(alertas.listarPorPaciente(eq(1L), any(), eq(true))).thenReturn(List.of(a1, a2));

        assertThat(bo.confirmarSeguroDoPaciente(1L)).isEqualTo(2);

        verify(alertas).marcarSeguro(1L, AGORA);
        verify(alertas).marcarSeguro(2L, AGORA);
    }

    @Test
    void alertaAbertoSoValeParaAsUltimas6Horas() {
        bo.listarDoPaciente(1L, true);

        verify(alertas).listarPorPaciente(1L, AGORA.minusHours(6), true);
    }
}
