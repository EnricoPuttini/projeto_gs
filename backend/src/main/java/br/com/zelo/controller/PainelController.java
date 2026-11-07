package br.com.zelo.controller;

import br.com.zelo.bo.PainelBO;
import br.com.zelo.dto.PainelDTOs.PainelUbs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/painel")
@Tag(name = "Painel da UBS")
public class PainelController {

    private final PainelBO bo;

    public PainelController(PainelBO bo) {
        this.bo = bo;
    }

    @GetMapping("/ubs/{ubsId}")
    @Operation(summary = "Tudo que o painel mostra: agenda, fila, vagas, ofertas e indicadores de impacto")
    public PainelUbs painel(@PathVariable long ubsId) {
        return bo.montar(ubsId);
    }
}
