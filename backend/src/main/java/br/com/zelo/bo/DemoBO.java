package br.com.zelo.bo;

import br.com.zelo.config.AjustavelClock;
import br.com.zelo.dao.DemoDAO;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.PrevisaoChuva;
import br.com.zelo.job.JobsProcessador;
import br.com.zelo.model.AreaRisco;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Origem;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Botoes do /demo. Nenhum atalho: cada um aciona o MESMO caminho do BO que o sistema usa de verdade
 * (cancelar consulta, processar areas, rodar os jobs). So existe com ZELO_DEMO_MODE=true.
 */
@Service
@ConditionalOnProperty(name = "zelo.demo-mode", havingValue = "true")
public class DemoBO {

    /** O roteiro da demo usa a UBS 1 e a Clinica Geral (ver database/gerar_seed.py). */
    static final long UBS_DEMO = 1L;
    static final long ESPECIALIDADE_DEMO = 1L;
    private static final Set<ConsultaStatus> CANCELAVEIS =
            Set.of(ConsultaStatus.AGENDADA, ConsultaStatus.AGUARDANDO_CONFIRMACAO, ConsultaStatus.CONFIRMADA);

    private final ConsultaBO consultas;
    private final AlertaBO alertas;
    private final ReferenciaBO referencia;
    private final JobsProcessador jobs;
    private final PrevisaoChuva previsao;
    private final DemoDAO dao;
    private final Clock clock;

    public DemoBO(ConsultaBO consultas, AlertaBO alertas, ReferenciaBO referencia, JobsProcessador jobs,
                  PrevisaoChuva previsao, DemoDAO dao, Clock clock) {
        this.consultas = consultas;
        this.alertas = alertas;
        this.referencia = referencia;
        this.jobs = jobs;
        this.previsao = previsao;
        this.dao = dao;
        this.clock = clock;
    }

    /** "Paciente cancela consulta": cancela a primeira consulta de amanha da Clinica Geral na UBS da demo. */
    public Consulta cancelarConsulta() {
        LocalDate amanha = LocalDate.now(clock).plusDays(1);
        Consulta alvo = consultas.listarAgenda(UBS_DEMO, amanha).stream()
                .filter(c -> c.especialidadeId() == ESPECIALIDADE_DEMO && c.origem() == Origem.NORMAL
                        && CANCELAVEIS.contains(c.status()))
                .findFirst()
                .orElseThrow(() -> new RegraNegocioException(
                        "Não há consulta de amanhã para cancelar. Clique em \"Resetar dados\" e tente de novo."));
        return consultas.cancelar(alvo.id());
    }

    /** "Simular chuva forte": o dobro do limiar da area, o que gera nivel CRITICO. Devolve quantos alertas nasceram. */
    public int simularChuva(long areaId) {
        AreaRisco area = referencia.buscarAreaRisco(areaId);
        previsao.simular(areaId, area.limiarMmHora() * 2);
        return alertas.processarAreas();
    }

    /** "Avancar relogio": move o "agora" do sistema e roda os jobs que dependem do tempo. */
    public LocalDateTime avancarRelogio(int minutos) {
        if (!(clock instanceof AjustavelClock ajustavel)) {
            throw new RegraNegocioException("O relógio só pode ser avançado no modo demo.");
        }
        ajustavel.avancar(Duration.ofMinutes(minutos));
        jobs.expirarOfertas();
        jobs.liberarSemResposta();
        return LocalDateTime.now(clock);
    }

    public void resetar() {
        dao.resetar();
        previsao.limparSimulacao();
        if (clock instanceof AjustavelClock ajustavel) {
            ajustavel.zerar();
        }
    }
}
