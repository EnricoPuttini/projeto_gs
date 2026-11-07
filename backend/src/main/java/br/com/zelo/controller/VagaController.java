package br.com.zelo.controller;

import br.com.zelo.bo.VagaBO;
import br.com.zelo.model.Vaga;
import br.com.zelo.model.VagaStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vagas")
@Tag(name = "Vagas")
public class VagaController {

    private final VagaBO bo;

    public VagaController(VagaBO bo) {
        this.bo = bo;
    }

    @GetMapping
    @Operation(summary = "Vagas de uma UBS (filtre por status)")
    public List<Vaga> listar(@RequestParam long ubsId, @RequestParam(required = false) VagaStatus status) {
        return bo.listar(ubsId, status);
    }

    @GetMapping("/{id}")
    public Vaga buscar(@PathVariable long id) {
        return bo.buscar(id);
    }
}
