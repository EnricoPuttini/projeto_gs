package br.com.zelo.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Previsao horaria de chuva da Open-Meteo (/v1/forecast?hourly=precipitation).
 * Defensivo por desenho: timeout curto (no RestClient configurado em OpenMeteoConfig), cache de alguns minutos
 * (varias areas proximas, mesma resposta) e fallback — qualquer falha vira Optional.empty() + log, nunca excecao,
 * para o resto do sistema seguir funcionando com a API fora do ar.
 */
@Component
public class OpenMeteoClient {

    private static final Logger log = LoggerFactory.getLogger(OpenMeteoClient.class);
    private static final Duration VALIDADE_CACHE = Duration.ofMinutes(10);

    private record Entrada(JsonNode horario, Instant obtidaEm) {
    }

    private final RestClient http;
    private final Clock clock;
    private final Map<String, Entrada> cache = new ConcurrentHashMap<>();

    public OpenMeteoClient(@org.springframework.beans.factory.annotation.Qualifier("openMeteoRestClient") RestClient openMeteoRestClient, Clock clock) {
        this.http = openMeteoRestClient;
        this.clock = clock;
    }

    /** Soma, em mm, da chuva prevista da hora atual ate {@code horas} horas a frente. Vazio se a API falhou. */
    public Optional<Double> milimetrosProximasHoras(double lat, double lng, int horas) {
        // Coordenadas arredondadas (~1 km) sao a chave do cache: a previsao nao muda dentro dessa distancia.
        String chave = "%.2f,%.2f".formatted(lat, lng);
        Instant agora = clock.instant();
        try {
            Entrada entrada = cache.get(chave);
            if (entrada == null || Duration.between(entrada.obtidaEm(), agora).compareTo(VALIDADE_CACHE) > 0) {
                entrada = new Entrada(buscar(lat, lng), agora);
                cache.put(chave, entrada);
            }
            return Optional.of(somar(entrada.horario(), LocalDateTime.now(clock), horas));
        } catch (RuntimeException e) {
            log.error("Open-Meteo indisponível ({}): seguindo sem previsão para {}", e.getMessage(), chave);
            return Optional.empty();
        }
    }

    private JsonNode buscar(double lat, double lng) {
        JsonNode corpo = http.get()
                .uri(u -> u.path("/v1/forecast")
                        .queryParam("latitude", lat)
                        .queryParam("longitude", lng)
                        .queryParam("hourly", "precipitation")
                        .queryParam("forecast_days", 2)
                        .queryParam("timezone", "America/Sao_Paulo")
                        .build())
                .retrieve()
                .body(JsonNode.class);
        if (corpo == null || !corpo.path("hourly").path("time").isArray()) {
            throw new IllegalStateException("resposta sem previsão horária");
        }
        return corpo.path("hourly");
    }

    /** Soma as horas de [inicio da hora atual, + horas). Os horarios vem como "2026-11-12T14:00" no fuso pedido. */
    static double somar(JsonNode horario, LocalDateTime agora, int horas) {
        LocalDateTime inicio = agora.truncatedTo(ChronoUnit.HOURS);
        LocalDateTime fim = inicio.plusHours(horas);
        JsonNode tempos = horario.path("time");
        JsonNode chuva = horario.path("precipitation");
        double total = 0;
        for (int i = 0; i < tempos.size(); i++) {
            LocalDateTime t = LocalDateTime.parse(tempos.get(i).asText());
            if (!t.isBefore(inicio) && t.isBefore(fim)) {
                total += chuva.path(i).asDouble(0);
            }
        }
        return total;
    }
}
