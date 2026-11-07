package br.com.zelo.model;

import java.time.LocalDateTime;

public record Mensagem(Long id, Long pacienteId, Direcao direcao, Canal canal, String texto, String tipo,
                       LocalDateTime criadaEm) {
}
