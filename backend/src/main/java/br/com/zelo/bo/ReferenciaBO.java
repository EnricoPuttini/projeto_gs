package br.com.zelo.bo;

import br.com.zelo.dao.AbrigoDAO;
import br.com.zelo.dao.AreaRiscoDAO;
import br.com.zelo.dao.EspecialidadeDAO;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.Abrigo;
import br.com.zelo.model.AreaRisco;
import br.com.zelo.model.Especialidade;
import org.springframework.stereotype.Service;

import java.util.List;

/** Dados de referencia somente-leitura (vem do seed): especialidades, abrigos e areas de risco. */
@Service
public class ReferenciaBO {

    private final EspecialidadeDAO especialidades;
    private final AbrigoDAO abrigos;
    private final AreaRiscoDAO areas;

    public ReferenciaBO(EspecialidadeDAO especialidades, AbrigoDAO abrigos, AreaRiscoDAO areas) {
        this.especialidades = especialidades;
        this.abrigos = abrigos;
        this.areas = areas;
    }

    public List<Especialidade> listarEspecialidades() {
        return especialidades.listar();
    }

    public Especialidade buscarEspecialidade(long id) {
        return especialidades.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Especialidade", id));
    }

    public List<Abrigo> listarAbrigos() {
        return abrigos.listar();
    }

    public Abrigo buscarAbrigo(long id) {
        return abrigos.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Abrigo", id));
    }

    public List<AreaRisco> listarAreasRisco() {
        return areas.listar();
    }

    public AreaRisco buscarAreaRisco(long id) {
        return areas.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Área de risco", id));
    }
}
