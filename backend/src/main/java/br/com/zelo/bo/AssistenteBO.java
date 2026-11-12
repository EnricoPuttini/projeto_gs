package br.com.zelo.bo;

import br.com.zelo.dto.AlertaDTOs;
import br.com.zelo.dto.AssistenteDTOs.Acao;
import br.com.zelo.dto.AssistenteDTOs.Requisicao;
import br.com.zelo.dto.AssistenteDTOs.Resposta;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.model.Canal;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Direcao;
import br.com.zelo.model.Intencao;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.Paciente;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Motor de conversa. A mesma frase significa coisas diferentes conforme o contexto, entao o BO
 * olha o que esta pendente para a pessoa: primeiro uma oferta de vaga, depois uma consulta aguardando
 * confirmacao. Nao e transacional: cada acao (aceitar, recusar, cancelar...) tem a sua propria transacao,
 * e um erro de regra vira uma resposta amigavel em vez de quebrar o chat.
 */
@Service
public class AssistenteBO {

    private static final Set<ConsultaStatus> CANCELAVEIS =
            Set.of(ConsultaStatus.AGENDADA, ConsultaStatus.AGUARDANDO_CONFIRMACAO, ConsultaStatus.CONFIRMADA);

    private final InterpretadorMensagem interpretador;
    private final PacienteBO pacientes;
    private final OfertaBO ofertaBO;
    private final EncaixeBO encaixe;
    private final ConsultaBO consultaBO;
    private final UbsBO ubs;
    private final ReferenciaBO referencia;
    private final MensagemBO mensagens;
    private final CanalMensageria canal;
    private final AlertaBO alertas;
    private final Clock clock;
    // so existe no modo demo; buscado sob demanda (ObjectProvider) para nao criar dependencia circular
    private org.springframework.beans.factory.ObjectProvider<DemoBO> demo;
    private VagaBO vagas;

    @org.springframework.beans.factory.annotation.Autowired
    void usarDemo(org.springframework.beans.factory.ObjectProvider<DemoBO> demo, VagaBO vagas) {
        this.demo = demo;
        this.vagas = vagas;
    }

    public AssistenteBO(InterpretadorMensagem interpretador, PacienteBO pacientes, OfertaBO ofertaBO, EncaixeBO encaixe,
                        ConsultaBO consultaBO, UbsBO ubs, ReferenciaBO referencia, MensagemBO mensagens,
                        CanalMensageria canal, AlertaBO alertas, Clock clock) {
        this.interpretador = interpretador;
        this.pacientes = pacientes;
        this.ofertaBO = ofertaBO;
        this.encaixe = encaixe;
        this.consultaBO = consultaBO;
        this.ubs = ubs;
        this.referencia = referencia;
        this.mensagens = mensagens;
        this.canal = canal;
        this.alertas = alertas;
        this.clock = clock;
    }

    public Resposta responder(Requisicao req) {
        Paciente paciente = pacientes.buscarEntidade(req.pacienteId());
        mensagens.registrar(paciente.id(), Direcao.ENTRADA, Canal.APP, req.texto().trim(), "TEXTO");

        Intencao intencao = interpretador.interpretar(req.texto());
        Resposta resposta;
        try {
            resposta = executar(paciente, intencao);
        } catch (RegraNegocioException e) {
            // Ex.: a oferta venceu enquanto a pessoa pensava. A regra explica, em linguagem simples.
            resposta = new Resposta(e.getMessage(), menuPadrao());
        }
        canal.enviar(paciente.id(), resposta.resposta(), "ASSISTENTE");
        return resposta;
    }

    private Resposta executar(Paciente p, Intencao intencao) {
        Optional<OfertaVaga> oferta = ofertaBO.listarPorPaciente(p.id(), OfertaStatus.PENDENTE).stream().findFirst();
        return switch (intencao) {
            case AFIRMATIVA -> oferta.isPresent() ? aceitarOferta(p, oferta.get()) : confirmarConsulta(p);
            case PEDIR_VAGA -> oferta.isPresent() ? aceitarOferta(p, oferta.get()) : pedirVaga(p);
            case NEGATIVA -> oferta.isPresent() ? recusarOferta(oferta.get()) : negarConsulta(p);
            case CANCELAR -> oferta.isPresent() ? recusarOferta(oferta.get()) : cancelarProxima(p);
            case SEGURO -> confirmarSeguranca(p);
            case INSEGURO -> orientarEmergencia(p);
            case CONSULTA -> mostrarConsulta(p, oferta);
            case SAUDACAO, AJUDA, DUVIDA, DESCONHECIDA -> ajuda(p, oferta, intencao);
        };
    }

    private Resposta aceitarOferta(Paciente p, OfertaVaga oferta) {
        Consulta c = encaixe.aceitar(oferta.id());
        return new Resposta("Pronto, %s! Sua consulta de %s está marcada: %s, na %s. Pode ir tranquila(o)."
                .formatted(primeiroNome(p), referencia.buscarEspecialidade(c.especialidadeId()).nome(),
                        Formato.dataHora(c.dataHora()), ubs.buscar(c.ubsId()).nome()),
                List.of(new Acao("Ver minha consulta", "minha consulta"), new Acao("Cancelar consulta", "cancelar consulta")));
    }

    /**
     * "Quero uma vaga" sem oferta aberta. Na vida real, a vaga nasce quando alguem desmarca: o Zelo explica a fila.
     * No modo demo (ambiente de teste), a vaga e aberta na hora pelos caminhos reais (DemoBO.garantirVagaPara).
     */
    private Resposta pedirVaga(Paciente p) {
        DemoBO demoBO = demo == null ? null : demo.getIfAvailable();
        if (demoBO != null) {
            OfertaVaga o = demoBO.garantirVagaPara(p.id());
            Vaga v = vagas.buscar(o.vagaId());
            return new Resposta("Achei uma vaga para você, %s! %s, %s. Você quer? Diga \"sim\" ou toque em \"Quero a vaga\"."
                    .formatted(primeiroNome(p), referencia.buscarEspecialidade(v.especialidadeId()).nome(),
                            Formato.dataHora(v.dataHora())), acoesOferta());
        }
        return new Resposta("Agora não tem vaga aberta. Quando alguém desmarcar, eu te aviso na hora e você responde aqui.",
                menuPadrao());
    }

    private Resposta recusarOferta(OfertaVaga oferta) {
        encaixe.recusar(oferta.id());
        return new Resposta("Tudo bem. Vou oferecer essa vaga para outra pessoa da fila. Você continua na fila de espera.",
                menuPadrao());
    }

    private Resposta confirmarConsulta(Paciente p) {
        Optional<Consulta> aguardando = proximaConsulta(p, Set.of(ConsultaStatus.AGUARDANDO_CONFIRMACAO));
        if (aguardando.isEmpty()) {
            return new Resposta("Não tenho nada para você confirmar agora. Posso ajudar com outra coisa?", menuPadrao());
        }
        Consulta c = consultaBO.confirmar(aguardando.get().id());
        return new Resposta("Combinado! Sua consulta de %s está confirmada: %s. Até lá!"
                .formatted(referencia.buscarEspecialidade(c.especialidadeId()).nome(), Formato.dataHora(c.dataHora())),
                List.of());
    }

    /** "Nao" sem oferta pendente: so faz sentido como resposta ao pedido de confirmacao. */
    private Resposta negarConsulta(Paciente p) {
        if (proximaConsulta(p, Set.of(ConsultaStatus.AGUARDANDO_CONFIRMACAO)).isEmpty()) {
            return new Resposta("Tudo bem. Se precisar de algo, é só falar.", menuPadrao());
        }
        return cancelarProxima(p);
    }

    private Resposta cancelarProxima(Paciente p) {
        Optional<Consulta> alvo = proximaConsulta(p, CANCELAVEIS);
        if (alvo.isEmpty()) {
            return new Resposta("Você não tem consulta marcada para cancelar.", menuPadrao());
        }
        Consulta c = consultaBO.cancelar(alvo.get().id());
        return new Resposta("Tudo bem, cancelei sua consulta de %s (%s). Obrigado por avisar: outra pessoa vai aproveitar a vaga."
                .formatted(referencia.buscarEspecialidade(c.especialidadeId()).nome(), Formato.dataHora(c.dataHora())),
                menuPadrao());
    }

    private Resposta confirmarSeguranca(Paciente p) {
        int encerrados = alertas.confirmarSeguroDoPaciente(p.id());
        return new Resposta(encerrados > 0 ? "Que bom, %s! Avisei que você está seguro.".formatted(primeiroNome(p))
                : "Que bom que você está bem, %s!".formatted(primeiroNome(p)), List.of());
    }

    /** Mensagem de seguranca: telefones de emergencia primeiro, abrigo do alerta aberto (se houver) depois. */
    private Resposta orientarEmergencia(Paciente p) {
        String texto = "Ligue agora para a Defesa Civil (199) ou para os Bombeiros (193). Não atravesse água parada.";
        Optional<AlertaDTOs.AlertaDetalhe> aberto = alertas.listarDoPaciente(p.id(), true).stream().findFirst();
        if (aberto.isPresent() && aberto.get().abrigoNome() != null) {
            texto += " Vá para o abrigo mais perto: %s, %s. Rota: %s".formatted(aberto.get().abrigoNome(),
                    aberto.get().abrigoEndereco(), aberto.get().rotaUrl());
        }
        return new Resposta(texto, List.of());
    }

    private Resposta mostrarConsulta(Paciente p, Optional<OfertaVaga> oferta) {
        Optional<Consulta> proxima = proximaConsulta(p, Set.of(ConsultaStatus.AGENDADA,
                ConsultaStatus.AGUARDANDO_CONFIRMACAO, ConsultaStatus.CONFIRMADA));
        String texto = proxima
                .map(c -> "Sua próxima consulta é de %s: %s, na %s.".formatted(
                        referencia.buscarEspecialidade(c.especialidadeId()).nome(), Formato.dataHora(c.dataHora()),
                        ubs.buscar(c.ubsId()).nome()))
                .orElse("Você não tem consulta marcada no momento.");
        if (oferta.isPresent()) {
            texto += " E tem uma vaga esperando a sua resposta.";
        }
        return new Resposta(texto, oferta.isPresent() ? acoesOferta() : menuPadrao());
    }

    private Resposta ajuda(Paciente p, Optional<OfertaVaga> oferta, Intencao intencao) {
        String abertura = intencao == Intencao.SAUDACAO ? "Oi, %s! ".formatted(primeiroNome(p))
                : intencao == Intencao.DESCONHECIDA ? "Não entendi muito bem. "
                : intencao == Intencao.DUVIDA ? "Eu explico de novo. " : "";
        if (oferta.isPresent()) {
            return new Resposta(abertura + "Tem uma vaga de consulta esperando a sua resposta. Você quer?", acoesOferta());
        }
        return new Resposta(abertura + "Eu posso procurar uma vaga para você, mostrar a sua consulta ou cancelar se você não puder ir. O que você quer?",
                menuPadrao());
    }

    /** Proxima consulta futura do paciente em um dos status dados, a mais proxima primeiro. */
    private Optional<Consulta> proximaConsulta(Paciente p, Set<ConsultaStatus> status) {
        LocalDateTime agora = LocalDateTime.now(clock);
        return consultaBO.listarPorPaciente(p.id()).stream()
                .filter(c -> status.contains(c.status()) && c.dataHora().isAfter(agora))
                .min(Comparator.comparing(Consulta::dataHora));
    }

    private static String primeiroNome(Paciente p) {
        return p.nome().split("\\s+")[0];
    }

    private static List<Acao> acoesOferta() {
        return List.of(new Acao("Quero a vaga", "quero a vaga"), new Acao("Não posso", "não posso"));
    }

    private static List<Acao> menuPadrao() {
        return List.of(new Acao("Quero uma vaga", "quero uma vaga"), new Acao("Minha consulta", "minha consulta"),
                new Acao("Cancelar consulta", "cancelar consulta"));
    }
}
