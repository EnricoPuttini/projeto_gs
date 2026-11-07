package br.com.zelo.bo;

import br.com.zelo.dao.FilaDAO;
import br.com.zelo.dto.FilaRequest;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.FilaStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FilaBO {

    private final FilaDAO dao;
    private final PacienteBO pacientes;
    private final UbsBO ubs;
    private final ReferenciaBO referencia;
    private final Clock clock;

    public FilaBO(FilaDAO dao, PacienteBO pacientes, UbsBO ubs, ReferenciaBO referencia, Clock clock) {
        this.dao = dao;
        this.pacientes = pacientes;
        this.ubs = ubs;
        this.referencia = referencia;
        this.clock = clock;
    }

    public List<FilaEspera> listarAtivas(long ubsId, Long especialidadeId) {
        return dao.listarAtivas(ubsId, especialidadeId);
    }

    public FilaEspera buscar(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Entrada de fila", id));
    }

    @Transactional
    public FilaEspera entrar(FilaRequest r) {
        pacientes.buscarEntidade(r.pacienteId());
        ubs.buscar(r.ubsId());
        referencia.buscarEspecialidade(r.especialidadeId());
        boolean jaNaFila = dao.listarAtivas(r.ubsId(), r.especialidadeId()).stream()
                .anyMatch(f -> f.pacienteId().equals(r.pacienteId()));
        if (jaNaFila) {
            throw new RegraNegocioException("O paciente já está na fila desta UBS para esta especialidade.");
        }
        Long id = dao.inserir(new FilaEspera(null, r.pacienteId(), r.ubsId(), r.especialidadeId(),
                LocalDateTime.now(clock), r.gravidade(), FilaStatus.ATIVA));
        return buscar(id);
    }

    /** Unico caminho para mudar o status da fila (ATENDIDA quando aceita a vaga, SAIU quando desiste). */
    @Transactional
    public FilaEspera transicionar(long id, FilaStatus destino) {
        FilaEspera atual = buscar(id);
        atual.status().validarTransicaoPara(destino);
        dao.atualizarStatus(id, destino);
        return buscar(id);
    }
}
