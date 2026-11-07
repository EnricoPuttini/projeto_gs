package br.com.zelo.bo;

import br.com.zelo.dao.LocalSalvoDAO;
import br.com.zelo.dto.AlertaDTOs.LocalRequest;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.LocalSalvo;
import org.springframework.stereotype.Service;

import java.util.List;

/** "Meus locais": onde a pessoa quer ser avisada e com que intensidade. */
@Service
public class LocalSalvoBO {

    private final LocalSalvoDAO dao;
    private final PacienteBO pacientes;

    public LocalSalvoBO(LocalSalvoDAO dao, PacienteBO pacientes) {
        this.dao = dao;
        this.pacientes = pacientes;
    }

    public List<LocalSalvo> listar(long pacienteId) {
        pacientes.buscarEntidade(pacienteId);
        return dao.listarPorPaciente(pacienteId);
    }

    public LocalSalvo buscar(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Local", id));
    }

    public LocalSalvo criar(long pacienteId, LocalRequest r) {
        pacientes.buscarEntidade(pacienteId);
        return buscar(dao.inserir(paraEntidade(null, pacienteId, r)));
    }

    public LocalSalvo atualizar(long id, LocalRequest r) {
        LocalSalvo atual = buscar(id);
        dao.atualizar(paraEntidade(id, atual.pacienteId(), r));
        return buscar(id);
    }

    private static LocalSalvo paraEntidade(Long id, long pacienteId, LocalRequest r) {
        return new LocalSalvo(id, pacienteId, r.apelido().trim(), r.lat(), r.lng(), r.tipo(), r.intensidade(), r.ativo());
    }
}
