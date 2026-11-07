package br.com.zelo.dao;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

/** Utilidades JDBC comuns aos DAOs. O SQL em si fica sempre explicito em cada DAO. */
abstract class BaseDAO {

    protected final NamedParameterJdbcTemplate jdbc;

    protected BaseDAO(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** INSERT em tabela IDENTITY devolvendo o ID gerado (Oracle exige informar a coluna de retorno). */
    protected Long inserir(String sql, SqlParameterSource params) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(sql, params, keys, new String[]{"ID"});
        return keys.getKey().longValue();
    }

    protected static LocalDateTime dataHora(ResultSet rs, String coluna) throws SQLException {
        return rs.getObject(coluna, LocalDateTime.class);
    }

    protected static boolean flag(ResultSet rs, String coluna) throws SQLException {
        return rs.getInt(coluna) == 1;
    }

    protected static int bit(boolean valor) {
        return valor ? 1 : 0;
    }
}
