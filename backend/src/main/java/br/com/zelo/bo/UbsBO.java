package br.com.zelo.bo;

import br.com.zelo.dao.UbsDAO;
import br.com.zelo.dto.UbsRequest;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.Ubs;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UbsBO {

    private final UbsDAO dao;

    public UbsBO(UbsDAO dao) {
        this.dao = dao;
    }

    public List<Ubs> listar() {
        return dao.listar();
    }

    public Ubs buscar(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("UBS", id));
    }

    public Ubs criar(UbsRequest r) {
        Long id = dao.inserir(new Ubs(null, r.nome().trim(), r.endereco().trim(), r.lat(), r.lng()));
        return buscar(id);
    }

    public Ubs atualizar(long id, UbsRequest r) {
        buscar(id);
        dao.atualizar(new Ubs(id, r.nome().trim(), r.endereco().trim(), r.lat(), r.lng()));
        return buscar(id);
    }

    public void remover(long id) {
        buscar(id);
        dao.remover(id);
    }
}
