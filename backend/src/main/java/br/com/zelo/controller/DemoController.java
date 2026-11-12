package br.com.zelo.controller;

import br.com.zelo.bo.DemoBO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/** Rotas da demo. Sem ZELO_DEMO_MODE=true este controller nem e criado: as rotas respondem 404. */
@RestController
@RequestMapping("/api/v1/demo")
@Validated
@Tag(name = "Modo demo", description = "Só existe com ZELO_DEMO_MODE=true.")
@ConditionalOnProperty(name = "zelo.demo-mode", havingValue = "true")
public class DemoController {

    private final DemoBO bo;

    public DemoController(DemoBO bo) {
        this.bo = bo;
    }

    @PostMapping("/cancelar-consulta")
    @Operation(summary = "Paciente cancela a consulta de amanhã (libera a vaga e dispara o encaixe)")
    public br.com.zelo.model.OfertaVaga cancelarConsulta() {
        return bo.cancelarConsulta();
    }

    @PostMapping("/chuva")
    @Operation(summary = "Simula chuva forte numa área de risco e gera os alertas")
    public Map<String, Object> chuva(@RequestParam(defaultValue = "1") long areaId) {
        return Map.of("alertasCriados", bo.simularChuva(areaId));
    }

    @PostMapping("/avancar-relogio")
    @Operation(summary = "Avança o relógio do sistema e roda os jobs (expira ofertas, libera consultas sem resposta)")
    public Map<String, LocalDateTime> avancarRelogio(@RequestParam(defaultValue = "15") @Min(1) @Max(1440) int minutos) {
        return Map.of("agora", bo.avancarRelogio(minutos));
    }

    @PostMapping("/resetar")
    @Operation(summary = "Apaga tudo e recarrega o seed")
    public Map<String, String> resetar() {
        bo.resetar();
        return Map.of("status", "ok");
    }
}
