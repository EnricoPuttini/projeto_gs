package br.com.zelo.bo;

import br.com.zelo.dto.ExperimenteDTOs.Contexto;
import br.com.zelo.dto.ExperimenteDTOs.Efeito;
import br.com.zelo.dto.ExperimenteDTOs.Pendente;
import br.com.zelo.dto.ExperimenteDTOs.Resposta;
import br.com.zelo.integration.LugaresClient;
import br.com.zelo.integration.OpenMeteoClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ExperimenteBOTest {

    private final OpenMeteoClient openMeteo = mock(OpenMeteoClient.class);
    private final ExperimenteBO bo = new ExperimenteBO(new InterpretadorMensagem(), openMeteo, mock(LugaresClient.class));

    private static Contexto com(Pendente p) {
        return new Contexto(p, "Maria", "Clínica Geral", "UBS Jardim", "amanhã às 8h", "EMEF Exemplo, a 400 m");
    }

    @ParameterizedTest
    @ValueSource(strings = {"sim", "quero", "sim, eu quero", "pode marcar", "Quero a vaga!"})
    void comOfertaSimAceitaEMarcaAConsulta(String texto) {
        Resposta r = bo.responder(texto, com(Pendente.OFERTA));

        assertThat(r.efeito()).isEqualTo(Efeito.ACEITOU_VAGA);
        assertThat(r.pendente()).isEqualTo(Pendente.NENHUM);
        assertThat(r.resposta()).contains("Pronto, Maria").contains("Clínica Geral").contains("amanhã às 8h");
    }

    @ParameterizedTest
    @ValueSource(strings = {"não posso", "nao", "cancela"})
    void comOfertaNaoRecusa(String texto) {
        Resposta r = bo.responder(texto, com(Pendente.OFERTA));

        assertThat(r.efeito()).isEqualTo(Efeito.RECUSOU_VAGA);
        assertThat(r.pendente()).isEqualTo(Pendente.NENHUM);
    }

    @Test
    void comOfertaFraseQualquerRepeteAPerguntaComBotoes() {
        Resposta r = bo.responder("hã?", com(Pendente.OFERTA));

        assertThat(r.efeito()).isEqualTo(Efeito.NENHUM);
        assertThat(r.pendente()).isEqualTo(Pendente.OFERTA);
        assertThat(r.acoes()).extracting("rotulo").containsExactly("Sim, eu quero", "Não posso");
    }

    @ParameterizedTest
    @ValueSource(strings = {"não entendi", "pode repetir", "quem fala?", "sim ou não"})
    void comOfertaDuvidaReexplicaSemEncerrar(String texto) {
        Resposta r = bo.responder(texto, com(Pendente.OFERTA));

        assertThat(r.efeito()).isEqualTo(Efeito.NENHUM);
        assertThat(r.pendente()).isEqualTo(Pendente.OFERTA);
        assertThat(r.resposta()).contains("explico de novo").contains("Clínica Geral");
    }

    @Test
    void estouSeguroComAlertaFechaOAlerta() {
        Resposta r = bo.responder("tô seguro", com(Pendente.ALERTA));

        assertThat(r.efeito()).isEqualTo(Efeito.SEGURO);
        assertThat(r.pendente()).isEqualTo(Pendente.NENHUM);
    }

    @Test
    void naoEstouSeguroPassaTelefonesDeEmergenciaEOAbrigo() {
        Resposta r = bo.responder("não estou seguro", com(Pendente.ALERTA));

        assertThat(r.efeito()).isEqualTo(Efeito.PERIGO);
        assertThat(r.resposta()).contains("199").contains("193").contains("EMEF Exemplo");
        assertThat(r.pendente()).isEqualTo(Pendente.ALERTA); // o alerta continua aberto
    }

    @Test
    void simSemNadaPendenteNaoInventaAcao() {
        Resposta r = bo.responder("sim", com(Pendente.NENHUM));

        assertThat(r.efeito()).isEqualTo(Efeito.NENHUM);
        assertThat(r.resposta()).contains("nada esperando");
    }

    @Test
    void previsaoUsaOpenMeteoEInformaQuandoNaoHa() {
        when(openMeteo.milimetrosProximasHoras(anyDouble(), anyDouble(), anyInt())).thenReturn(Optional.of(4.2));
        assertThat(bo.previsao(-23.5, -46.6).milimetrosProximas3h()).isEqualTo(4.2);

        when(openMeteo.milimetrosProximasHoras(anyDouble(), anyDouble(), anyInt())).thenReturn(Optional.empty());
        assertThat(bo.previsao(-23.5, -46.6).disponivel()).isFalse();
    }
}
