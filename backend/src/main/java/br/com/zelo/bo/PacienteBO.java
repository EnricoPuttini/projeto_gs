package br.com.zelo.bo;

import br.com.zelo.dao.PacienteDAO;
import br.com.zelo.dto.PacienteRequest;
import br.com.zelo.dto.PacienteResponse;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.Paciente;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class PacienteBO {

    private final PacienteDAO dao;
    private final Clock clock;

    public PacienteBO(PacienteDAO dao, Clock clock) {
        this.dao = dao;
        this.clock = clock;
    }

    public List<PacienteResponse> listar() {
        LocalDate hoje = LocalDate.now(clock);
        return dao.listar().stream().map(p -> PacienteResponse.de(p, hoje)).toList();
    }

    public Paciente buscarEntidade(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Paciente", id));
    }

    public PacienteResponse buscar(long id) {
        return PacienteResponse.de(buscarEntidade(id), LocalDate.now(clock));
    }

    public PacienteResponse criar(PacienteRequest r) {
        Long id = dao.inserir(paraEntidade(null, r));
        return buscar(id);
    }

    public PacienteResponse atualizar(long id, PacienteRequest r) {
        buscarEntidade(id);
        dao.atualizar(paraEntidade(id, r));
        return buscar(id);
    }

    public void remover(long id) {
        buscarEntidade(id);
        dao.remover(id);
    }

    private static Paciente paraEntidade(Long id, PacienteRequest r) {
        return new Paciente(id, r.nome().trim(), r.dataNascimento(), r.telefone().trim(), r.lat(), r.lng(),
                r.hipertensao(), r.diabetes(), r.deficiencia(), r.bolsaFamilia(), r.gestante(), r.pcd(),
                r.faltasAnteriores());
    }
}
