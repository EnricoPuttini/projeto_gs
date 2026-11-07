package br.com.zelo.model;

import java.time.LocalDateTime;

public record Vaga(Long id, Long consultaOrigemId, Long ubsId, Long especialidadeId, LocalDateTime dataHora,
                   VagaStatus status, LocalDateTime criadaEm) {
}
