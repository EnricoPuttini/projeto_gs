package br.com.zelo.dao;

import br.com.zelo.model.Ubs;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UbsDAO extends BaseDAO {

    private static final RowMapper<Ubs> MAPPER = (rs, n) -> new Ubs(rs.getLong("ID"), rs.getString("NOME"),
            rs.getString("ENDERECO"), rs.getDouble("LAT"), rs.getDouble("LNG"));

    public UbsDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<Ubs> listar() {
        return jdbc.query("SELECT ID, NOME, ENDERECO, LAT, LNG FROM ZL_UBS ORDER BY NOME", MAPPER);
    }

    public Optional<Ubs> buscarPorId(long id) {
        return jdbc.query("SELECT ID, NOME, ENDERECO, LAT, LNG FROM ZL_UBS WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Long inserir(Ubs u) {
        return inserir("INSERT INTO ZL_UBS (NOME, ENDERECO, LAT, LNG) VALUES (:nome, :endereco, :lat, :lng)", params(u));
    }

    public boolean atualizar(Ubs u) {
        return jdbc.update("UPDATE ZL_UBS SET NOME = :nome, ENDERECO = :endereco, LAT = :lat, LNG = :lng WHERE ID = :id",
                params(u).addValue("id", u.id())) > 0;
    }

    public boolean remover(long id) {
        return jdbc.update("DELETE FROM ZL_UBS WHERE ID = :id", new MapSqlParameterSource("id", id)) > 0;
    }

    private static MapSqlParameterSource params(Ubs u) {
        return new MapSqlParameterSource().addValue("nome", u.nome()).addValue("endereco", u.endereco())
                .addValue("lat", u.lat()).addValue("lng", u.lng());
    }
}
