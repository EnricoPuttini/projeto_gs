package br.com.zelo.model;

import java.time.LocalDateTime;

/** {@code janela} = hora cheia da previsao; com o local e a area forma a chave unica (sem alerta repetido na mesma hora). */
public record Alerta(Long id, Long localId, Long areaId, Long abrigoId, double chuvaMm, Nivel nivel,
                     LocalDateTime criadoEm, LocalDateTime janela, LocalDateTime confirmadoSeguroEm) {

    public enum Nivel { ATENCAO, ALTO, CRITICO }
}
