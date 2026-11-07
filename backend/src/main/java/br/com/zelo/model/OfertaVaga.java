package br.com.zelo.model;

import java.time.LocalDateTime;

public record OfertaVaga(Long id, Long vagaId, Long pacienteId, Long filaId, LocalDateTime enviadaEm,
                         LocalDateTime expiraEm, OfertaStatus status) {
}
