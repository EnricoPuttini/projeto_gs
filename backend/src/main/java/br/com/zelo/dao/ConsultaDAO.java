package br.com.zelo.dao;

import br.com.zelo.model.Consulta;
import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.Origem;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class ConsultaDAO extends BaseDAO {

    private static final String COLUNAS = "ID, PACIENTE_ID, UBS_ID, ESPEC_ID, DATA_HORA, STATUS, RISCO_FALTA, ORIGEM, "
            + "LEMBRETE_ENVIADO, CRIADA_EM";

    private static final RowMapper<Consulta> MAPPER = (rs, n) -> {
        double risco = rs.getDouble("RISCO_FALTA");
        return new Consulta(rs.getLong("ID"), rs.getLong("PACIENTE_ID"), rs.getLong("UBS_ID"), rs.getLong("ESPEC_ID"),
                dataHora(rs, "DATA_HORA"), ConsultaStatus.valueOf(rs.getString("STATUS")),
                rs.wasNull() ? null : risco, Origem.valueOf(rs.getString("ORIGEM")),
                flag(rs, "LEMBRETE_ENVIADO"), dataHora(rs, "CRIADA_EM"));
    };

    public ConsultaDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    /** Agenda de uma UBS no intervalo [inicio, fim). */
    public List<Consulta> listarPorUbsEPeriodo(long ubsId, LocalDateTime inicio, LocalDateTime fim) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE UBS_ID = :ubs AND DATA_HORA >= :ini "
                        + "AND DATA_HORA < :fim ORDER BY DATA_HORA",
                new MapSqlParameterSource("ubs", ubsId).addValue("ini", inicio).addValue("fim", fim), MAPPER);
    }

    public List<Consulta> listarPorPaciente(long pacienteId) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE PACIENTE_ID = :p ORDER BY DATA_HORA",
                new MapSqlParameterSource("p", pacienteId), MAPPER);
    }

    public Optional<Consulta> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    /** Trava a linha da consulta ate o fim da transacao (evita duas transicoes concorrentes na mesma consulta). */
    public Optional<Consulta> buscarPorIdParaAtualizar(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE ID = :id FOR UPDATE",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Long inserir(Consulta c) {
        return inserir("INSERT INTO ZL_CONSULTA (PACIENTE_ID, UBS_ID, ESPEC_ID, DATA_HORA, STATUS, RISCO_FALTA, ORIGEM, "
                        + "LEMBRETE_ENVIADO, CRIADA_EM) VALUES (:pac, :ubs, :esp, :dh, :status, :risco, :origem, :lemb, :criada)",
                new MapSqlParameterSource().addValue("pac", c.pacienteId()).addValue("ubs", c.ubsId())
                        .addValue("esp", c.especialidadeId()).addValue("dh", c.dataHora())
                        .addValue("status", c.status().name()).addValue("risco", c.riscoFalta())
                        .addValue("origem", c.origem().name()).addValue("lemb", bit(c.lembreteEnviado()))
                        .addValue("criada", c.criadaEm()));
    }

    public void atualizarStatus(long id, ConsultaStatus status) {
        jdbc.update("UPDATE ZL_CONSULTA SET STATUS = :status WHERE ID = :id",
                new MapSqlParameterSource("status", status.name()).addValue("id", id));
    }

    public List<Consulta> listarPorStatusEPeriodo(ConsultaStatus status, LocalDateTime inicio, LocalDateTime fim) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE STATUS = :st AND DATA_HORA >= :ini "
                        + "AND DATA_HORA < :fim ORDER BY DATA_HORA, ID",
                new MapSqlParameterSource("st", status.name()).addValue("ini", inicio).addValue("fim", fim), MAPPER);
    }

    /** Consultas no status dado que acontecem ate {@code limite} (inclusive). */
    public List<Consulta> listarPorStatusAte(ConsultaStatus status, LocalDateTime limite) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE STATUS = :st AND DATA_HORA <= :lim "
                        + "ORDER BY DATA_HORA, ID",
                new MapSqlParameterSource("st", status.name()).addValue("lim", limite), MAPPER);
    }

    public List<Consulta> listarEncaixes(long ubsId) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_CONSULTA WHERE UBS_ID = :ubs AND ORIGEM = 'ENCAIXE' "
                        + "AND STATUS <> 'CANCELADA'", new MapSqlParameterSource("ubs", ubsId), MAPPER);
    }

    /** Quantidade de consultas da UBS por status (para a taxa de comparecimento). */
    public Map<ConsultaStatus, Long> contarPorStatus(long ubsId) {
        Map<ConsultaStatus, Long> mapa = new EnumMap<>(ConsultaStatus.class);
        jdbc.query("SELECT STATUS, COUNT(*) AS QTD FROM ZL_CONSULTA WHERE UBS_ID = :ubs GROUP BY STATUS",
                new MapSqlParameterSource("ubs", ubsId),
                rs -> { mapa.put(ConsultaStatus.valueOf(rs.getString("STATUS")), rs.getLong("QTD")); });
        return mapa;
    }}
