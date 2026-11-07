package br.com.zelo.bo;

import br.com.zelo.dao.AlertaDAO;
import br.com.zelo.dao.LocalSalvoDAO;
import br.com.zelo.dto.AlertaDTOs.AlertaDetalhe;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.integration.CanalMensageria;
import br.com.zelo.integration.PrevisaoChuva;
import br.com.zelo.model.Abrigo;
import br.com.zelo.model.Alerta;
import br.com.zelo.model.Alerta.Nivel;
import br.com.zelo.model.AreaRisco;
import br.com.zelo.model.LocalSalvo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Alerta de enchente. Para cada area de risco: se a chuva prevista nas proximas 3 h somar ao menos o
 * limiar da area, todo local salvo ATIVO dentro do raio recebe um alerta com o abrigo mais proximo.
 */
@Service
public class AlertaBO {

    private static final Logger log = LoggerFactory.getLogger(AlertaBO.class);

    static final int HORAS_PREVISAO = 3;
    /** Depois disso um alerta sem confirmacao deixa de ser mostrado como "ativo" (a situacao mudou). */
    static final int VALIDADE_HORAS = 6;

    private final ReferenciaBO referencia;
    private final LocalSalvoDAO locais;
    private final AlertaDAO alertas;
    private final PrevisaoChuva previsao;
    private final CanalMensageria canal;
    private final Clock clock;

    public AlertaBO(ReferenciaBO referencia, LocalSalvoDAO locais, AlertaDAO alertas, PrevisaoChuva previsao,
                    CanalMensageria canal, Clock clock) {
        this.referencia = referencia;
        this.locais = locais;
        this.alertas = alertas;
        this.previsao = previsao;
        this.canal = canal;
        this.clock = clock;
    }

    /** Roda para todas as areas. Uma area sem previsao (API fora) e pulada; as outras seguem. Devolve alertas novos. */
    public int processarAreas() {
        List<LocalSalvo> ativos = locais.listarAtivos();
        int criados = 0;
        for (AreaRisco area : referencia.listarAreasRisco()) {
            Optional<Double> chuva = previsao.proximasHoras(area, HORAS_PREVISAO);
            if (chuva.isEmpty()) {
                log.warn("Sem previsão para a área '{}': nenhum alerta gerado agora.", area.nome());
                continue;
            }
            if (chuva.get() < area.limiarMmHora()) {
                continue;
            }
            for (LocalSalvo local : ativos) {
                if (Geo.distanciaKm(local.lat(), local.lng(), area.lat(), area.lng()) * 1000 <= area.raioMetros()
                        && criarAlerta(local, area, chuva.get())) {
                    criados++;
                }
            }
        }
        return criados;
    }

    /** Devolve false se este local ja foi alertado por esta area na mesma hora. */
    private boolean criarAlerta(LocalSalvo local, AreaRisco area, double chuva) {
        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDateTime janela = agora.truncatedTo(ChronoUnit.HOURS);
        if (alertas.existe(local.id(), area.id(), janela)) {
            return false;
        }
        Optional<Abrigo> abrigo = abrigoMaisProximo(local);
        Alerta alerta = new Alerta(null, local.id(), area.id(), abrigo.map(Abrigo::id).orElse(null), chuva,
                nivel(chuva, area.limiarMmHora()), agora, janela, null);
        Long id = alertas.inserir(alerta);
        canal.enviar(local.pacienteId(), mensagem(local, chuva, abrigo.orElse(null)), "ALERTA_ENCHENTE");
        log.info("Alerta {} criado: local {} na área '{}' ({} mm)", id, local.id(), area.nome(), chuva);
        return true;
    }

    static Nivel nivel(double chuva, double limiar) {
        double razao = chuva / limiar;
        return razao >= 2 ? Nivel.CRITICO : razao >= 1.5 ? Nivel.ALTO : Nivel.ATENCAO;
    }

    private Optional<Abrigo> abrigoMaisProximo(LocalSalvo local) {
        return referencia.listarAbrigos().stream()
                .min(Comparator.comparingDouble(a -> Geo.distanciaKm(local.lat(), local.lng(), a.lat(), a.lng())));
    }

    /** "Estou seguro": encerra o alerta. Confirmar de novo e inofensivo. */
    public Alerta confirmarSeguro(long alertaId) {
        buscar(alertaId);
        alertas.marcarSeguro(alertaId, LocalDateTime.now(clock));
        return buscar(alertaId);
    }

    /** Confirma todos os alertas abertos da pessoa (usado pelo assistente: "to seguro"). Devolve quantos. */
    public int confirmarSeguroDoPaciente(long pacienteId) {
        List<Alerta> abertos = alertas.listarPorPaciente(pacienteId, desde(), true);
        abertos.forEach(a -> alertas.marcarSeguro(a.id(), LocalDateTime.now(clock)));
        return abertos.size();
    }

    public Alerta buscar(long id) {
        return alertas.buscarPorId(id).orElseThrow(() -> new RecursoNaoEncontradoException("Alerta", id));
    }

    public List<AlertaDetalhe> listarDoPaciente(long pacienteId, boolean soAtivos) {
        return alertas.listarPorPaciente(pacienteId, desde(), soAtivos).stream().map(this::detalhar).toList();
    }

    private LocalDateTime desde() {
        return LocalDateTime.now(clock).minusHours(VALIDADE_HORAS);
    }

    private AlertaDetalhe detalhar(Alerta a) {
        LocalSalvo local = locais.buscarPorId(a.localId()).orElseThrow();
        AreaRisco area = referencia.buscarAreaRisco(a.areaId());
        Abrigo abrigo = a.abrigoId() == null ? null : referencia.buscarAbrigo(a.abrigoId());
        Long metros = abrigo == null ? null
                : Math.round(Geo.distanciaKm(local.lat(), local.lng(), abrigo.lat(), abrigo.lng()) * 1000);
        return new AlertaDetalhe(a.id(), local.id(), local.apelido(), local.intensidade(), area.nome(), a.chuvaMm(),
                a.nivel(), a.criadoEm(), a.confirmadoSeguroEm(), abrigo == null ? null : abrigo.nome(),
                abrigo == null ? null : abrigo.endereco(), metros, abrigo == null ? null : rota(local, abrigo),
                mensagem(local, a.chuvaMm(), abrigo));
    }

    /** Texto curto e direto: o que esta acontecendo, o que fazer e para onde ir. */
    static String mensagem(LocalSalvo local, double chuva, Abrigo abrigo) {
        StringBuilder sb = new StringBuilder("ATENÇÃO: vai chover forte perto de %s (cerca de %.0f mm nas próximas 3 horas). "
                .formatted(local.apelido(), chuva));
        sb.append("A rua pode alagar. Guarde seus documentos e remédios em lugar alto e não atravesse água parada. ");
        if (abrigo != null) {
            long metros = Math.round(Geo.distanciaKm(local.lat(), local.lng(), abrigo.lat(), abrigo.lng()) * 1000);
            sb.append("Abrigo mais perto: %s, %s (a %d metros). Rota: %s. ".formatted(abrigo.nome(), abrigo.endereco(),
                    metros, rota(local, abrigo)));
        }
        return sb.append("Quando estiver seguro, diga \"estou seguro\".").toString();
    }

    static String rota(LocalSalvo local, Abrigo abrigo) {
        return String.format(Locale.ROOT,
                "https://www.google.com/maps/dir/?api=1&origin=%.6f,%.6f&destination=%.6f,%.6f&travelmode=walking",
                local.lat(), local.lng(), abrigo.lat(), abrigo.lng());
    }
}
