package br.com.zelo.controller;

import br.com.zelo.bo.EncaixeBO;
import br.com.zelo.bo.OfertaBO;
import br.com.zelo.dto.PainelDTOs.OfertaDetalhe;
import br.com.zelo.model.Consulta;
import br.com.zelo.model.OfertaStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ofertas")
@Tag(name = "Ofertas de vaga")
public class OfertaController {

    private final OfertaBO bo;
    private final EncaixeBO encaixe;

    public OfertaController(OfertaBO bo, EncaixeBO encaixe) {
        this.bo = bo;
        this.encaixe = encaixe;
    }

    @GetMapping(params = "ubsId")
    @Operation(summary = "Ofertas de uma UBS (painel)")
    public List<OfertaDetalhe> porUbs(@RequestParam long ubsId, @RequestParam(required = false) OfertaStatus status) {
        return bo.detalharPorUbs(ubsId, status);
    }

    @GetMapping(params = "pacienteId")
    @Operation(summary = "Ofertas de um paciente (app do cidadão)")
    public List<OfertaDetalhe> porPaciente(@RequestParam long pacienteId, @RequestParam(required = false) OfertaStatus status) {
        return bo.detalharPorPaciente(pacienteId, status);
    }

    @GetMapping("/{id}")
    public OfertaDetalhe buscar(@PathVariable long id) {
        return bo.detalhar(id);
    }

    @PostMapping("/{id}/aceitar")
    @Operation(summary = "Aceita a vaga: cria a consulta de encaixe, marca a fila como atendida e a vaga como preenchida")
    public Consulta aceitar(@PathVariable long id) {
        return encaixe.aceitar(id);
    }

    @PostMapping("/{id}/recusar")
    @Operation(summary = "Recusa a vaga: ela segue para o próximo da fila")
    public OfertaDetalhe recusar(@PathVariable long id) {
        encaixe.recusar(id);
        return bo.detalhar(id);
    }
}
