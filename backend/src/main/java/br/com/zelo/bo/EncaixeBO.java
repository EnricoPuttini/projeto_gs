package br.com.zelo.bo;

import br.com.zelo.config.ZeloProperties;
import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.dao.OfertaDAO;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.FilaStatus;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Origem;
import br.com.zelo.model.Paciente;
import br.com.zelo.model.Ubs;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Motor de encaixe: quando uma vaga abre, oferece ao proximo da fila (mesma UBS e especialidade).
 *
 * <p>Concorrencia: todo metodo que mexe numa vaga comeca travando a linha dela com SELECT ... FOR UPDATE
 * (sempre vaga primeiro, depois oferta, para nao haver deadlock por ordem inversa). Quem chega depois espera
 * o commit e enxerga o estado novo. O indice unico UQ_OFE_PEND no banco e a segunda barreira.
 */
@Service
public class EncaixeBO {

    private final VagaBO vagas;
    private final OfertaDAO ofertas;
    private final ConsultaDAO consultas;
    private final FilaBO fila;
    private final PacienteBO pacientes;
    private final UbsBO ubs;
    private final ReferenciaBO referencia;
    private final RankingFila ranking;
    private final RiscoFaltaBO risco;
    private final CanalMensageria canal;
    private final ZeloProperties props;
    private final Clock clock;

    public EncaixeBO(VagaBO vagas, OfertaDAO ofertas, ConsultaDAO consultas, FilaBO fila, PacienteBO pacientes,
                     UbsBO ubs, ReferenciaBO referencia, RankingFila ranking, RiscoFaltaBO risco,
                     CanalMensageria canal, ZeloProperties props, Clock clock) {
        this.vagas = vagas;
        this.ofertas = ofertas;
        this.consultas = consultas;
        this.fila = fila;
        this.pacientes = pacientes;
        this.ubs = ubs;
        this.referencia = referencia;
        this.ranking = ranking;
        this.risco = risco;
        this.canal = canal;
        this.props = props;
        this.clock = clock;
    }

    /** Oferece a vaga ao proximo candidato. Vazio se a vaga nao esta ABERTA ou se virou PERDIDA. */
    @Transactional
    public Optional<OfertaVaga> ofertarProximo(long vagaId) {
        vagas.buscarTravando(vagaId);
        return ofertarSeAberta(vagaId);
    }

    /** O paciente aceita: nasce a consulta de ENCAIXE, a fila vira ATENDIDA e a vaga PREENCHIDA. */
    // noRollbackFor: se a oferta venceu, a expiracao (e a oferta ao proximo) precisa ser gravada
    // mesmo que o aceite seja recusado com erro.
    @Transactional(noRollbackFor = RegraNegocioException.class)
    public Consulta aceitar(long ofertaId) {
        OfertaVaga oferta = ofertaTravada(ofertaId);
        Vaga vaga = vagas.buscar(oferta.vagaId());
        if (oferta.status() != OfertaStatus.PENDENTE) {
            throw new RegraNegocioException("Esta oferta não está mais disponível.");
        }
        LocalDateTime agora = LocalDateTime.now(clock);
        if (!oferta.expiraEm().isAfter(agora)) {
            encerrar(oferta, OfertaStatus.EXPIRADA, "O tempo para aceitar a vaga acabou. Ela foi oferecida a outra pessoa.");
            throw new RegraNegocioException("O tempo da oferta acabou. A vaga foi oferecida ao próximo da fila.");
        }

        oferta.status().validarTransicaoPara(OfertaStatus.ACEITA);
        ofertas.atualizarStatus(oferta.id(), OfertaStatus.ACEITA);
        Paciente paciente = pacientes.buscarEntidade(oferta.pacienteId());
        // Encaixe nasce CONFIRMADA: a propria pessoa acabou de dizer que vai.
        Long consultaId = consultas.inserir(new Consulta(null, paciente.id(), vaga.ubsId(), vaga.especialidadeId(),
                vaga.dataHora(), ConsultaStatus.CONFIRMADA, risco.calcular(paciente, vaga.dataHora(), false),
                Origem.ENCAIXE, false, agora));
        fila.transicionar(oferta.filaId(), FilaStatus.ATENDIDA);
        vagas.transicionar(vaga.id(), VagaStatus.PREENCHIDA);
        return consultas.buscarPorId(consultaId).orElseThrow();
    }

    /** O paciente recusa: a vaga volta a ABERTA e segue para o proximo. */
    @Transactional
    public OfertaVaga recusar(long ofertaId) {
        OfertaVaga oferta = ofertaTravada(ofertaId);
        if (oferta.status() != OfertaStatus.PENDENTE) {
            throw new RegraNegocioException("Esta oferta não está mais disponível.");
        }
        encerrar(oferta, OfertaStatus.RECUSADA, null);
        return ofertas.buscarPorId(ofertaId).orElseThrow();
    }

    /** Expira uma oferta vencida (chamado pelo job). Se ja foi respondida, nao faz nada. */
    @Transactional
    public void expirar(long ofertaId) {
        OfertaVaga oferta = ofertaTravada(ofertaId);
        if (oferta.status() == OfertaStatus.PENDENTE && !oferta.expiraEm().isAfter(LocalDateTime.now(clock))) {
            encerrar(oferta, OfertaStatus.EXPIRADA, "O tempo para aceitar a vaga acabou. Ela foi oferecida a outra pessoa.");
        }
    }

    public List<Long> idsVencidos() {
        return ofertas.listarIdsPendentesVencidas(LocalDateTime.now(clock));
    }

    /** Recusa/expiracao: fecha a oferta, devolve a vaga para ABERTA e tenta o proximo da fila. */
    private void encerrar(OfertaVaga oferta, OfertaStatus destino, String avisoAoPaciente) {
        oferta.status().validarTransicaoPara(destino);
        ofertas.atualizarStatus(oferta.id(), destino);
        vagas.transicionar(oferta.vagaId(), VagaStatus.ABERTA);
        if (avisoAoPaciente != null) {
            canal.enviar(oferta.pacienteId(), avisoAoPaciente, "OFERTA_EXPIRADA");
        }
        ofertarSeAberta(oferta.vagaId());
    }

    /** Pre-condicao: a linha da vaga ja esta travada nesta transacao. */
    private Optional<OfertaVaga> ofertarSeAberta(long vagaId) {
        Vaga vaga = vagas.buscar(vagaId);
        if (vaga.status() != VagaStatus.ABERTA) {
            return Optional.empty();
        }
        LocalDateTime agora = LocalDateTime.now(clock);
        // Vaga de horario que ja passou nao ajuda ninguem.
        if (!vaga.dataHora().isAfter(agora)) {
            vagas.transicionar(vagaId, VagaStatus.PERDIDA);
            return Optional.empty();
        }

        Optional<RankingFila.Candidato> proximo = escolherCandidato(vaga);
        if (proximo.isEmpty()) {
            vagas.transicionar(vagaId, VagaStatus.PERDIDA);
            return Optional.empty();
        }

        RankingFila.Candidato c = proximo.get();
        Long id = ofertas.inserir(new OfertaVaga(null, vagaId, c.paciente().id(), c.fila().id(), agora,
                agora.plusMinutes(props.encaixe().ofertaMinutos()), OfertaStatus.PENDENTE));
        vagas.transicionar(vagaId, VagaStatus.EM_OFERTA);
        canal.enviar(c.paciente().id(), textoOferta(vaga), "OFERTA_VAGA");
        return ofertas.buscarPorId(id);
    }

    private Optional<RankingFila.Candidato> escolherCandidato(Vaga vaga) {
        Set<Long> jaOfertados = ofertas.pacientesJaOfertados(vaga.id());
        // Quem cancelou nao deve receber de volta a propria vaga.
        consultas.buscarPorId(vaga.consultaOrigemId()).ifPresent(origem -> jaOfertados.add(origem.pacienteId()));

        List<FilaEspera> elegiveis = fila.listarAtivas(vaga.ubsId(), vaga.especialidadeId()).stream()
                .filter(f -> !jaOfertados.contains(f.pacienteId()))
                .toList();
        if (elegiveis.isEmpty()) {
            return Optional.empty();
        }
        Ubs unidade = ubs.buscar(vaga.ubsId());
        Map<Long, Paciente> porId = pacientes.mapaPorId();
        return ranking.ranquear(unidade, elegiveis, porId, vaga.dataHora()).stream().findFirst();
    }

    /** Trava a vaga da oferta e so entao le a oferta, para enxergar o estado ja commitado por quem veio antes. */
    private OfertaVaga ofertaTravada(long ofertaId) {
        OfertaVaga previa = ofertas.buscarPorId(ofertaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Oferta", ofertaId));
        vagas.buscarTravando(previa.vagaId());
        return ofertas.buscarPorId(ofertaId).orElseThrow();
    }

    private String textoOferta(Vaga vaga) {
        return "Abriu uma vaga de %s na %s, %s. Você quer? Tem %d minutos para responder."
                .formatted(referencia.buscarEspecialidade(vaga.especialidadeId()).nome(),
                        ubs.buscar(vaga.ubsId()).nome(), Formato.dataHora(vaga.dataHora()),
                        props.encaixe().ofertaMinutos());
    }
}
