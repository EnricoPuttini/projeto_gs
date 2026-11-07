package br.com.zelo.dao;

import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class VagaDAO extends BaseDAO {

    private static final String COLUNAS = "ID, CONSULTA_ORIGEM_ID, UBS_ID, ESPEC_ID, DATA_HORA, STATUS, CRIADA_EM";

    private static final RowMapper<Vaga> MAPPER = (rs, n) -> new Vaga(rs.getLong("ID"), rs.getLong("CONSULTA_ORIGEM_ID"),
            rs.getLong("UBS_ID"), rs.getLong("ESPEC_ID"), dataHora(rs, "DATA_HORA"),
            VagaStatus.valueOf(rs.getString("STATUS")), dataHora(rs, "CRIADA_EM"));

    public VagaDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    /** Vagas de uma UBS; status nulo = todas. Mais recentes primeiro. */
    public List<Vaga> listarPorUbs(long ubsId, VagaStatus status) {
        MapSqlParameterSource p = new MapSqlParameterSource("ubs", ubsId);
        String filtro = "";
        if (status != null) {
            filtro = " AND STATUS = :st";
            p.addValue("st", status.name());
        }
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_VAGA WHERE UBS_ID = :ubs" + filtro
                + " ORDER BY CRIADA_EM DESC, ID DESC", p, MAPPER);
    }

    public Optional<Vaga> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_VAGA WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    /**
     * Trava a linha da vaga ate o fim da transacao. E o ponto de serializacao do motor de encaixe:
     * quem chegar depois espera o commit e enxerga o estado ja atualizado, entao nao cria 2a oferta PENDENTE.
     */
    public Optional<Vaga> buscarPorIdParaAtualizar(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_VAGA WHERE ID = :id FOR UPDATE",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Long inserir(Vaga v) {
        return inserir("INSERT INTO ZL_VAGA (CONSULTA_ORIGEM_ID, UBS_ID, ESPEC_ID, DATA_HORA, STATUS, CRIADA_EM) "
                        + "VALUES (:cons, :ubs, :esp, :dh, :status, :criada)",
                new MapSqlParameterSource().addValue("cons", v.consultaOrigemId()).addValue("ubs", v.ubsId())
                        .addValue("esp", v.especialidadeId()).addValue("dh", v.dataHora())
                        .addValue("status", v.status().name()).addValue("criada", v.criadaEm()));
    }

    public void atualizarStatus(long id, VagaStatus status) {
        jdbc.update("UPDATE ZL_VAGA SET STATUS = :status WHERE ID = :id",
                new MapSqlParameterSource("status", status.name()).addValue("id", id));
    }

    public Map<VagaStatus, Long> contarPorStatus(long ubsId) {
        Map<VagaStatus, Long> mapa = new EnumMap<>(VagaStatus.class);
        jdbc.query("SELECT STATUS, COUNT(*) AS QTD FROM ZL_VAGA WHERE UBS_ID = :ubs GROUP BY STATUS",
                new MapSqlParameterSource("ubs", ubsId),
                rs -> { mapa.put(VagaStatus.valueOf(rs.getString("STATUS")), rs.getLong("QTD")); });
        return mapa;
    }}
