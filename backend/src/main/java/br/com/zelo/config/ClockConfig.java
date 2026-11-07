package br.com.zelo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Unico ponto onde "agora" nasce. Todo codigo recebe o Clock por injecao; assim os testes fixam o
 * tempo e o modo demo pode avancar o relogio (relogio ajustavel entra no M3, sem mudar os consumidores).
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(ZeloProperties props) {
        return Clock.system(props.timezone());
    }
}
