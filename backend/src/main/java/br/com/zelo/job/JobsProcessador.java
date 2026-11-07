package br.com.zelo.job;

import br.com.zelo.bo.AlertaBO;
import br.com.zelo.bo.ConfirmacaoBO;
import br.com.zelo.bo.EncaixeBO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Corpo dos jobs, separado do agendamento. Assim o @Scheduled e o modo demo ("avancar relogio")
 * executam exatamente o mesmo codigo, que so delega aos BOs.
 */
@Component
public class JobsProcessador {

    private static final Logger log = LoggerFactory.getLogger(JobsProcessador.class);

    private final EncaixeBO encaixe;
    private final ConfirmacaoBO confirmacao;
    private final AlertaBO alertas;

    public JobsProcessador(EncaixeBO encaixe, ConfirmacaoBO confirmacao, AlertaBO alertas) {
        this.encaixe = encaixe;
        this.confirmacao = confirmacao;
        this.alertas = alertas;
    }

    /** Expira ofertas vencidas, uma transacao por oferta (falha em uma nao trava as outras). */
    public int expirarOfertas() {
        int expiradas = 0;
        for (Long id : encaixe.idsVencidos()) {
            try {
                encaixe.expirar(id);
                expiradas++;
            } catch (RuntimeException e) {
                log.error("Falha ao expirar a oferta {}", id, e);
            }
        }
        return expiradas;
    }

    public int pedirConfirmacoes() {
        return confirmacao.pedirConfirmacoesDeAmanha();
    }

    public int processarAlertas() {
        return alertas.processarAreas();
    }

    public int liberarSemResposta() {
        return confirmacao.liberarSemResposta();
    }
}
