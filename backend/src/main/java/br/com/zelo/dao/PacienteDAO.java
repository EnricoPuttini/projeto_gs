package br.com.zelo.dao;

import br.com.zelo.model.Paciente;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PacienteDAO extends BaseDAO {

    private static final String COLUNAS = "ID, NOME, DT_NASC, TELEFONE, LAT, LNG, HIPERTENSAO, DIABETES, DEFICIENCIA, "
            + "BOLSA_FAMILIA, GESTANTE, PCD, FALTAS_ANT";

    private static final RowMapper<Paciente> MAPPER = (rs, n) -> new Paciente(rs.getLong("ID"), rs.getString("NOME"),
            rs.getDate("DT_NASC").toLocalDate(), rs.getString("TELEFONE"), rs.getDouble("LAT"), rs.getDouble("LNG"),
            flag(rs, "HIPERTENSAO"), flag(rs, "DIABETES"), flag(rs, "DEFICIENCIA"), flag(rs, "BOLSA_FAMILIA"),
            flag(rs, "GESTANTE"), flag(rs, "PCD"), rs.getInt("FALTAS_ANT"));

    public PacienteDAO(NamedParameterJdbcTemplate jdbc) {
        super(jdbc);
    }

    public List<Paciente> listar() {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_PACIENTE ORDER BY NOME", MAPPER);
    }

    public Optional<Paciente> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUNAS + " FROM ZL_PACIENTE WHERE ID = :id",
                new MapSqlParameterSource("id", id), MAPPER).stream().findFirst();
    }

    public Long inserir(Paciente p) {
        return inserir("INSERT INTO ZL_PACIENTE (NOME, DT_NASC, TELEFONE, LAT, LNG, HIPERTENSAO, DIABETES, DEFICIENCIA, "
                + "BOLSA_FAMILIA, GESTANTE, PCD, FALTAS_ANT) VALUES (:nome, :dtNasc, :telefone, :lat, :lng, :hip, :dia, "
                + ":def, :bolsa, :gest, :pcd, :faltas)", params(p));
    }

    public boolean atualizar(Paciente p) {
        return jdbc.update("UPDATE ZL_PACIENTE SET NOME = :nome, DT_NASC = :dtNasc, TELEFONE = :telefone, LAT = :lat, "
                + "LNG = :lng, HIPERTENSAO = :hip, DIABETES = :dia, DEFICIENCIA = :def, BOLSA_FAMILIA = :bolsa, "
                + "GESTANTE = :gest, PCD = :pcd, FALTAS_ANT = :faltas WHERE ID = :id",
                params(p).addValue("id", p.id())) > 0;
    }

    public boolean remover(long id) {
        return jdbc.update("DELETE FROM ZL_PACIENTE WHERE ID = :id", new MapSqlParameterSource("id", id)) > 0;
    }

    private static MapSqlParameterSource params(Paciente p) {
        return new MapSqlParameterSource().addValue("nome", p.nome()).addValue("dtNasc", java.sql.Date.valueOf(p.dataNascimento()))
                .addValue("telefone", p.telefone()).addValue("lat", p.lat()).addValue("lng", p.lng())
                .addValue("hip", bit(p.hipertensao())).addValue("dia", bit(p.diabetes()))
                .addValue("def", bit(p.deficiencia())).addValue("bolsa", bit(p.bolsaFamilia()))
                .addValue("gest", bit(p.gestante())).addValue("pcd", bit(p.pcd())).addValue("faltas", p.faltasAnteriores());
    }
}
