package br.com.zelo.bo;

import br.com.zelo.model.Intencao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class InterpretadorMensagemTest {

    private final InterpretadorMensagem interpretador = new InterpretadorMensagem();

    @ParameterizedTest
    @ValueSource(strings = {"sim", "Sim!", "SIM", "quero", "Quero a vaga", "pode marcar", "Pode ser", "aceito",
            "claro", "tá bom, pode", "confirmo", "vou sim", "beleza", "OK"})
    void entendeAfirmacoes(String texto) {
        assertThat(interpretador.interpretar(texto)).isEqualTo(Intencao.AFIRMATIVA);
    }

    @ParameterizedTest
    @ValueSource(strings = {"não", "Nao", "NÃO!!!", "não posso", "nao quero", "não vou poder", "agora não dá", "recuso"})
    void entendeNegativas(String texto) {
        assertThat(interpretador.interpretar(texto)).isEqualTo(Intencao.NEGATIVA);
    }

    @ParameterizedTest
    @ValueSource(strings = {"cancela", "Cancelar consulta", "quero cancelar", "pode cancelar", "desmarca pra mim", "CANCELA!"})
    void entendeCancelamentoMesmoComPalavraDeAceite(String texto) {
        // "quero" e "pode" sozinhos seriam aceite; com "cancel" o pedido e cancelar.
        assertThat(interpretador.interpretar(texto)).isEqualTo(Intencao.CANCELAR);
    }

    @Test
    void negacaoVenceAfirmacaoNaMesmaFrase() {
        assertThat(interpretador.interpretar("não, pode dar para outra pessoa")).isEqualTo(Intencao.NEGATIVA);
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "minha consulta|CONSULTA", "quando é meu horário?|CONSULTA", "Oi|SAUDACAO", "bom dia|SAUDACAO",
            "preciso de ajuda|AJUDA", "blablabla|DESCONHECIDA"})
    void entendeOutrasIntencoes(String texto, Intencao esperada) {
        assertThat(interpretador.interpretar(texto)).isEqualTo(esperada);
    }

    @Test
    void textoVazioOuNuloEDesconhecido() {
        assertThat(interpretador.interpretar(null)).isEqualTo(Intencao.DESCONHECIDA);
        assertThat(interpretador.interpretar("   ")).isEqualTo(Intencao.DESCONHECIDA);
        assertThat(interpretador.interpretar("!!!")).isEqualTo(Intencao.DESCONHECIDA);
    }

    @Test
    void ignoraAcentosECaixa() {
        assertThat(InterpretadorMensagem.palavras("NÃO Posso, é Claro!")).containsExactly("nao", "posso", "e", "claro");
    }
}
