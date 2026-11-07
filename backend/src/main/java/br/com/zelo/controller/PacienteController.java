package br.com.zelo.controller;

import br.com.zelo.bo.PacienteBO;
import br.com.zelo.dto.PacienteRequest;
import br.com.zelo.dto.PacienteResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pacientes")
@Tag(name = "Pacientes", description = "Todos os pacientes são fictícios.")
public class PacienteController {

    private final PacienteBO bo;

    public PacienteController(PacienteBO bo) {
        this.bo = bo;
    }

    @GetMapping
    @Operation(summary = "Lista pacientes")
    public List<PacienteResponse> listar() {
        return bo.listar();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um paciente")
    public PacienteResponse buscar(@PathVariable long id) {
        return bo.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra um paciente")
    public PacienteResponse criar(@Valid @RequestBody PacienteRequest r) {
        return bo.criar(r);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um paciente")
    public PacienteResponse atualizar(@PathVariable long id, @Valid @RequestBody PacienteRequest r) {
        return bo.atualizar(id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove um paciente sem vínculos")
    public void remover(@PathVariable long id) {
        bo.remover(id);
    }
}
