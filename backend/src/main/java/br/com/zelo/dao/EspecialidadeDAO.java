package br.com.zelo.dao;

import br.com.zelo.model.Especialidade;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class EspecialidadeDAO extends BaseDAO {

    private static final RowMapper<Especialidade> MAPPER = (rs, n) -> new Especialidade(rs.getLong("ID"), rs.getString("NOME"));

    public EspecialidadeDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<Especialidade> listar() {
        return jdbc.query("SELECT ID, NOME FROM ZL_ESPECIALIDADE ORDER BY NOME", MAPPER);
    }

    public Optional<Especialidade> buscarPorId(long id) {
        return jdbc.query("SELECT ID, NOME FROM ZL_ESPECIALIDADE WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }
}
