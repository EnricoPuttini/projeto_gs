package br.com.zelo.controller;

import br.com.zelo.bo.AssistenteBO;
import br.com.zelo.bo.MensagemBO;
import br.com.zelo.dto.AssistenteDTOs.Requisicao;
import br.com.zelo.dto.AssistenteDTOs.Resposta;
import br.com.zelo.model.Mensagem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Assistente", description = "Conversa com o Zelo, por texto ou voz já transcrita.")
public class AssistenteController {

    private final AssistenteBO assistente;
    private final MensagemBO mensagens;

    public AssistenteController(AssistenteBO assistente, MensagemBO mensagens) {
        this.assistente = assistente;
        this.mensagens = mensagens;
    }

    @PostMapping("/assistente/mensagens")
    @Operation(summary = "Envia uma mensagem ao Zelo e recebe a resposta com botões de ação")
    public Resposta enviar(@Valid @RequestBody Requisicao req) {
        return assistente.responder(req);
    }

    @GetMapping("/pacientes/{pacienteId}/mensagens")
    @Operation(summary = "Histórico do chat (últimas 100 mensagens)")
    public List<Mensagem> historico(@PathVariable long pacienteId) {
        return mensagens.historico(pacienteId);
    }
}
