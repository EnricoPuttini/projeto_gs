package br.com.zelo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * "Experimente o Zelo": conversa de teste SEM estado no servidor. O navegador guarda o contexto
 * (o que esta pendente para o visitante) e manda junto a cada mensagem; nada vai para o banco.
 */
public final class ExperimenteDTOs {

    private ExperimenteDTOs() {
    }

    /** O que esta esperando resposta do visitante na simulacao. */
    public enum Pendente { NENHUM, OFERTA, ALERTA }

    /** Efeito da mensagem, para o navegador atualizar a simulacao (mostrar consulta marcada, fechar alerta...). */
    public enum Efeito { NENHUM, ACEITOU_VAGA, RECUSOU_VAGA, SEGURO, PERIGO }

    public record Contexto(
            @NotNull Pendente pendente,
            @Schema(example = "Maria") @Size(max = 40) String nome,
            @Schema(example = "Clínica Geral") @Size(max = 60) String especialidade,
            @Schema(example = "UBS Jardim Exemplo") @Size(max = 120) String unidade,
            @Schema(example = "amanhã às 8h") @Size(max = 60) String quando,
            @Schema(example = "EMEF Exemplo, a 400 m") @Size(max = 160) String abrigo) {
    }

    public record Requisicao(
            @Schema(example = "quero a vaga") @NotBlank(message = "Escreva ou fale alguma coisa.") @Size(max = 300, message = "Mensagem muito longa.") String texto,
            @NotNull(message = "Informe o contexto da simulação.") @Valid Contexto contexto) {
    }

    public record Resposta(String resposta, List<AssistenteDTOs.Acao> acoes, Efeito efeito, Pendente pendente) {
    }

    public record Previsao(boolean disponivel, Double milimetrosProximas3h, String fonte) {
    }

    public record Lugar(String nome, double lat, double lng, long metros) {
    }

    /** Unidade de saude e escola publica mais perto (OpenStreetMap); campos nulos = nao encontrado. */
    public record Lugares(Lugar saude, Lugar escola, String fonte) {
    }
}
