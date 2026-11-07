package br.com.zelo.controller;

import br.com.zelo.bo.ConsultaBO;
import br.com.zelo.dto.ConsultaRequest;
import br.com.zelo.model.Consulta;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/consultas")
@Tag(name = "Consultas")
public class ConsultaController {

    private final ConsultaBO bo;

    public ConsultaController(ConsultaBO bo) {
        this.bo = bo;
    }

    @GetMapping
    @Operation(summary = "Agenda de uma UBS (padrão: hoje)")
    public List<Consulta> agenda(@RequestParam long ubsId,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return bo.listarAgenda(ubsId, data);
    }

    @GetMapping("/{id}")
    public Consulta buscar(@PathVariable long id) {
        return bo.buscar(id);
    }

    @GetMapping("/paciente/{pacienteId}")
    @Operation(summary = "Consultas de um paciente")
    public List<Consulta> doPaciente(@PathVariable long pacienteId) {
        return bo.listarPorPaciente(pacienteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Agenda uma consulta")
    public Consulta agendar(@Valid @RequestBody ConsultaRequest r) {
        return bo.agendar(r);
    }

    @PostMapping("/{id}/confirmar")
    @Operation(summary = "Paciente confirma presença")
    public Consulta confirmar(@PathVariable long id) {
        return bo.confirmar(id);
    }

    @PostMapping("/{id}/cancelar")
    @Operation(summary = "Cancela a consulta e libera a vaga")
    public Consulta cancelar(@PathVariable long id) {
        return bo.cancelar(id);
    }

    @PostMapping("/{id}/realizada")
    @Operation(summary = "Registra que a consulta aconteceu")
    public Consulta realizada(@PathVariable long id) {
        return bo.registrarRealizada(id);
    }

    @PostMapping("/{id}/falta")
    @Operation(summary = "Registra falta do paciente")
    public Consulta falta(@PathVariable long id) {
        return bo.registrarFalta(id);
    }
}
