package br.com.zelo.dao;

import br.com.zelo.model.LocalSalvo;
import br.com.zelo.model.LocalSalvo.IntensidadeAlerta;
import br.com.zelo.model.LocalSalvo.TipoLocal;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class LocalSalvoDAO extends BaseDAO {

    private static final String COLUNAS = "ID, PACIENTE_ID, APELIDO, LAT, LNG, TIPO, INTENSIDADE, ATIVO";

    private static final RowMapper<LocalSalvo> MAPPER = (rs, n) -> new LocalSalvo(rs.getLong("ID"), rs.getLong("PACIENTE_ID"),
            rs.getString("APELIDO"), rs.getDouble("LAT"), rs.getDouble("LNG"), TipoLocal.valueOf(rs.getString("TIPO")),
            IntensidadeAlerta.valueOf(rs.getString("INTENSIDADE")), flag(rs, "ATIVO"));

    public LocalSalvoDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<LocalSalvo> listarPorPaciente(long pacienteId) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_LOCAL_SALVO WHERE PACIENTE_ID = :p ORDER BY ID",
                new MapSqlParameterSource("p", pacienteId), MAPPER);
    }

    /** Todos os locais com aviso ligado: a base do job de alerta. */
    public List<LocalSalvo> listarAtivos() {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_LOCAL_SALVO WHERE ATIVO = 1 ORDER BY ID", MAPPER);
    }

    public Optional<LocalSalvo> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_LOCAL_SALVO WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Long inserir(LocalSalvo l) {
        return inserir("INSERT INTO ZL_LOCAL_SALVO (PACIENTE_ID, APELIDO, LAT, LNG, TIPO, INTENSIDADE, ATIVO) "
                + "VALUES (:pac, :apelido, :lat, :lng, :tipo, :int, :ativo)", params(l));
    }

    public boolean atualizar(LocalSalvo l) {
        return jdbc.update("UPDATE ZL_LOCAL_SALVO SET APELIDO = :apelido, LAT = :lat, LNG = :lng, TIPO = :tipo, "
                + "INTENSIDADE = :int, ATIVO = :ativo WHERE ID = :id", params(l).addValue("id", l.id())) > 0;
    }

    private static MapSqlParameterSource params(LocalSalvo l) {
        return new MapSqlParameterSource().addValue("pac", l.pacienteId()).addValue("apelido", l.apelido())
                .addValue("lat", l.lat()).addValue("lng", l.lng()).addValue("tipo", l.tipo().name())
                .addValue("int", l.intensidade().name()).addValue("ativo", bit(l.ativo()));
    }
}
