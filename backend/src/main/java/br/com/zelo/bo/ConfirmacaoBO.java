package br.com.zelo.bo;

import br.com.zelo.config.ZeloProperties;
import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Confirmacao D-1. Nao e transacional de proposito: cada consulta e processada pela sua propria
 * transacao (ConsultaBO.transicionar), entao uma falha numa consulta nao desfaz as outras.
 */
@Service
public class ConfirmacaoBO {

    private static final Logger log = LoggerFactory.getLogger(ConfirmacaoBO.class);

    private final ConsultaDAO dao;
    private final ConsultaBO consultaBO;
    private final UbsBO ubs;
    private final ReferenciaBO referencia;
    private final CanalMensageria canal;
    private final ZeloProperties props;
    private final Clock clock;

    public ConfirmacaoBO(ConsultaDAO dao, ConsultaBO consultaBO, UbsBO ubs, ReferenciaBO referencia,
                         CanalMensageria canal, ZeloProperties props, Clock clock) {
        this.dao = dao;
        this.consultaBO = consultaBO;
        this.ubs = ubs;
        this.referencia = referencia;
        this.canal = canal;
        this.props = props;
        this.clock = clock;
    }

    /** Pede confirmacao das consultas AGENDADAS de amanha. Devolve quantas mensagens foram geradas. */
    public int pedirConfirmacoesDeAmanha() {
        LocalDate amanha = LocalDate.now(clock).plusDays(1);
        List<Consulta> alvo = dao.listarPorStatusEPeriodo(ConsultaStatus.AGENDADA,
                amanha.atStartOfDay(), amanha.plusDays(1).atStartOfDay());
        int enviadas = 0;
        for (Consulta c : alvo) {
            try {
                consultaBO.transicionar(c.id(), ConsultaStatus.AGUARDANDO_CONFIRMACAO);
                canal.enviar(c.pacienteId(), textoPedido(c), "CONFIRMACAO_D1");
                enviadas++;
            } catch (RegraNegocioException e) {
                log.warn("Consulta {} ignorada na confirmação D-1: {}", c.id(), e.getMessage());
            }
        }
        return enviadas;
    }

    /**
     * Quem nao respondeu ate X horas antes da consulta perde a vaga: a consulta vira NAO_RESPONDIDA
     * e a vaga e liberada (e oferecida ao proximo da fila). Devolve quantas consultas foram liberadas.
     */
    public int liberarSemResposta() {
        LocalDateTime limite = LocalDateTime.now(clock).plusHours(props.confirmacao().horasLimiteSemResposta());
        int liberadas = 0;
        for (Consulta c : dao.listarPorStatusAte(ConsultaStatus.AGUARDANDO_CONFIRMACAO, limite)) {
            try {
                consultaBO.transicionar(c.id(), ConsultaStatus.NAO_RESPONDIDA);
                canal.enviar(c.pacienteId(), "Como não tivemos resposta, a sua consulta de %s foi liberada para outra pessoa. "
                        .formatted(Formato.dataHora(c.dataHora())) + "Se ainda precisar, é só pedir uma nova.", "CONSULTA_LIBERADA");
                liberadas++;
            } catch (RegraNegocioException e) {
                log.warn("Consulta {} ignorada na liberação por falta de resposta: {}", c.id(), e.getMessage());
            }
        }
        return liberadas;
    }

    private String textoPedido(Consulta c) {
        return "Lembrete: você tem consulta de %s na %s, %s. Você vai? Responda SIM para confirmar ou NÃO para avisar que não pode."
                .formatted(referencia.buscarEspecialidade(c.especialidadeId()).nome(), ubs.buscar(c.ubsId()).nome(),
                        Formato.dataHora(c.dataHora()));
    }
}
