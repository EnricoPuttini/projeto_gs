package br.com.zelo.model;

import br.com.zelo.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class TransicaoStatusTest {

    @Test
    void consultaSegueFluxoDeConfirmacao() {
        assertThatCode(() -> ConsultaStatus.AGENDADA.validarTransicaoPara(ConsultaStatus.AGUARDANDO_CONFIRMACAO)).doesNotThrowAnyException();
        assertThatCode(() -> ConsultaStatus.AGUARDANDO_CONFIRMACAO.validarTransicaoPara(ConsultaStatus.CONFIRMADA)).doesNotThrowAnyException();
        assertThatCode(() -> ConsultaStatus.AGUARDANDO_CONFIRMACAO.validarTransicaoPara(ConsultaStatus.NAO_RESPONDIDA)).doesNotThrowAnyException();
        assertThatCode(() -> ConsultaStatus.CONFIRMADA.validarTransicaoPara(ConsultaStatus.REALIZADA)).doesNotThrowAnyException();
        assertThatCode(() -> ConsultaStatus.NAO_RESPONDIDA.validarTransicaoPara(ConsultaStatus.FALTA)).doesNotThrowAnyException();
    }

    @Test
    void consultaNaoPodePularEtapas() {
        assertThatThrownBy(() -> ConsultaStatus.AGENDADA.validarTransicaoPara(ConsultaStatus.REALIZADA))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("AGENDADA → REALIZADA");
        assertThatThrownBy(() -> ConsultaStatus.AGENDADA.validarTransicaoPara(ConsultaStatus.CONFIRMADA))
                .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void naoRespondidaNaoPodeSerCanceladaDepois() {
        // a vaga ja foi liberada quando virou NAO_RESPONDIDA; cancelar de novo abriria vaga duplicada
        assertThatThrownBy(() -> ConsultaStatus.NAO_RESPONDIDA.validarTransicaoPara(ConsultaStatus.CANCELADA))
                .isInstanceOf(RegraNegocioException.class);
    }

    @ParameterizedTest
    @EnumSource(value = ConsultaStatus.class, names = {"CANCELADA", "REALIZADA", "FALTA"})
    void statusFinaisNaoTemSaida(ConsultaStatus final_) {
        assertThat(final_.proximos()).isEmpty();
    }

    @Test
    void soCanceladaENaoRespondidaLiberamVaga() {
        for (ConsultaStatus s : ConsultaStatus.values()) {
            assertThat(s.liberaVaga()).isEqualTo(s == ConsultaStatus.CANCELADA || s == ConsultaStatus.NAO_RESPONDIDA);
        }
    }

    @Test
    void vagaPodeVoltarParaAbertaAposOfertaRecusada() {
        assertThatCode(() -> VagaStatus.EM_OFERTA.validarTransicaoPara(VagaStatus.ABERTA)).doesNotThrowAnyException();
        assertThatThrownBy(() -> VagaStatus.PREENCHIDA.validarTransicaoPara(VagaStatus.ABERTA)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> VagaStatus.ABERTA.validarTransicaoPara(VagaStatus.PREENCHIDA)).isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void ofertaSoSaiDePendente() {
        for (OfertaStatus destino : new OfertaStatus[]{OfertaStatus.ACEITA, OfertaStatus.RECUSADA, OfertaStatus.EXPIRADA}) {
            assertThatCode(() -> OfertaStatus.PENDENTE.validarTransicaoPara(destino)).doesNotThrowAnyException();
            assertThatThrownBy(() -> destino.validarTransicaoPara(OfertaStatus.PENDENTE)).isInstanceOf(RegraNegocioException.class);
        }
    }

    @Test
    void filaAtivaViraAtendidaOuSaiu() {
        assertThat(FilaStatus.ATIVA.proximos()).containsExactlyInAnyOrder(FilaStatus.ATENDIDA, FilaStatus.SAIU);
        assertThat(FilaStatus.ATENDIDA.proximos()).isEmpty();
    }
}
