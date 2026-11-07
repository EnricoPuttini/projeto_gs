package br.com.zelo.bo;

import br.com.zelo.dao.OfertaDAO;
import br.com.zelo.dto.PainelDTOs.OfertaDetalhe;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Vaga;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class OfertaBO {

    private final OfertaDAO dao;
    private final VagaBO vagas;
    private final UbsBO ubs;
    private final PacienteBO pacientes;
    private final ReferenciaBO referencia;
    private final Clock clock;

    public OfertaBO(OfertaDAO dao, VagaBO vagas, UbsBO ubs, PacienteBO pacientes, ReferenciaBO referencia, Clock clock) {
        this.dao = dao;
        this.vagas = vagas;
        this.ubs = ubs;
        this.pacientes = pacientes;
        this.referencia = referencia;
        this.clock = clock;
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

    public OfertaDetalhe detalhar(long id) {
        return detalhar(buscar(id), pacientes.mapaPorId());
    }

    public List<OfertaDetalhe> detalharPorUbs(long ubsId, OfertaStatus status) {
        Map<Long, br.com.zelo.model.Paciente> porId = pacientes.mapaPorId();
        return dao.listarPorUbs(ubsId, status).stream().map(o -> detalhar(o, porId)).toList();
    }

    public List<OfertaDetalhe> detalharPorPaciente(long pacienteId, OfertaStatus status) {
        pacientes.buscarEntidade(pacienteId);
        Map<Long, br.com.zelo.model.Paciente> porId = pacientes.mapaPorId();
        return dao.listarPorPaciente(pacienteId, status).stream().map(o -> detalhar(o, porId)).toList();
    }

    private OfertaDetalhe detalhar(OfertaVaga o, Map<Long, br.com.zelo.model.Paciente> porId) {
        Vaga vaga = vagas.buscar(o.vagaId());
        // Segundos restantes vem do relogio do servidor: o app nao depende do relogio do celular.
        long restantes = o.status() == OfertaStatus.PENDENTE
                ? Math.max(0, Duration.between(LocalDateTime.now(clock), o.expiraEm()).getSeconds()) : 0;
        return new OfertaDetalhe(o.id(), o.vagaId(), o.pacienteId(), porId.get(o.pacienteId()).nome(),
                ubs.buscar(vaga.ubsId()).nome(), referencia.buscarEspecialidade(vaga.especialidadeId()).nome(),
                vaga.dataHora(), o.enviadaEm(), o.expiraEm(), o.status(), restantes);
    }
}
