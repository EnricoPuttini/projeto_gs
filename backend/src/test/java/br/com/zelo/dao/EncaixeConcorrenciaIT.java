package br.com.zelo.dao;

import br.com.zelo.bo.EncaixeBO;
import br.com.zelo.exception.RegraNegocioException;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.oracle.OracleContainer;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prova da regra "nunca duas ofertas PENDENTES para a mesma vaga" contra Oracle real, com threads de verdade.
 * Usa o DDL e o seed de producao. Roda no 'mvn verify'; sem Docker e pulado.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = "zelo.jobs.enabled=false")
class EncaixeConcorrenciaIT {

    @Container
    static final OracleContainer ORACLE = new OracleContainer("gvenzl/oracle-free:23-slim-faststart");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", ORACLE::getJdbcUrl);
        r.add("spring.datasource.username", ORACLE::getUsername);
        r.add("spring.datasource.password", ORACLE::getPassword);
    }

    @BeforeAll
    static void criaSchemaESeed() {
        DriverManagerDataSource ds = new DriverManagerDataSource(ORACLE.getJdbcUrl(), ORACLE.getUsername(), ORACLE.getPassword());
        new ResourceDatabasePopulator(new FileSystemResource(Path.of("../database/01_ddl.sql")),
                new FileSystemResource(Path.of("../database/02_dml.sql"))).execute(ds);
    }

    @Autowired EncaixeBO encaixe;
    @Autowired VagaDAO vagaDAO;
    @Autowired OfertaDAO ofertaDAO;
    @Autowired NamedParameterJdbcTemplate jdbc;

    private long novaVagaAberta(long consultaOrigemId) {
        // Horario futuro em relacao ao relogio real: o seed e relativo a hoje e a vaga nao pode estar vencida.
        return vagaDAO.inserir(new Vaga(null, consultaOrigemId, 1L, 1L, LocalDateTime.now().plusDays(2),
                VagaStatus.ABERTA, LocalDateTime.now()));
    }

    private <T> List<T> emParalelo(int threads, Callable<T> tarefa) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch largada = new CountDownLatch(1);
        List<Future<T>> futuros = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futuros.add(pool.submit(() -> {
                largada.await();
                return tarefa.call();
            }));
        }
        largada.countDown();
        List<T> resultados = new ArrayList<>();
        for (Future<T> f : futuros) {
            resultados.add(f.get());
        }
        pool.shutdown();
        return resultados;
    }

    @Test
    void dezChamadasSimultaneasGeramNoMaximoUmaOfertaPendente() throws Exception {
        long vagaId = novaVagaAberta(1L);

        List<Boolean> criou = emParalelo(10, () -> encaixe.ofertarProximo(vagaId).isPresent());

        assertThat(criou.stream().filter(b -> b).count()).isEqualTo(1);
        assertThat(ofertaDAO.contarPendentesDaVaga(vagaId)).isEqualTo(1);
        assertThat(vagaDAO.buscarPorId(vagaId).orElseThrow().status()).isEqualTo(VagaStatus.EM_OFERTA);
    }

    @Test
    void doisAceitesSimultaneosDaMesmaOfertaCriamUmaUnicaConsulta() throws Exception {
        long vagaId = novaVagaAberta(2L);
        OfertaVaga oferta = encaixe.ofertarProximo(vagaId).orElseThrow();

        List<String> resultados = emParalelo(2, () -> {
            try {
                encaixe.aceitar(oferta.id());
                return "ok";
            } catch (RegraNegocioException e) {
                return "recusado";
            }
        });

        assertThat(resultados).containsExactlyInAnyOrder("ok", "recusado");
        Long consultas = jdbc.getJdbcTemplate().queryForObject(
                "SELECT COUNT(*) FROM ZL_CONSULTA WHERE ORIGEM = 'ENCAIXE' AND PACIENTE_ID = " + oferta.pacienteId(), Long.class);
        assertThat(consultas).isEqualTo(1);
        assertThat(ofertaDAO.buscarPorId(oferta.id()).orElseThrow().status()).isEqualTo(OfertaStatus.ACEITA);
        assertThat(vagaDAO.buscarPorId(vagaId).orElseThrow().status()).isEqualTo(VagaStatus.PREENCHIDA);
    }

    @Test
    void aceiteERecusaSimultaneosTerminamEmEstadoConsistente() throws Exception {
        long vagaId = novaVagaAberta(3L);
        OfertaVaga oferta = encaixe.ofertarProximo(vagaId).orElseThrow();

        emParalelo(2, () -> {
            try {
                // metade aceita, metade recusa: exatamente um dos dois vence
                if (Thread.currentThread().getId() % 2 == 0) {
                    encaixe.aceitar(oferta.id());
                } else {
                    encaixe.recusar(oferta.id());
                }
            } catch (RegraNegocioException ignorada) {
                // o perdedor da corrida recebe "oferta nao esta mais disponivel"
            }
            return null;
        });

        assertThat(ofertaDAO.contarPendentesDaVaga(vagaId)).isLessThanOrEqualTo(1);
        assertThat(ofertaDAO.buscarPorId(oferta.id()).orElseThrow().status()).isNotEqualTo(OfertaStatus.PENDENTE);
    }
}
