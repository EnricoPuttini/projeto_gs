package br.com.zelo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ConsultaRequest(
        @Schema(example = "1") @NotNull(message = "Informe o paciente.") Long pacienteId,
        @Schema(example = "1") @NotNull(message = "Informe a UBS.") Long ubsId,
        @Schema(example = "1") @NotNull(message = "Informe a especialidade.") Long especialidadeId,
        @Schema(example = "2026-11-12T09:00:00") @NotNull(message = "Informe a data e hora.") LocalDateTime dataHora) {
}
