package br.com.zelo.bo;

import br.com.zelo.config.ZeloProperties;
import br.com.zelo.dao.AlertaDAO;
import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.dao.VagaDAO;
import br.com.zelo.dto.PainelDTOs.Impacto;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.VagaStatus;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.Map;

/** Indicadores de impacto mostrados no painel. Definicoes em docs/decisoes.md. */
@Service
public class ImpactoBO {

    private final VagaDAO vagas;
    private final ConsultaDAO consultas;
    private final AlertaDAO alertas;
    private final ZeloProperties props;

    public ImpactoBO(VagaDAO vagas, ConsultaDAO consultas, AlertaDAO alertas, ZeloProperties props) {
        this.vagas = vagas;
        this.consultas = consultas;
        this.alertas = alertas;
        this.props = props;
    }

    public Impacto calcular(long ubsId) {
        long recuperadas = vagas.contarPorStatus(ubsId).getOrDefault(VagaStatus.PREENCHIDA, 0L);

        // Dias economizados: quanto cada pessoa encaixada teria esperado por uma vaga regular
        // (espera tipica configuravel) menos o que de fato vai esperar ate a consulta encaixada.
        long dias = 0;
        for (Consulta c : consultas.listarEncaixes(ubsId)) {
            long ate = ChronoUnit.DAYS.between(c.criadaEm().toLocalDate(), c.dataHora().toLocalDate());
            dias += Math.max(0, props.impacto().esperaRegularDias() - ate);
        }

        Map<ConsultaStatus, Long> porStatus = consultas.contarPorStatus(ubsId);
        long realizadas = porStatus.getOrDefault(ConsultaStatus.REALIZADA, 0L);
        long faltas = porStatus.getOrDefault(ConsultaStatus.FALTA, 0L);
        // Sem consultas encerradas ainda nao existe taxa: devolve nulo e o painel mostra "—", nao 0%.
        Double taxa = realizadas + faltas == 0 ? null : (double) realizadas / (realizadas + faltas);
        return new Impacto(recuperadas, dias, taxa, realizadas, faltas, alertas.contarMoradoresAlertados());
    }
}
