package br.com.zelo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UbsRequest(
        @Schema(example = "UBS Exemplo Centro") @NotBlank(message = "Informe o nome da UBS.") @Size(max = 120) String nome,
        @Schema(example = "Rua Exemplo, 100 - Bairro Exemplo") @NotBlank(message = "Informe o endereço.") @Size(max = 200) String endereco,
        @Schema(example = "-23.56") @NotNull(message = "Informe a latitude.") @DecimalMin("-90") @DecimalMax("90") Double lat,
        @Schema(example = "-46.64") @NotNull(message = "Informe a longitude.") @DecimalMin("-180") @DecimalMax("180") Double lng) {
}
