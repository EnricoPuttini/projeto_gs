package br.com.zelo.dao;

import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.FilaStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class FilaDAO extends BaseDAO {

    private static final String COLUNAS = "ID, PACIENTE_ID, UBS_ID, ESPEC_ID, DATA_ENTRADA, GRAVIDADE, STATUS";

    private static final RowMapper<FilaEspera> MAPPER = (rs, n) -> new FilaEspera(rs.getLong("ID"),
            rs.getLong("PACIENTE_ID"), rs.getLong("UBS_ID"), rs.getLong("ESPEC_ID"), dataHora(rs, "DATA_ENTRADA"),
            rs.getInt("GRAVIDADE"), FilaStatus.valueOf(rs.getString("STATUS")));

    public FilaDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    /** Fila ATIVA de uma UBS, opcionalmente filtrada por especialidade (especialidadeId nulo = todas). */
    public List<FilaEspera> listarAtivas(long ubsId, Long especialidadeId) {
        // Filtro opcional montado no SQL (em vez de ":p IS NULL OR ...") para evitar bind de NULL sem tipo no Oracle.
        MapSqlParameterSource p = new MapSqlParameterSource("ubs", ubsId);
        String filtro = "";
        if (especialidadeId != null) {
            filtro = " AND ESPEC_ID = :esp";
            p.addValue("esp", especialidadeId);
        }
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_FILA WHERE UBS_ID = :ubs AND STATUS = 'ATIVA'" + filtro
                + " ORDER BY DATA_ENTRADA", p, MAPPER);
    }

    public Optional<FilaEspera> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_FILA WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Long inserir(FilaEspera f) {
        return inserir("INSERT INTO ZL_FILA (PACIENTE_ID, UBS_ID, ESPEC_ID, DATA_ENTRADA, GRAVIDADE, STATUS) "
                        + "VALUES (:pac, :ubs, :esp, :entrada, :grav, :status)",
                new MapSqlParameterSource().addValue("pac", f.pacienteId()).addValue("ubs", f.ubsId())
                        .addValue("esp", f.especialidadeId()).addValue("entrada", f.dataEntrada())
                        .addValue("grav", f.gravidade()).addValue("status", f.status().name()));
    }

    public void atualizarStatus(long id, FilaStatus status) {
        jdbc.update("UPDATE ZL_FILA SET STATUS = :status WHERE ID = :id",
                new MapSqlParameterSource("status", status.name()).addValue("id", id));
    }
}
