package br.com.zelo.bo;

import br.com.zelo.dao.OfertaDAO;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OfertaBO {

    private final OfertaDAO dao;

    public OfertaBO(OfertaDAO dao) {
        this.dao = dao;
    }

    public List<OfertaVaga> listarPorUbs(long ubsId, OfertaStatus status) {
        return dao.listarPorUbs(ubsId, status);
    }

    public List<OfertaVaga> listarPorPaciente(long pacienteId, OfertaStatus status) {
        return dao.listarPorPaciente(pacienteId, status);
    }

    public OfertaVaga buscar(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Oferta", id));
    }
}
