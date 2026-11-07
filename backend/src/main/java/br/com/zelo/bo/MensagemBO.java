package br.com.zelo.bo;

import br.com.zelo.dao.MensagemDAO;
import br.com.zelo.model.Canal;
import br.com.zelo.model.Direcao;
import br.com.zelo.model.Mensagem;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/** Historico do chat (ZL_MENSAGEM). */
@Service
public class MensagemBO {

    private static final int LIMITE_HISTORICO = 100;

    private final MensagemDAO dao;
    private final PacienteBO pacientes;
    private final Clock clock;

    public MensagemBO(MensagemDAO dao, PacienteBO pacientes, Clock clock) {
        this.dao = dao;
        this.pacientes = pacientes;
        this.clock = clock;
    }

    public void registrar(long pacienteId, Direcao direcao, Canal canal, String texto, String tipo) {
        dao.inserir(new Mensagem(null, pacienteId, direcao, canal, texto, tipo, LocalDateTime.now(clock)));
    }

    public List<Mensagem> historico(long pacienteId) {
        pacientes.buscarEntidade(pacienteId);
        return dao.listarUltimas(pacienteId, LIMITE_HISTORICO);
    }
}
