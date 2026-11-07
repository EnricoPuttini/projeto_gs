package br.com.zelo.model;

import java.time.LocalDateTime;

public record FilaEspera(Long id, Long pacienteId, Long ubsId, Long especialidadeId, LocalDateTime dataEntrada,
                         int gravidade, FilaStatus status) {
}
