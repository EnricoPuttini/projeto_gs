package br.com.zelo.integration;

import br.com.zelo.bo.Geo;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Unidade de saude e escola publica REAIS mais perto de um ponto, pela busca do Nominatim (OpenStreetMap).
 * So o modo "Experimente" usa. Respeita a politica de uso do OSM: User-Agent identificado (no RestClient),
 * no maximo 1 consulta por segundo (metodo sincronizado + pausa) e cache de 24 h por regiao (~100 m).
 * Qualquer falha vira "nao encontrado" + log: o teste do visitante segue com nomes genericos.
 */
@Component
public class LugaresClient {

    private static final Logger log = LoggerFactory.getLogger(LugaresClient.class);
    private static final Duration CACHE = Duration.ofHours(24);
    private static final double CAIXA_GRAUS = 0.03; // ~3 km para cada lado

    public record Lugar(String nome, double lat, double lng, long metros) {
    }

    public record Proximos(Lugar saude, Lugar escola) {
    }

    private record Entrada(Proximos valor, Instant em) {
    }

    private final RestClient http;
    private final Clock clock;
    private final Map<String, Entrada> cache = new ConcurrentHashMap<>();
    private long ultimaConsultaMs;

    public LugaresClient(@Qualifier("nominatimRestClient") RestClient http, Clock clock) {
        this.http = http;
        this.clock = clock;
    }

    public Proximos proximos(double lat, double lng) {
        String chave = String.format(Locale.ROOT, "%.3f,%.3f", lat, lng);
        Entrada e = cache.get(chave);
        if (e != null && Duration.between(e.em(), clock.instant()).compareTo(CACHE) < 0) {
            return e.valor();
        }
        // UBS primeiro; se a regiao nao tiver nada com esse nome, tenta outros jeitos de chamar a unidade
        Lugar saude = maisPerto(lat, lng, List.of("UBS", "unidade básica de saúde", "posto de saúde"));
        Lugar escola = maisPerto(lat, lng, List.of("escola estadual", "escola municipal"));
        Proximos p = new Proximos(saude, escola);
        if (saude != null || escola != null) {
            cache.put(chave, new Entrada(p, clock.instant()));
        }
        return p;
    }

    /** Nas buscas de saude para no primeiro termo que achar algo; nas de escola junta os dois termos. */
    private Lugar maisPerto(double lat, double lng, List<String> termos) {
        Lugar melhor = null;
        for (String termo : termos) {
            for (JsonNode r : buscar(termo, lat, lng)) {
                String nome = r.path("name").asText("");
                if (nome.isBlank()) {
                    nome = r.path("display_name").asText("").split(",")[0];
                }
                double la = r.path("lat").asDouble(), ln = r.path("lon").asDouble();
                long metros = Math.round(Geo.distanciaKm(lat, lng, la, ln) * 1000);
                if (!nome.isBlank() && (melhor == null || metros < melhor.metros())) {
                    melhor = new Lugar(nome, la, ln, metros);
                }
            }
            if (melhor != null && !termo.startsWith("escola")) {
                break;
            }
        }
        return melhor;
    }

    /** Uma consulta por vez, com 1,1 s de intervalo (politica do Nominatim). */
    private synchronized List<JsonNode> buscar(String termo, double lat, double lng) {
        try {
            long espera = 1100 - (System.currentTimeMillis() - ultimaConsultaMs);
            if (espera > 0) {
                Thread.sleep(espera);
            }
            String caixa = String.format(Locale.ROOT, "%.5f,%.5f,%.5f,%.5f", lng - CAIXA_GRAUS, lat + CAIXA_GRAUS, lng + CAIXA_GRAUS, lat - CAIXA_GRAUS);
            JsonNode corpo = http.get()
                    .uri(u -> u.path("/search").queryParam("format", "jsonv2").queryParam("limit", 8).queryParam("bounded", 1)
                            .queryParam("countrycodes", "br").queryParam("viewbox", caixa).queryParam("q", termo).build())
                    .retrieve()
                    .body(JsonNode.class);
            ultimaConsultaMs = System.currentTimeMillis();
            List<JsonNode> lista = new ArrayList<>();
            if (corpo != null && corpo.isArray()) {
                corpo.forEach(lista::add);
            }
            return lista;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (RuntimeException ex) {
            ultimaConsultaMs = System.currentTimeMillis();
            log.warn("Nominatim indisponível ({}): seguindo sem lugares para '{}'", ex.getMessage(), termo);
            return List.of();
        }
    }
}
