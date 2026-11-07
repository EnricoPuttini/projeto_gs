package br.com.zelo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Os nomes e telefones usados em exemplos sao FICTICIOS. */
public record PacienteRequest(
        @Schema(example = "Maria Aparecida") @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
        @Schema(example = "1962-03-14") @NotNull(message = "Informe a data de nascimento.") @Past(message = "A data de nascimento deve ser passada.") LocalDate dataNascimento,
        @Schema(example = "(11) 90000-0001") @NotBlank(message = "Informe o telefone.") @Size(max = 20) String telefone,
        @Schema(example = "-23.5645") @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
        @Schema(example = "-46.6445") @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
        boolean hipertensao, boolean diabetes, boolean deficiencia, boolean bolsaFamilia,
        boolean gestante, boolean pcd,
        @Schema(example = "0") @Min(0) @Max(99) int faltasAnteriores) {
}
