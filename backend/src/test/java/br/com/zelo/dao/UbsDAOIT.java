package br.com.zelo.dao;

import br.com.zelo.model.Ubs;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.testcontainers.oracle.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Teste de integracao do DAO contra Oracle real (gvenzl/oracle-free). Roda no 'mvn verify'.
 * Sem Docker o teste e pulado, em vez de quebrar o build.
 */
@Testcontainers(disabledWithoutDocker = true)
class UbsDAOIT {

    @Container
    static final OracleContainer ORACLE = new OracleContainer("gvenzl/oracle-free:23-slim-faststart");

    static NamedParameterJdbcTemplate jdbc;

    @BeforeAll
    static void criaSchema() {
        DriverManagerDataSource ds = new DriverManagerDataSource(ORACLE.getJdbcUrl(), ORACLE.getUsername(), ORACLE.getPassword());
        // Usa o MESMO DDL de producao: garante que DAO e database/01_ddl.sql nao divergem.
        ResourceDatabasePopulator ddl = new ResourceDatabasePopulator(new FileSystemResource(Path.of("../database/01_ddl.sql")));
        ddl.setSqlScriptEncoding(StandardCharsets.UTF_8.name());
        ddl.execute(ds);
        jdbc = new NamedParameterJdbcTemplate(ds);
    }

    @Test
    void insereBuscaAtualizaERemoveUbs() {
        UbsDAO dao = new UbsDAO(jdbc);

        Long id = dao.inserir(new Ubs(null, "UBS Teste", "Rua Teste, 1", -23.5, -46.6));
        assertThat(id).isPositive();
        assertThat(dao.buscarPorId(id)).hasValueSatisfying(u -> {
            assertThat(u.nome()).isEqualTo("UBS Teste");
            assertThat(u.lat()).isEqualTo(-23.5);
        });

        assertThat(dao.atualizar(new Ubs(id, "UBS Teste 2", "Rua Teste, 2", -23.5, -46.6))).isTrue();
        assertThat(dao.buscarPorId(id).orElseThrow().nome()).isEqualTo("UBS Teste 2");

        assertThat(dao.remover(id)).isTrue();
        assertThat(dao.buscarPorId(id)).isEmpty();
    }
}
