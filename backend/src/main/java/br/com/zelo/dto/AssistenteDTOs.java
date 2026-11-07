package br.com.zelo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AssistenteDTOs {

    private AssistenteDTOs() {
    }

    public record Requisicao(
            @Schema(example = "1") @NotNull(message = "Informe o paciente.") Long pacienteId,
            @Schema(example = "quero a vaga", description = "Texto digitado ou já transcrito da voz.")
            @NotBlank(message = "Escreva ou fale alguma coisa.") @Size(max = 500, message = "Mensagem muito longa.") String texto) {
    }

    /** Botao de resposta rapida: ao tocar, o app envia {@code texto} como se a pessoa tivesse falado. */
    public record Acao(String rotulo, String texto) {
    }

    public record Resposta(String resposta, List<Acao> acoes) {
    }
}
