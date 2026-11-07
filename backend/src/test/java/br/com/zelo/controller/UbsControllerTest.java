package br.com.zelo.controller;

import br.com.zelo.bo.UbsBO;
import br.com.zelo.config.WebConfig;
import br.com.zelo.config.ZeloProperties;
import br.com.zelo.exception.GlobalExceptionHandler;
import br.com.zelo.exception.RecursoNaoEncontradoException;
import br.com.zelo.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Camada web isolada: valida o contrato de erro (ProblemDetail em portugues) sem precisar de banco. */
@WebMvcTest(UbsController.class)
@Import({GlobalExceptionHandler.class, WebConfig.class})
@EnableConfigurationProperties(ZeloProperties.class)
@TestPropertySource(properties = {"zelo.cors-origins=http://localhost:5173", "zelo.timezone=America/Sao_Paulo"})
class UbsControllerTest {

    @Autowired MockMvc mvc;
    @MockBean UbsBO bo;

    @Test
    void corpoInvalidoDevolve400ComErrosPorCampo() throws Exception {
        mvc.perform(post("/api/v1/ubs").contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"\",\"lat\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.endereco").value("Informe o endereço."));
    }

    @Test
    void recursoInexistenteDevolve404EmPortugues() throws Exception {
        when(bo.buscar(9L)).thenThrow(new RecursoNaoEncontradoException("UBS", 9L));

        mvc.perform(get("/api/v1/ubs/9"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("UBS 9 não encontrado(a)."));
    }

    @Test
    void regraDeNegocioDevolve422() throws Exception {
        when(bo.buscar(1L)).thenThrow(new RegraNegocioException("Transição de status inválida: A → B."));

        mvc.perform(get("/api/v1/ubs/1"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Regra de negócio violada"));
    }

    @Test
    void idNaoNumericoDevolve400SemVazarDetalhes() throws Exception {
        mvc.perform(get("/api/v1/ubs/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Requisição inválida"));
    }
}
