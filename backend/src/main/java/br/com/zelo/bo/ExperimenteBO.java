package br.com.zelo.bo;

import br.com.zelo.dto.AssistenteDTOs.Acao;
import br.com.zelo.dto.ExperimenteDTOs.Contexto;
import br.com.zelo.dto.ExperimenteDTOs.Efeito;
import br.com.zelo.dto.ExperimenteDTOs.Pendente;
import br.com.zelo.dto.ExperimenteDTOs.Previsao;
import br.com.zelo.dto.ExperimenteDTOs.Resposta;
import br.com.zelo.dto.ExperimenteDTOs.Lugar;
import br.com.zelo.dto.ExperimenteDTOs.Lugares;
import br.com.zelo.integration.LugaresClient;
import br.com.zelo.integration.OpenMeteoClient;
import br.com.zelo.model.Intencao;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Modo "Experimente": o visitante conversa com o MESMO interpretador do assistente real
 * (InterpretadorMensagem), mas sem banco nem paciente — o contexto vem do navegador a cada mensagem.
 * Assim qualquer pessoa testa o Zelo com o proprio endereco sem tocar nos dados da demo nem nos de outro visitante.
 */
@Service
public class ExperimenteBO {

    private static final List<Acao> ACOES_OFERTA = List.of(new Acao("Sim, eu quero", "sim, eu quero"), new Acao("Não posso", "não posso"));
    private static final List<Acao> MENU = List.of(new Acao("O que você faz?", "como funciona"), new Acao("Tô seguro", "estou seguro"));

    private final InterpretadorMensagem interpretador;
    private final OpenMeteoClient openMeteo;
    private final LugaresClient lugares;

    public ExperimenteBO(InterpretadorMensagem interpretador, OpenMeteoClient openMeteo, LugaresClient lugares) {
        this.interpretador = interpretador;
        this.openMeteo = openMeteo;
        this.lugares = lugares;
    }

    public Resposta responder(String texto, Contexto c) {
        String nome = vazio(c.nome()) ? "" : ", " + c.nome().trim();
        Intencao intencao = interpretador.interpretar(texto);

        // Seguranca primeiro, como no assistente real: "nao estou seguro" nunca vira um simples "nao".
        if (intencao == Intencao.INSEGURO) {
            return new Resposta("Ligue agora para a Defesa Civil (199) ou para os Bombeiros (193). Não atravesse água parada."
                    + (vazio(c.abrigo()) ? "" : " Vá para o abrigo: " + c.abrigo() + "."), List.of(), Efeito.PERIGO, c.pendente());
        }
        if (intencao == Intencao.SEGURO) {
            return c.pendente() == Pendente.ALERTA
                    ? new Resposta("Que bom" + nome + "! Avisei que você está seguro.", List.of(), Efeito.SEGURO, Pendente.NENHUM)
                    : new Resposta("Que bom que você está bem" + nome + "!", MENU, Efeito.NENHUM, c.pendente());
        }

        if (c.pendente() == Pendente.OFERTA) {
            return switch (intencao) {
                case AFIRMATIVA -> new Resposta("Pronto" + nome + "! Sua consulta de " + c.especialidade() + " está marcada: "
                        + c.quando() + ". Local: " + c.unidade() + ". Pode ir tranquilo.", List.of(), Efeito.ACEITOU_VAGA, Pendente.NENHUM);
                case NEGATIVA, CANCELAR -> new Resposta("Tudo bem. Vou oferecer a vaga para a próxima pessoa da fila. Você continua na fila.",
                        List.of(), Efeito.RECUSOU_VAGA, Pendente.NENHUM);
                default -> new Resposta("Tem uma vaga de " + c.especialidade() + " " + c.quando() + " esperando a sua resposta. Você quer? "
                        + "Pode dizer \"sim\" ou \"não\".", ACOES_OFERTA, Efeito.NENHUM, Pendente.OFERTA);
            };
        }

        return switch (intencao) {
            case SAUDACAO -> new Resposta("Oi" + nome + "! Eu sou o Zelo. Aviso quando abrir uma vaga de consulta para você e quando vier "
                    + "chuva forte perto da sua casa.", MENU, Efeito.NENHUM, c.pendente());
            case CONSULTA -> new Resposta("Nesta simulação você ainda não tem consulta marcada. Use o botão \"Simular: abriu uma vaga\" "
                    + "para ver como o Zelo te avisa.", MENU, Efeito.NENHUM, c.pendente());
            case AFIRMATIVA, NEGATIVA, CANCELAR -> new Resposta("Agora não tem nada esperando a sua resposta. Quando abrir uma vaga, eu te aviso.",
                    MENU, Efeito.NENHUM, c.pendente());
            default -> new Resposta("Eu entendo frases simples, como \"quero a vaga\", \"não posso\", \"minha consulta\" ou \"tô seguro\". "
                    + "Pode falar pelo microfone.", MENU, Efeito.NENHUM, c.pendente());
        };
    }

    /** Previsao REAL de chuva das proximas 3 h no endereco do visitante (mesmo cliente do job de alerta). */
    public Previsao previsao(double lat, double lng) {
        return openMeteo.milimetrosProximasHoras(lat, lng, AlertaBO.HORAS_PREVISAO)
                .map(mm -> new Previsao(true, mm, "Open-Meteo, previsão horária"))
                .orElseGet(() -> new Previsao(false, null, "Open-Meteo indisponível agora"));
    }

    /** UBS e escola publica (abrigo) reais mais perto do visitante, pelo OpenStreetMap. */
    public Lugares lugares(double lat, double lng) {
        LugaresClient.Proximos p = lugares.proximos(lat, lng);
        return new Lugares(converter(p.saude()), converter(p.escola()), "© colaboradores do OpenStreetMap (Nominatim)");
    }

    private static Lugar converter(LugaresClient.Lugar l) {
        return l == null ? null : new Lugar(l.nome(), l.lat(), l.lng(), l.metros());
    }

    private static boolean vazio(String s) {
        return s == null || s.isBlank();
    }
}
