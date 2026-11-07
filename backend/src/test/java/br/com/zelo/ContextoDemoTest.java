package br.com.zelo;

import br.com.zelo.bo.DemoBO;
import br.com.zelo.config.AjustavelClock;
import br.com.zelo.controller.DemoController;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.context.WebApplicationContext;

import java.time.Clock;

import static org.assertj.core.api.Assertions.assertThat;

/** Sem banco: o pool nao conecta ate a primeira consulta. O modo demo (rotas, reset e relogio ajustavel) so pode existir com ZELO_DEMO_MODE=true. */
class ContextoDemoTest {

    @Nested
    @SpringBootTest(properties = {"zelo.demo-mode=true", "spring.datasource.password=teste",
            "spring.datasource.hikari.initialization-fail-timeout=-1", "zelo.jobs.enabled=false"})
    class Ligado {
        @Autowired WebApplicationContext contexto;
        @Autowired Clock clock;

        @Test
        void criaAsRotasDeDemoEORelogioAjustavel() {
            assertThat(contexto.getBeanNamesForType(DemoController.class)).hasSize(1);
            assertThat(contexto.getBeanNamesForType(DemoBO.class)).hasSize(1);
            assertThat(clock).isInstanceOf(AjustavelClock.class);
        }
    }

    @Nested
    @SpringBootTest(properties = {"zelo.demo-mode=false", "spring.datasource.password=teste",
            "spring.datasource.hikari.initialization-fail-timeout=-1", "zelo.jobs.enabled=false"})
    class Desligado {
        @Autowired WebApplicationContext contexto;
        @Autowired Clock clock;

        @Test
        void naoExisteNadaDeDemoEORelogioEoDoSistema() {
            assertThat(contexto.getBeanNamesForType(DemoController.class)).isEmpty();
            assertThat(contexto.getBeanNamesForType(DemoBO.class)).isEmpty();
            assertThat(clock).isNotInstanceOf(AjustavelClock.class);
        }
    }
}
