package br.com.zelo.bo;

import br.com.zelo.config.AjustavelClock;
import br.com.zelo.dao.DemoDAO;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.PrevisaoChuva;
import br.com.zelo.job.JobsProcessador;
import br.com.zelo.model.AreaRisco;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.dto.FilaRequest;
import br.com.zelo.dto.ConsultaRequest;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Origem;
import br.com.zelo.model.VagaStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
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
    /** Dona Cida, a persona do celular da demo. */
    static final long PACIENTE_DEMO = 1L;
    private static final int GRAVIDADE_PEDIDO = 3;
    private static final Set<ConsultaStatus> CANCELAVEIS =
            Set.of(ConsultaStatus.AGENDADA, ConsultaStatus.AGUARDANDO_CONFIRMACAO, ConsultaStatus.CONFIRMADA);

    private final ConsultaBO consultas;
    private final FilaBO fila;
    private final OfertaBO ofertas;
    private final EncaixeBO encaixe;
    private final VagaBO vagas;
    private final PacienteBO pacientes;
    private final AlertaBO alertas;
    private final ReferenciaBO referencia;
    private final JobsProcessador jobs;
    private final PrevisaoChuva previsao;
    private final DemoDAO dao;
    private final Clock clock;

    public DemoBO(ConsultaBO consultas, FilaBO fila, OfertaBO ofertas, EncaixeBO encaixe, VagaBO vagas, PacienteBO pacientes,
                  AlertaBO alertas, ReferenciaBO referencia, JobsProcessador jobs, PrevisaoChuva previsao, DemoDAO dao, Clock clock) {
        this.consultas = consultas;
        this.fila = fila;
        this.ofertas = ofertas;
        this.encaixe = encaixe;
        this.vagas = vagas;
        this.pacientes = pacientes;
        this.alertas = alertas;
        this.referencia = referencia;
        this.jobs = jobs;
        this.previsao = previsao;
        this.dao = dao;
        this.clock = clock;
    }

    /** "Paciente cancela consulta" (passo 1 da demo): abre uma vaga e garante que ela chegue a Dona Cida. */
    public OfertaVaga cancelarConsulta() {
        return garantirVagaPara(PACIENTE_DEMO);
    }

    /**
     * Ambiente de teste "sempre com vaga": a pessoa da demo pode pedir vaga, aceitar, cancelar e pedir de novo
     * quantas vezes quiser, sem depender do que sobrou na agenda. Tudo pelos caminhos reais do sistema:
     * 1) quem pede vaga entra na fila (FilaBO); 2) alguem desmarca uma consulta de amanha (ConsultaBO.cancelar,
     * que abre a vaga e oferta ao 1o do ranking) — se a agenda de amanha acabou, uma consulta e marcada para isso;
     * 3) quem estiver na frente na fila RECUSA (EncaixeBO.recusar), e a vaga desce ate a pessoa da demo.
     * O painel da UBS mostra essa cascata como mostraria na vida real.
     */
    public OfertaVaga garantirVagaPara(long pacienteId) {
        Optional<OfertaVaga> pendente = ofertas.listarPorPaciente(pacienteId, OfertaStatus.PENDENTE).stream().findFirst();
        if (pendente.isPresent()) {
            return pendente.get();
        }
        boolean naFila = fila.listarAtivas(UBS_DEMO, ESPECIALIDADE_DEMO).stream().anyMatch(f -> f.pacienteId() == pacienteId);
        if (!naFila) {
            fila.entrar(new FilaRequest(pacienteId, UBS_DEMO, ESPECIALIDADE_DEMO, GRAVIDADE_PEDIDO));
        }
        Consulta cancelada = consultas.cancelar(consultaParaDesmarcar(pacienteId).id());
        long vagaId = vagas.listar(UBS_DEMO, VagaStatus.EM_OFERTA).stream()
                .filter(v -> cancelada.id().equals(v.consultaOrigemId()))
                .findFirst()
                .orElseThrow(() -> new RegraNegocioException("A vaga não foi aberta. Clique em \"Recomeçar do zero\" e tente de novo."))
                .id();
        int limite = fila.listarAtivas(UBS_DEMO, ESPECIALIDADE_DEMO).size() + 1;
        for (int i = 0; i < limite; i++) {
            Optional<OfertaVaga> atual = ofertas.listarPorUbs(UBS_DEMO, OfertaStatus.PENDENTE).stream()
                    .filter(o -> o.vagaId() == vagaId)
                    .findFirst();
            if (atual.isEmpty()) {
                break;
            }
            if (atual.get().pacienteId() == pacienteId) {
                return atual.get();
            }
            encaixe.recusar(atual.get().id());
        }
        throw new RegraNegocioException("Não consegui abrir uma vaga agora. Clique em \"Recomeçar do zero\" e tente de novo.");
    }

    /** Primeira consulta de amanha (Clinica Geral, UBS da demo) de OUTRA pessoa; se acabaram, marca uma para ser desmarcada. */
    private Consulta consultaParaDesmarcar(long pacienteDemo) {
        LocalDate amanha = LocalDate.now(clock).plusDays(1);
        var agenda = consultas.listarAgenda(UBS_DEMO, amanha);
        Optional<Consulta> existente = agenda.stream()
                .filter(c -> c.especialidadeId() == ESPECIALIDADE_DEMO && c.origem() == Origem.NORMAL
                        && CANCELAVEIS.contains(c.status()) && c.pacienteId() != pacienteDemo)
                .findFirst();
        if (existente.isPresent()) {
            return existente.get();
        }
        Set<LocalDateTime> ocupados = new java.util.HashSet<>();
        agenda.forEach(c -> ocupados.add(c.dataHora()));
        LocalDateTime horario = null;
        for (int min = 7 * 60; min <= 18 * 60 && horario == null; min += 20) {
            LocalDateTime h = amanha.atTime(LocalTime.of(min / 60, min % 60));
            if (!ocupados.contains(h)) {
                horario = h;
            }
        }
        if (horario == null) {
            throw new RegraNegocioException("A agenda de amanhã está cheia. Clique em \"Recomeçar do zero\".");
        }
        Set<Long> naFila = new java.util.HashSet<>();
        fila.listarAtivas(UBS_DEMO, ESPECIALIDADE_DEMO).forEach(f -> naFila.add(f.pacienteId()));
        long outro = pacientes.mapaPorId().keySet().stream().sorted()
                .filter(id -> id != pacienteDemo && !naFila.contains(id))
                .findFirst()
                .orElseThrow(() -> new RegraNegocioException("Não há outro paciente para a demo."));
        return consultas.agendar(new ConsultaRequest(outro, UBS_DEMO, ESPECIALIDADE_DEMO, horario));
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
