package br.com.zelo.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenMeteoClientTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private static final Clock CLOCK = Clock.fixed(LocalDateTime.of(2026, 11, 12, 14, 20).atZone(SP).toInstant(), SP);

    /** 13h..17h; as 3 horas a partir das 14h somam 2 + 3 + 4 = 9 mm (a das 13h e a das 17h ficam de fora). */
    private static final String RESPOSTA = """
            {"hourly":{"time":["2026-11-12T13:00","2026-11-12T14:00","2026-11-12T15:00","2026-11-12T16:00","2026-11-12T17:00"],
                       "precipitation":[9.0,2.0,3.0,4.0,50.0]}}""";

    MockRestServiceServer servidor;
    OpenMeteoClient cliente;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://open-meteo.teste");
        servidor = MockRestServiceServer.bindTo(builder).build();
        cliente = new OpenMeteoClient(builder.build(), CLOCK);
    }

    @Test
    void somaAsProximasTresHorasAPartirDaHoraAtual() {
        servidor.expect(requestTo(containsString("/v1/forecast")))
                .andExpect(queryParam("hourly", "precipitation"))
                .andExpect(queryParam("latitude", "-23.564"))
                .andExpect(queryParam("timezone", "America/Sao_Paulo"))
                .andRespond(withSuccess(RESPOSTA, MediaType.APPLICATION_JSON));

        assertThat(cliente.milimetrosProximasHoras(-23.564, -46.644, 3)).contains(9.0);
        servidor.verify();
    }

    @Test
    void usaCacheParaCoordenadasProximas() {
        servidor.expect(requestTo(containsString("/v1/forecast"))).andRespond(withSuccess(RESPOSTA, MediaType.APPLICATION_JSON));

        cliente.milimetrosProximasHoras(-23.5641, -46.6441, 3);
        Optional<Double> segunda = cliente.milimetrosProximasHoras(-23.5644, -46.6444, 3);

        // so uma chamada HTTP foi esperada; uma segunda faria o servidor de teste falhar
        assertThat(segunda).contains(9.0);
        servidor.verify();
    }

    @Test
    void cacheExpiraDepoisDeDezMinutos() {
        Clock[] agora = {CLOCK};
        Clock relogio = new Clock() {
            public ZoneId getZone() { return SP; }
            public Clock withZone(ZoneId z) { return this; }
            public Instant instant() { return agora[0].instant(); }
        };
        RestClient.Builder builder = RestClient.builder().baseUrl("http://open-meteo.teste");
        MockRestServiceServer srv = MockRestServiceServer.bindTo(builder).build();
        srv.expect(requestTo(containsString("/v1/forecast"))).andRespond(withSuccess(RESPOSTA, MediaType.APPLICATION_JSON));
        srv.expect(requestTo(containsString("/v1/forecast"))).andRespond(withSuccess(RESPOSTA, MediaType.APPLICATION_JSON));
        OpenMeteoClient c = new OpenMeteoClient(builder.build(), relogio);

        c.milimetrosProximasHoras(-23.56, -46.64, 3);
        agora[0] = Clock.offset(CLOCK, java.time.Duration.ofMinutes(11));
        c.milimetrosProximasHoras(-23.56, -46.64, 3);

        srv.verify();
    }

    @Test
    void falhaDoServidorViraVazioSemExcecao() {
        servidor.expect(requestTo(containsString("/v1/forecast"))).andRespond(withServerError());

        assertThat(cliente.milimetrosProximasHoras(-23.56, -46.64, 3)).isEmpty();
    }

    @Test
    void respostaSemPrevisaoHorariaViraVazio() {
        servidor.expect(requestTo(containsString("/v1/forecast")))
                .andRespond(withSuccess("{\"erro\":true}", MediaType.APPLICATION_JSON));

        assertThat(cliente.milimetrosProximasHoras(-23.56, -46.64, 3)).isEmpty();
    }

    @Test
    void jsonQuebradoViraVazio() {
        servidor.expect(requestTo(containsString("/v1/forecast")))
                .andRespond(withSuccess("isto nao e json", MediaType.APPLICATION_JSON));

        assertThat(cliente.milimetrosProximasHoras(-23.56, -46.64, 3)).isEmpty();
    }
}
