package br.com.zelo.bo;

import br.com.zelo.model.Paciente;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Risco de falta por regressao logistica: p = 1 / (1 + e^-(intercepto + soma(peso * feature))).
 * Os coeficientes vem de modelo-falta.json; trocar o arquivo (saida do notebook de Data Science)
 * nao exige mudar codigo. As features seguem o dataset publico "Medical Appointment No Shows".
 */
@Service
public class RiscoFaltaBO {

    static final Set<String> FEATURES = Set.of("idade", "diasAntecedencia", "bolsaFamilia", "hipertensao",
            "diabetes", "deficiencia", "lembreteEnviado", "faltasAnteriores");

    /** Campos extras no JSON (metadados do notebook) sao ignorados; so as features sao validadas. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Modelo(String versao, double intercepto, double limiarAlto, Map<String, Double> pesos) {
    }

    private final Modelo modelo;
    private final Clock clock;

    @Autowired // dois construtores: o Spring precisa saber qual usar (o outro e so para testes)
    public RiscoFaltaBO(ObjectMapper mapper, Clock clock) throws IOException {
        this(carregar(mapper), clock);
    }

    RiscoFaltaBO(Modelo modelo, Clock clock) {
        // Falha na subida se o JSON trouxer feature que o codigo nao conhece (erro de digitacao no notebook).
        for (String nome : modelo.pesos().keySet()) {
            if (!FEATURES.contains(nome)) {
                throw new IllegalStateException("modelo-falta.json: feature desconhecida '" + nome + "'. Validas: " + FEATURES);
            }
        }
        this.modelo = modelo;
        this.clock = clock;
    }

    private static Modelo carregar(ObjectMapper mapper) throws IOException {
        try (InputStream in = new ClassPathResource("modelo-falta.json").getInputStream()) {
            return mapper.readValue(in, Modelo.class);
        }
    }

    public double limiarAlto() {
        return modelo.limiarAlto();
    }

    public boolean alto(Double risco) {
        return risco != null && risco >= modelo.limiarAlto();
    }

    /** Probabilidade (0 a 1, 3 casas) de o paciente faltar a uma consulta em {@code dataConsulta}. */
    public double calcular(Paciente p, LocalDateTime dataConsulta, boolean lembreteEnviado) {
        LocalDate hoje = LocalDate.now(clock);
        Map<String, Double> f = new HashMap<>();
        f.put("idade", (double) p.idade(hoje));
        f.put("diasAntecedencia", (double) Math.max(0, ChronoUnit.DAYS.between(hoje, dataConsulta.toLocalDate())));
        f.put("bolsaFamilia", bit(p.bolsaFamilia()));
        f.put("hipertensao", bit(p.hipertensao()));
        f.put("diabetes", bit(p.diabetes()));
        f.put("deficiencia", bit(p.deficiencia()));
        f.put("lembreteEnviado", bit(lembreteEnviado));
        f.put("faltasAnteriores", (double) p.faltasAnteriores());

        double z = modelo.intercepto();
        for (Map.Entry<String, Double> peso : modelo.pesos().entrySet()) {
            z += peso.getValue() * f.get(peso.getKey());
        }
        double prob = 1.0 / (1.0 + Math.exp(-z));
        return Math.round(prob * 1000.0) / 1000.0;
    }

    private static double bit(boolean b) {
        return b ? 1.0 : 0.0;
    }
}
