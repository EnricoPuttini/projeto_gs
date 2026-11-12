package br.com.zelo.controller;

import br.com.zelo.bo.ExperimenteBO;
import br.com.zelo.dto.ExperimenteDTOs.Lugares;
import br.com.zelo.dto.ExperimenteDTOs.Previsao;
import br.com.zelo.dto.ExperimenteDTOs.Requisicao;
import br.com.zelo.dto.ExperimenteDTOs.Resposta;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** Modo de teste para visitantes: sem estado e sem banco (sempre ligado, diferente da /demo). */
@RestController
@RequestMapping("/api/v1/experimente")
@Validated
@Tag(name = "Experimente", description = "Teste do Zelo pelo visitante: nada é gravado.")
public class ExperimenteController {

    private final ExperimenteBO bo;

    public ExperimenteController(ExperimenteBO bo) {
        this.bo = bo;
    }

    @PostMapping("/conversa")
    @Operation(summary = "Conversa de teste com o assistente (contexto vem do navegador; nada é gravado)")
    public Resposta conversa(@Valid @RequestBody Requisicao req) {
        return bo.responder(req.texto(), req.contexto());
    }

    @GetMapping("/previsao")
    @Operation(summary = "Chuva prevista nas próximas 3 h para um ponto (Open-Meteo, com cache e fallback)")
    public Previsao previsao(@RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
                             @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng) {
        return bo.previsao(lat, lng);
    }

    @GetMapping("/lugares")
    @Operation(summary = "UBS e escola pública reais mais perto de um ponto (OpenStreetMap, com cache)")
    public Lugares lugares(@RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
                           @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng) {
        return bo.lugares(lat, lng);
    }
}
