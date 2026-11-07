package br.com.zelo.controller;

import br.com.zelo.bo.ReferenciaBO;
import br.com.zelo.model.Abrigo;
import br.com.zelo.model.AreaRisco;
import br.com.zelo.model.Especialidade;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Referência", description = "Dados de apoio somente leitura (vêm do seed).")
public class ReferenciaController {

    private final ReferenciaBO bo;

    public ReferenciaController(ReferenciaBO bo) {
        this.bo = bo;
    }

    @GetMapping("/especialidades")
    @Operation(summary = "Lista especialidades")
    public List<Especialidade> especialidades() {
        return bo.listarEspecialidades();
    }

    @GetMapping("/especialidades/{id}")
    public Especialidade especialidade(@PathVariable long id) {
        return bo.buscarEspecialidade(id);
    }

    @GetMapping("/abrigos")
    @Operation(summary = "Lista abrigos")
    public List<Abrigo> abrigos() {
        return bo.listarAbrigos();
    }

    @GetMapping("/abrigos/{id}")
    public Abrigo abrigo(@PathVariable long id) {
        return bo.buscarAbrigo(id);
    }

    @GetMapping("/areas-risco")
    @Operation(summary = "Lista áreas de risco de alagamento")
    public List<AreaRisco> areasRisco() {
        return bo.listarAreasRisco();
    }

    @GetMapping("/areas-risco/{id}")
    public AreaRisco areaRisco(@PathVariable long id) {
        return bo.buscarAreaRisco(id);
    }
}
