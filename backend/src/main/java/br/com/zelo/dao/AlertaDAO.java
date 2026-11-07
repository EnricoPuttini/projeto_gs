package br.com.zelo.dao;

import br.com.zelo.model.Alerta;
import br.com.zelo.model.Alerta.Nivel;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AlertaDAO extends BaseDAO {

    private static final String COLUNAS = "a.ID, a.LOCAL_ID, a.AREA_ID, a.ABRIGO_ID, a.CHUVA_MM, a.NIVEL, a.CRIADO_EM, "
            + "a.JANELA, a.CONFIRMADO_SEGURO_EM";

    private static final RowMapper<Alerta> MAPPER = (rs, n) -> {
        long abrigo = rs.getLong("ABRIGO_ID");
        Long abrigoId = rs.wasNull() ? null : abrigo;
        return new Alerta(rs.getLong("ID"), rs.getLong("LOCAL_ID"), rs.getLong("AREA_ID"), abrigoId,
                rs.getDouble("CHUVA_MM"), Nivel.valueOf(rs.getString("NIVEL")), dataHora(rs, "CRIADO_EM"),
                dataHora(rs, "JANELA"), dataHora(rs, "CONFIRMADO_SEGURO_EM"));
    };

    public AlertaDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public boolean existe(long localId, long areaId, LocalDateTime janela) {
        Long qtd = jdbc.queryForObject("SELECT COUNT(*) FROM ZL_ALERTA WHERE LOCAL_ID = :l AND AREA_ID = :a AND JANELA = :j",
                new MapSqlParameterSource("l", localId).addValue("a", areaId).addValue("j", janela), Long.class);
        return qtd != null && qtd > 0;
    }

    public Long inserir(Alerta a) {
        return inserir("INSERT INTO ZL_ALERTA (LOCAL_ID, AREA_ID, ABRIGO_ID, CHUVA_MM, NIVEL, CRIADO_EM, JANELA) "
                        + "VALUES (:l, :a, :abrigo, :mm, :nivel, :criado, :janela)",
                new MapSqlParameterSource().addValue("l", a.localId()).addValue("a", a.areaId())
                        .addValue("abrigo", a.abrigoId()).addValue("mm", a.chuvaMm()).addValue("nivel", a.nivel().name())
                        .addValue("criado", a.criadoEm()).addValue("janela", a.janela()));
    }

    public Optional<Alerta> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_ALERTA a WHERE a.ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    /** Alertas dos locais de um paciente criados desde {@code desde}; {@code soAbertos} esconde os ja confirmados como seguros. */
    public List<Alerta> listarPorPaciente(long pacienteId, LocalDateTime desde, boolean soAbertos) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_ALERTA a JOIN ZL_LOCAL_SALVO l ON l.ID = a.LOCAL_ID "
                        + "WHERE l.PACIENTE_ID = :p AND a.CRIADO_EM >= :desde"
                        + (soAbertos ? " AND a.CONFIRMADO_SEGURO_EM IS NULL" : "") + " ORDER BY a.CRIADO_EM DESC, a.ID DESC",
                new MapSqlParameterSource("p", pacienteId).addValue("desde", desde), MAPPER);
    }

    public void marcarSeguro(long id, LocalDateTime quando) {
        jdbc.update("UPDATE ZL_ALERTA SET CONFIRMADO_SEGURO_EM = :q WHERE ID = :id AND CONFIRMADO_SEGURO_EM IS NULL",
                new MapSqlParameterSource("q", quando).addValue("id", id));
    }

    /** Moradores (pessoas, nao alertas) que receberam ao menos um aviso. */
    public long contarMoradoresAlertados() {
        Long qtd = jdbc.queryForObject("SELECT COUNT(DISTINCT l.PACIENTE_ID) FROM ZL_ALERTA a "
                + "JOIN ZL_LOCAL_SALVO l ON l.ID = a.LOCAL_ID", new MapSqlParameterSource(), Long.class);
        return qtd == null ? 0 : qtd;
    }
}
