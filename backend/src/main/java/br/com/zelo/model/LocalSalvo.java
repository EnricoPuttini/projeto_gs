package br.com.zelo.model;

/** Lugar que a pessoa quer proteger (casa, trabalho...) e o quao forte o aviso deve ser. */
public record LocalSalvo(Long id, Long pacienteId, String apelido, double lat, double lng, TipoLocal tipo,
                         IntensidadeAlerta intensidade, boolean ativo) {

    public enum TipoLocal { CASA, TRABALHO, FAMILIA, OUTRO }

    public enum IntensidadeAlerta { SILENCIOSO, VIBRAR, ALARME }
}
