package br.com.zelo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record FilaRequest(
        @Schema(example = "1") @NotNull(message = "Informe o paciente.") Long pacienteId,
        @Schema(example = "1") @NotNull(message = "Informe a UBS.") Long ubsId,
        @Schema(example = "1") @NotNull(message = "Informe a especialidade.") Long especialidadeId,
        @Schema(example = "2", description = "1 = baixa, 2 = média, 3 = alta") @Min(value = 1, message = "Gravidade mínima é 1.")
        @Max(value = 3, message = "Gravidade máxima é 3.") int gravidade) {
}
