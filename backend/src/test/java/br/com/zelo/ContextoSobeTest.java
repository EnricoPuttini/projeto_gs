package br.com.zelo;

import br.com.zelo.bo.EncaixeBO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sobe o contexto Spring COMPLETO sem banco (o pool nao conecta ate a primeira consulta). Pega erros de
 * montagem que os testes com Mockito nao veem: construtor ambiguo, dependencia circular, bean faltando.
 */
@SpringBootTest(properties = {
        "spring.datasource.password=teste",
        "spring.datasource.hikari.initialization-fail-timeout=-1",
        "zelo.jobs.enabled=false"})
class ContextoSobeTest {

    @Autowired WebApplicationContext contexto;
    @Autowired EncaixeBO encaixe;

    @Test
    void contextoCompletoSobeEOsBosEstaoMontados() {
        assertThat(contexto.getBeansOfType(Object.class)).isNotEmpty();
        assertThat(encaixe).isNotNull();
    }
}
