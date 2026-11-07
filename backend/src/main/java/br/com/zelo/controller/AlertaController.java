package br.com.zelo.controller;

import br.com.zelo.bo.AlertaBO;
import br.com.zelo.bo.LocalSalvoBO;
import br.com.zelo.dto.AlertaDTOs.AlertaDetalhe;
import br.com.zelo.dto.AlertaDTOs.LocalRequest;
import br.com.zelo.model.Alerta;
import br.com.zelo.model.LocalSalvo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Alertas de enchente e Meus locais")
public class AlertaController {

    private final AlertaBO alertas;
    private final LocalSalvoBO locais;

    public AlertaController(AlertaBO alertas, LocalSalvoBO locais) {
        this.alertas = alertas;
        this.locais = locais;
    }

    @GetMapping("/pacientes/{pacienteId}/locais")
    @Operation(summary = "Locais salvos do paciente")
    public List<LocalSalvo> listarLocais(@PathVariable long pacienteId) {
        return locais.listar(pacienteId);
    }

    @PostMapping("/pacientes/{pacienteId}/locais")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra um local e a intensidade do aviso")
    public LocalSalvo criarLocal(@PathVariable long pacienteId, @Valid @RequestBody LocalRequest r) {
        return locais.criar(pacienteId, r);
    }

    @PutMapping("/locais/{id}")
    @Operation(summary = "Atualiza um local (nome, posição, intensidade, aviso ligado/desligado)")
    public LocalSalvo atualizarLocal(@PathVariable long id, @Valid @RequestBody LocalRequest r) {
        return locais.atualizar(id, r);
    }

    @GetMapping("/pacientes/{pacienteId}/alertas")
    @Operation(summary = "Alertas do paciente (ativos = ainda não confirmados como seguro, das últimas 6 h)")
    public List<AlertaDetalhe> alertasDoPaciente(@PathVariable long pacienteId,
                                                 @RequestParam(defaultValue = "true") boolean ativos) {
        return alertas.listarDoPaciente(pacienteId, ativos);
    }

    @PostMapping("/alertas/{id}/seguro")
    @Operation(summary = "\"Estou seguro\": encerra o alerta")
    public Alerta seguro(@PathVariable long id) {
        return alertas.confirmarSeguro(id);
    }
}
