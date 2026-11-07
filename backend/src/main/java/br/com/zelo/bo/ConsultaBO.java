package br.com.zelo.bo;

import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.dto.ConsultaRequest;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Origem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Transacional no nivel da classe: os atalhos (cancelar, confirmar...) chamam transicionar() internamente, sem passar pelo proxy. */
@Service
@Transactional
public class ConsultaBO {

    private final ConsultaDAO dao;
    private final VagaBO vagas;
    private final PacienteBO pacientes;
    private final UbsBO ubs;
    private final ReferenciaBO referencia;
    private final Clock clock;

    public ConsultaBO(ConsultaDAO dao, VagaBO vagas, PacienteBO pacientes, UbsBO ubs, ReferenciaBO referencia, Clock clock) {
        this.dao = dao;
        this.vagas = vagas;
        this.pacientes = pacientes;
        this.ubs = ubs;
        this.referencia = referencia;
        this.clock = clock;
    }

    /** Agenda do dia (ou de {@code data}, se informada) de uma UBS. */
    public List<Consulta> listarAgenda(long ubsId, LocalDate data) {
        LocalDate dia = data != null ? data : LocalDate.now(clock);
        return dao.listarPorUbsEPeriodo(ubsId, dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
    }

    public List<Consulta> listarPorPaciente(long pacienteId) {
        return dao.listarPorPaciente(pacienteId);
    }

    public Consulta buscar(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Consulta", id));
    }

    public Consulta agendar(ConsultaRequest r) {
        pacientes.buscarEntidade(r.pacienteId());
        ubs.buscar(r.ubsId());
        referencia.buscarEspecialidade(r.especialidadeId());
        LocalDateTime agora = LocalDateTime.now(clock);
        if (!r.dataHora().isAfter(agora)) {
            throw new RegraNegocioException("A consulta precisa ser marcada para um horário futuro.");
        }
        Long id = dao.inserir(new Consulta(null, r.pacienteId(), r.ubsId(), r.especialidadeId(), r.dataHora(),
                ConsultaStatus.AGENDADA, null, Origem.NORMAL, false, agora));
        return buscar(id);
    }

    /**
     * Unico caminho para mudar o status de uma consulta. Valida a transicao e, se o novo status
     * libera a vaga (CANCELADA ou NAO_RESPONDIDA), abre a Vaga na mesma transacao: ou acontece tudo, ou nada.
     */
    public Consulta transicionar(long id, ConsultaStatus destino) {
        Consulta atual = dao.buscarPorIdParaAtualizar(id).orElseThrow(() -> new RecursoNaoEncontradoException("Consulta", id));
        atual.status().validarTransicaoPara(destino);
        dao.atualizarStatus(id, destino);
        Consulta nova = atual.comStatus(destino);
        if (destino.liberaVaga()) {
            vagas.abrirAPartirDe(nova);
        }
        return nova;
    }

    public Consulta confirmar(long id) {
        return transicionar(id, ConsultaStatus.CONFIRMADA);
    }

    public Consulta cancelar(long id) {
        return transicionar(id, ConsultaStatus.CANCELADA);
    }

    public Consulta registrarRealizada(long id) {
        return transicionar(id, ConsultaStatus.REALIZADA);
    }

    public Consulta registrarFalta(long id) {
        return transicionar(id, ConsultaStatus.FALTA);
    }
}
