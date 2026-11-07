package br.com.zelo.model;

import java.time.LocalDateTime;

public record Consulta(Long id, Long pacienteId, Long ubsId, Long especialidadeId, LocalDateTime dataHora,
                       ConsultaStatus status, Double riscoFalta, Origem origem, boolean lembreteEnviado,
                       LocalDateTime criadaEm) {

    public Consulta comStatus(ConsultaStatus novo) {
        return new Consulta(id, pacienteId, ubsId, especialidadeId, dataHora, novo, riscoFalta, origem,
                lembreteEnviado, criadaEm);
    }
}
