package br.com.zelo.dto;

import br.com.zelo.model.Alerta.Nivel;
import br.com.zelo.model.LocalSalvo.IntensidadeAlerta;
import br.com.zelo.model.LocalSalvo.TipoLocal;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class AlertaDTOs {

    private AlertaDTOs() {
    }

    public record LocalRequest(
            @Schema(example = "Casa") @NotBlank(message = "Dê um nome ao local, como \"Casa\".") @Size(max = 60) String apelido,
            @Schema(example = "-23.5645") @NotNull(message = "Informe a latitude.") @DecimalMin("-90") @DecimalMax("90") Double lat,
            @Schema(example = "-46.6445") @NotNull(message = "Informe a longitude.") @DecimalMin("-180") @DecimalMax("180") Double lng,
            @Schema(example = "CASA") @NotNull(message = "Escolha o tipo do local.") TipoLocal tipo,
            @Schema(example = "ALARME") @NotNull(message = "Escolha como quer ser avisado.") IntensidadeAlerta intensidade,
            @Schema(example = "true") boolean ativo) {
    }

    public record AlertaDetalhe(Long id, Long localId, String localApelido, IntensidadeAlerta intensidade,
                                String areaNome, double chuvaMm, Nivel nivel, LocalDateTime criadoEm,
                                LocalDateTime confirmadoSeguroEm, String abrigoNome, String abrigoEndereco,
                                Long abrigoDistanciaMetros, String rotaUrl, String mensagem) {
    }
}
