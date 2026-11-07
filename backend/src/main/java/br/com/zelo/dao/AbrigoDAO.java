package br.com.zelo.dao;

import br.com.zelo.model.Abrigo;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AbrigoDAO extends BaseDAO {

    private static final RowMapper<Abrigo> MAPPER = (rs, n) -> new Abrigo(rs.getLong("ID"), rs.getString("NOME"),
            rs.getString("ENDERECO"), rs.getDouble("LAT"), rs.getDouble("LNG"), rs.getInt("CAPACIDADE"));

    public AbrigoDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<Abrigo> listar() {
        return jdbc.query("SELECT ID, NOME, ENDERECO, LAT, LNG, CAPACIDADE FROM ZL_ABRIGO ORDER BY NOME", MAPPER);
    }

    public Optional<Abrigo> buscarPorId(long id) {
        return jdbc.query("SELECT ID, NOME, ENDERECO, LAT, LNG, CAPACIDADE FROM ZL_ABRIGO WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }
}
