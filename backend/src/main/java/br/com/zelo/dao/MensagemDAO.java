package br.com.zelo.dao;

import br.com.zelo.model.Canal;
import br.com.zelo.model.Direcao;
import br.com.zelo.model.Mensagem;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MensagemDAO extends BaseDAO {

    private static final RowMapper<Mensagem> MAPPER = (rs, n) -> new Mensagem(rs.getLong("ID"), rs.getLong("PACIENTE_ID"),
            Direcao.valueOf(rs.getString("DIRECAO")), Canal.valueOf(rs.getString("CANAL")), rs.getString("TEXTO"),
            rs.getString("TIPO"), dataHora(rs, "CRIADA_EM"));

    public MensagemDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public Long inserir(Mensagem m) {
        return inserir("INSERT INTO ZL_MENSAGEM (PACIENTE_ID, DIRECAO, CANAL, TEXTO, TIPO, CRIADA_EM) "
                        + "VALUES (:pac, :dir, :canal, :texto, :tipo, :criada)",
                new MapSqlParameterSource().addValue("pac", m.pacienteId()).addValue("dir", m.direcao().name())
                        .addValue("canal", m.canal().name()).addValue("texto", m.texto()).addValue("tipo", m.tipo())
                        .addValue("criada", m.criadaEm()));
    }

    /** Ultimas {@code limite} mensagens, devolvidas em ordem cronologica. */
    public List<Mensagem> listarUltimas(long pacienteId, int limite) {
        List<Mensagem> recentes = jdbc.query("SELECT ID, PACIENTE_ID, DIRECAO, CANAL, TEXTO, TIPO, CRIADA_EM FROM ZL_MENSAGEM "
                        + "WHERE PACIENTE_ID = :pac ORDER BY CRIADA_EM DESC, ID DESC FETCH FIRST :lim ROWS ONLY",
                new MapSqlParameterSource("pac", pacienteId).addValue("lim", limite), MAPPER);
        return recentes.reversed();
    }
}
