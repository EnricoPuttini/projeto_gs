package br.com.zelo.bo;

import br.com.zelo.dao.VagaDAO;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class VagaBO {

    private final VagaDAO dao;
    private final Clock clock;

    public VagaBO(VagaDAO dao, Clock clock) {
        this.dao = dao;
        this.clock = clock;
    }

    public List<Vaga> listar(long ubsId, VagaStatus status) {
        return dao.listarPorUbs(ubsId, status);
    }

    public Vaga buscar(long id) {
        return dao.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Vaga", id));
    }

    /** Abre uma vaga a partir de uma consulta que foi cancelada ou nao respondida. */
    public Vaga abrirAPartirDe(Consulta consulta) {
        Vaga nova = new Vaga(null, consulta.id(), consulta.ubsId(), consulta.especialidadeId(), consulta.dataHora(),
                VagaStatus.ABERTA, LocalDateTime.now(clock));
        return buscar(dao.inserir(nova));
    }

    /** Unico caminho para mudar o status de uma vaga: valida a transicao antes de gravar. */
    public Vaga transicionar(long id, VagaStatus destino) {
        Vaga vaga = dao.buscarPorIdParaAtualizar(id).orElseThrow(() -> new RecursoNaoEncontradoException("Vaga", id));
        vaga.status().validarTransicaoPara(destino);
        dao.atualizarStatus(id, destino);
        return buscar(id);
    }
}
