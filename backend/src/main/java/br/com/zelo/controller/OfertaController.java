package br.com.zelo.controller;

import br.com.zelo.bo.OfertaBO;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.OfertaVaga;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ofertas")
@Tag(name = "Ofertas de vaga")
public class OfertaController {

    private final OfertaBO bo;

    public OfertaController(OfertaBO bo) {
        this.bo = bo;
    }

    @GetMapping(params = "ubsId")
    @Operation(summary = "Ofertas de uma UBS (painel)")
    public List<OfertaVaga> porUbs(@RequestParam long ubsId, @RequestParam(required = false) OfertaStatus status) {
        return bo.listarPorUbs(ubsId, status);
    }

    @GetMapping(params = "pacienteId")
    @Operation(summary = "Ofertas de um paciente (app do cidadão)")
    public List<OfertaVaga> porPaciente(@RequestParam long pacienteId, @RequestParam(required = false) OfertaStatus status) {
        return bo.listarPorPaciente(pacienteId, status);
    }

    @GetMapping("/{id}")
    public OfertaVaga buscar(@PathVariable long id) {
        return bo.buscar(id);
    }
}
