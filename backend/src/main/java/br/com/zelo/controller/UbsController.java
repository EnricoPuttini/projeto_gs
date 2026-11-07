package br.com.zelo.controller;

import br.com.zelo.bo.UbsBO;
import br.com.zelo.dto.UbsRequest;
import br.com.zelo.model.Ubs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ubs")
@Tag(name = "UBS")
public class UbsController {

    private final UbsBO bo;

    public UbsController(UbsBO bo) {
        this.bo = bo;
    }

    @GetMapping
    @Operation(summary = "Lista as UBS")
    public List<Ubs> listar() {
        return bo.listar();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca uma UBS")
    public Ubs buscar(@PathVariable long id) {
        return bo.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra uma UBS")
    public Ubs criar(@Valid @RequestBody UbsRequest r) {
        return bo.criar(r);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma UBS")
    public Ubs atualizar(@PathVariable long id, @Valid @RequestBody UbsRequest r) {
        return bo.atualizar(id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove uma UBS sem vínculos")
    public void remover(@PathVariable long id) {
        bo.remover(id);
    }
}
