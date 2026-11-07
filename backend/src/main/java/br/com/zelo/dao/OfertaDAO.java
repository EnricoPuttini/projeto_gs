package br.com.zelo.dao;

import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Optional;

@Repository
public class OfertaDAO extends BaseDAO {

    private static final String COLUNAS = "ID, VAGA_ID, PACIENTE_ID, FILA_ID, ENVIADA_EM, EXPIRA_EM, STATUS";

    private static final RowMapper<OfertaVaga> MAPPER = (rs, n) -> new OfertaVaga(rs.getLong("ID"), rs.getLong("VAGA_ID"),
            rs.getLong("PACIENTE_ID"), rs.getLong("FILA_ID"), dataHora(rs, "ENVIADA_EM"), dataHora(rs, "EXPIRA_EM"),
            OfertaStatus.valueOf(rs.getString("STATUS")));

    public OfertaDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<OfertaVaga> listarPorUbs(long ubsId, OfertaStatus status) {
        MapSqlParameterSource p = new MapSqlParameterSource("ubs", ubsId);
        String filtro = "";
        if (status != null) {
            filtro = " AND o.STATUS = :st";
            p.addValue("st", status.name());
        }
        return jdbc.query("SELECT o.ID, o.VAGA_ID, o.PACIENTE_ID, o.FILA_ID, o.ENVIADA_EM, o.EXPIRA_EM, o.STATUS "
                + "FROM ZL_OFERTA o JOIN ZL_VAGA v ON v.ID = o.VAGA_ID WHERE v.UBS_ID = :ubs" + filtro
                + " ORDER BY o.ENVIADA_EM DESC, o.ID DESC", p, MAPPER);
    }

    public List<OfertaVaga> listarPorPaciente(long pacienteId, OfertaStatus status) {
        MapSqlParameterSource p = new MapSqlParameterSource("pac", pacienteId);
        String filtro = "";
        if (status != null) {
            filtro = " AND STATUS = :st";
            p.addValue("st", status.name());
        }
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_OFERTA WHERE PACIENTE_ID = :pac" + filtro
                + " ORDER BY ENVIADA_EM DESC, ID DESC", p, MAPPER);
    }

    public Optional<OfertaVaga> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_OFERTA WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Optional<OfertaVaga> buscarPendentePorVaga(long vagaId) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_OFERTA WHERE VAGA_ID = :vaga AND STATUS = 'PENDENTE'",
                new MapSqlParameterSource("vaga", vagaId), MAPPER).stream().findFirst();
    }

    public Long inserir(OfertaVaga o) {
        return inserir("INSERT INTO ZL_OFERTA (VAGA_ID, PACIENTE_ID, FILA_ID, ENVIADA_EM, EXPIRA_EM, STATUS) "
                        + "VALUES (:vaga, :pac, :fila, :env, :exp, :status)",
                new MapSqlParameterSource().addValue("vaga", o.vagaId()).addValue("pac", o.pacienteId())
                        .addValue("fila", o.filaId()).addValue("env", o.enviadaEm()).addValue("exp", o.expiraEm())
                        .addValue("status", o.status().name()));
    }

    public void atualizarStatus(long id, OfertaStatus status) {
        jdbc.update("UPDATE ZL_OFERTA SET STATUS = :status WHERE ID = :id",
                new MapSqlParameterSource("status", status.name()).addValue("id", id));
    }

    /** Ofertas PENDENTES cujo prazo ja passou em {@code agora}; o job as expira uma a uma. */
    public List<Long> listarIdsPendentesVencidas(LocalDateTime agora) {
        return jdbc.queryForList("SELECT ID FROM ZL_OFERTA WHERE STATUS = 'PENDENTE' AND EXPIRA_EM <= :agora ORDER BY ID",
                new MapSqlParameterSource("agora", agora), Long.class);
    }

    /** Pacientes que ja receberam oferta desta vaga (qualquer status): ninguem recebe a mesma vaga duas vezes. */
    public Set<Long> pacientesJaOfertados(long vagaId) {
        return new HashSet<>(jdbc.queryForList("SELECT PACIENTE_ID FROM ZL_OFERTA WHERE VAGA_ID = :vaga",
                new MapSqlParameterSource("vaga", vagaId), Long.class));
    }

    public long contarPendentesDaVaga(long vagaId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM ZL_OFERTA WHERE VAGA_ID = :vaga AND STATUS = 'PENDENTE'",
                new MapSqlParameterSource("vaga", vagaId), Long.class);
    }}
