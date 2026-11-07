package br.com.zelo.bo;

import br.com.zelo.dao.ConsultaDAO;
import br.com.zelo.dto.PainelDTOs.ConsultaDetalhe;
import br.com.zelo.dto.PainelDTOs.FilaDetalhe;
import br.com.zelo.dto.PainelDTOs.PainelUbs;
import br.com.zelo.dto.PainelDTOs.VagaDetalhe;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.Paciente;
import br.com.zelo.model.Ubs;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Monta tudo que o painel da UBS mostra em UMA chamada, para o polling de 3-5 s ser barato e consistente. */
@Service
public class PainelBO {

    private final UbsBO ubsBO;
    private final PacienteBO pacientes;
    private final ReferenciaBO referencia;
    private final ConsultaDAO consultas;
    private final FilaBO fila;
    private final VagaBO vagas;
    private final OfertaBO ofertas;
    private final ImpactoBO impacto;
    private final RankingFila ranking;
    private final RiscoFaltaBO risco;
    private final Clock clock;

    public PainelBO(UbsBO ubsBO, PacienteBO pacientes, ReferenciaBO referencia, ConsultaDAO consultas, FilaBO fila,
                    VagaBO vagas, OfertaBO ofertas, ImpactoBO impacto, RankingFila ranking, RiscoFaltaBO risco, Clock clock) {
        this.ubsBO = ubsBO;
        this.pacientes = pacientes;
        this.referencia = referencia;
        this.consultas = consultas;
        this.fila = fila;
        this.vagas = vagas;
        this.ofertas = ofertas;
        this.impacto = impacto;
        this.ranking = ranking;
        this.risco = risco;
        this.clock = clock;
    }

    public PainelUbs montar(long ubsId) {
        Ubs ubs = ubsBO.buscar(ubsId);
        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDate hoje = agora.toLocalDate();
        Map<Long, Paciente> porId = pacientes.mapaPorId();
        Map<Long, String> especialidades = referencia.listarEspecialidades().stream()
                .collect(Collectors.toMap(e -> e.id(), e -> e.nome()));

        // Hoje e amanha: a confirmacao D-1 e os encaixes acontecem sobre as consultas de amanha.
        List<ConsultaDetalhe> agenda = consultas.listarPorUbsEPeriodo(ubsId, hoje.atStartOfDay(), hoje.plusDays(2).atStartOfDay())
                .stream().map(c -> detalhar(c, porId, especialidades)).toList();

        List<VagaDetalhe> abertas = new ArrayList<>();
        for (Vaga v : vagas.listar(ubsId, null)) {
            if (v.status() == VagaStatus.ABERTA || v.status() == VagaStatus.EM_OFERTA) {
                abertas.add(new VagaDetalhe(v.id(), especialidades.get(v.especialidadeId()), v.dataHora(), v.status()));
            }
        }

        return new PainelUbs(ubs, agora, agenda, filaOrdenada(ubs, porId, especialidades, agora), abertas,
                ofertas.detalharPorUbs(ubsId, br.com.zelo.model.OfertaStatus.PENDENTE), impacto.calcular(ubsId));
    }

    private ConsultaDetalhe detalhar(Consulta c, Map<Long, Paciente> porId, Map<Long, String> especialidades) {
        return new ConsultaDetalhe(c.id(), c.pacienteId(), porId.get(c.pacienteId()).nome(),
                especialidades.get(c.especialidadeId()), c.dataHora(), c.status(), c.riscoFalta(),
                risco.alto(c.riscoFalta()), c.origem());
    }

    /** Fila ativa agrupada por especialidade, cada grupo na ordem em que o motor de encaixe a chamaria. */
    private List<FilaDetalhe> filaOrdenada(Ubs ubs, Map<Long, Paciente> porId, Map<Long, String> especialidades, LocalDateTime agora) {
        List<FilaEspera> ativas = fila.listarAtivas(ubs.id(), null);
        Map<Long, List<FilaEspera>> porEspecialidade = ativas.stream()
                .collect(Collectors.groupingBy(FilaEspera::especialidadeId));
        List<FilaDetalhe> saida = new ArrayList<>();
        porEspecialidade.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(e -> {
            int posicao = 1;
            for (RankingFila.Candidato c : ranking.ranquear(ubs, e.getValue(), porId, agora.plusDays(1))) {
                saida.add(new FilaDetalhe(c.fila().id(), c.paciente().id(), c.paciente().nome(),
                        especialidades.get(e.getKey()), c.fila().gravidade(), c.diasEspera(), c.prioridadeLegal(), posicao++));
            }
        });
        return saida;
    }
}
