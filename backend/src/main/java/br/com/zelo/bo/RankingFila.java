package br.com.zelo.bo;

import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.Paciente;
import br.com.zelo.model.Ubs;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Ordem de quem recebe a vaga (documentada em docs/decisoes.md):
 * prioridade legal, gravidade, dias de espera, distancia casa-UBS (Haversine), menor risco de falta.
 * O ultimo criterio (id da fila) so existe para o resultado ser deterministico em empates totais.
 */
@Component
public class RankingFila {

    public record Candidato(FilaEspera fila, Paciente paciente, boolean prioridadeLegal, long diasEspera,
                            double distanciaKm, double risco) {
    }

    static final Comparator<Candidato> ORDEM = Comparator
            .comparing(Candidato::prioridadeLegal, Comparator.reverseOrder())
            .thenComparing((Candidato c) -> c.fila().gravidade(), Comparator.reverseOrder())
            .thenComparing(Candidato::diasEspera, Comparator.reverseOrder())
            .thenComparingDouble(Candidato::distanciaKm)
            .thenComparingDouble(Candidato::risco)
            .thenComparing(c -> c.fila().id());

    private final RiscoFaltaBO risco;
    private final Clock clock;

    public RankingFila(RiscoFaltaBO risco, Clock clock) {
        this.risco = risco;
        this.clock = clock;
    }

    /** Ordena a fila para uma consulta em {@code dataConsulta} na {@code ubs}. */
    public List<Candidato> ranquear(Ubs ubs, List<FilaEspera> fila, Map<Long, Paciente> pacientes, LocalDateTime dataConsulta) {
        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDate hoje = agora.toLocalDate();
        return fila.stream()
                .map(f -> {
                    Paciente p = pacientes.get(f.pacienteId());
                    return new Candidato(f, p, p.prioridadeLegal(hoje), ChronoUnit.DAYS.between(f.dataEntrada(), agora),
                            Geo.distanciaKm(p.lat(), p.lng(), ubs.lat(), ubs.lng()), risco.calcular(p, dataConsulta, false));
                })
                .sorted(ORDEM)
                .toList();
    }
}
