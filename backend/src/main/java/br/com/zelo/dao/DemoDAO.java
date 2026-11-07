package br.com.zelo.dao;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.util.List;

/** "Resetar dados" do modo demo: apaga tudo e recarrega o MESMO seed de database/02_dml.sql. So existe com ZELO_DEMO_MODE=true. */
@Repository
@ConditionalOnProperty(name = "zelo.demo-mode", havingValue = "true")
public class DemoDAO {

    /** Filhas antes das mães, por causa das chaves estrangeiras. */
    private static final List<String> TABELAS = List.of("ZL_ALERTA", "ZL_MENSAGEM", "ZL_OFERTA", "ZL_VAGA",
            "ZL_LOCAL_SALVO", "ZL_FILA", "ZL_CONSULTA", "ZL_PACIENTE", "ZL_ABRIGO", "ZL_AREA_RISCO",
            "ZL_ESPECIALIDADE", "ZL_UBS");

    private final JdbcTemplate jdbc;
    private final DataSource dataSource;

    public DemoDAO(JdbcTemplate jdbc, DataSource dataSource) {
        this.jdbc = jdbc;
        this.dataSource = dataSource;
    }

    public void resetar() {
        TABELAS.forEach(t -> jdbc.update("DELETE FROM " + t));
        // O seed e copiado para o classpath no build (ver pom.xml), entao ha uma unica fonte da verdade.
        new ResourceDatabasePopulator(new ClassPathResource("db/02_dml.sql")).execute(dataSource);
    }
}
