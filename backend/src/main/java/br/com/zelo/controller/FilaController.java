package br.com.zelo.controller;

import br.com.zelo.bo.FilaBO;
import br.com.zelo.dto.FilaRequest;
import br.com.zelo.model.FilaEspera;
import br.com.zelo.model.FilaStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fila")
@Tag(name = "Fila de espera")
public class FilaController {

    private final FilaBO bo;

    public FilaController(FilaBO bo) {
        this.bo = bo;
    }

    @GetMapping
    @Operation(summary = "Fila ativa de uma UBS")
    public List<FilaEspera> listar(@RequestParam long ubsId, @RequestParam(required = false) Long especialidadeId) {
        return bo.listarAtivas(ubsId, especialidadeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Entra na fila de espera")
    public FilaEspera entrar(@Valid @RequestBody FilaRequest r) {
        return bo.entrar(r);
    }

    @PostMapping("/{id}/sair")
    @Operation(summary = "Paciente desiste da fila")
    public FilaEspera sair(@PathVariable long id) {
        return bo.transicionar(id, FilaStatus.SAIU);
    }
}
