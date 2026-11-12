package br.com.zelo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class OpenMeteoConfig {

    /** Timeout curto: se a Open-Meteo travar, o job de alerta nao pode travar junto. */
    @Bean
    public RestClient openMeteoRestClient(@Value("${zelo.open-meteo-url:https://api.open-meteo.com}") String url) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(3));
        fabrica.setReadTimeout(Duration.ofSeconds(4));
        return RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
    }

    /** Nominatim (OpenStreetMap): a politica de uso exige User-Agent que identifique a aplicacao. */
    @Bean
    public RestClient nominatimRestClient(@Value("${zelo.nominatim-url:https://nominatim.openstreetmap.org}") String url) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(4));
        fabrica.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder().baseUrl(url).requestFactory(fabrica)
                .defaultHeader("User-Agent", "Zelo/1.0 (projeto academico FIAP Global Solution)")
                .defaultHeader("Accept-Language", "pt-BR")
                .build();
    }
}
