package br.com.zelo.dao;

import br.com.zelo.model.AreaRisco;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AreaRiscoDAO extends BaseDAO {

    private static final RowMapper<AreaRisco> MAPPER = (rs, n) -> new AreaRisco(rs.getLong("ID"), rs.getString("NOME"),
            rs.getDouble("LAT"), rs.getDouble("LNG"), rs.getInt("RAIO_M"), rs.getDouble("LIMIAR_MM"));

    public AreaRiscoDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<AreaRisco> listar() {
        return jdbc.query("SELECT ID, NOME, LAT, LNG, RAIO_M, LIMIAR_MM FROM ZL_AREA_RISCO ORDER BY NOME", MAPPER);
    }

    public Optional<AreaRisco> buscarPorId(long id) {
        return jdbc.query("SELECT ID, NOME, LAT, LNG, RAIO_M, LIMIAR_MM FROM ZL_AREA_RISCO WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }
}
