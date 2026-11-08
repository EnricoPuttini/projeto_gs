package br.com.zelo.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class CabecalhosSegurancaFilterTest {

    private MockHttpServletResponse chamar(String uri) throws Exception {
        MockHttpServletResponse resp = new MockHttpServletResponse();
        new CabecalhosSegurancaFilter().doFilter(new MockHttpServletRequest("GET", uri), resp, new MockFilterChain());
        return resp;
    }

    @Test
    void apiRecebeTodosOsCabecalhosEFicaForaDeCache() throws Exception {
        MockHttpServletResponse resp = chamar("/api/v1/painel/ubs/1");

        assertThat(resp.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(resp.getHeader("X-Frame-Options")).isEqualTo("DENY");
        assertThat(resp.getHeader("Referrer-Policy")).isEqualTo("no-referrer");
        assertThat(resp.getHeader("Cache-Control")).isEqualTo("no-store");
    }

    @Test
    void foraDaApiNaoDesligaOCacheDosAssetsDoSwagger() throws Exception {
        MockHttpServletResponse resp = chamar("/swagger-ui/index.css");

        assertThat(resp.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(resp.getHeader("Cache-Control")).isNull();
    }
}
