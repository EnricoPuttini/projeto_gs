package br.com.zelo.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PacienteTest {

    private static final LocalDate HOJE = LocalDate.of(2026, 11, 10);

    private static Paciente com(LocalDate nasc, boolean gestante, boolean pcd) {
        return new Paciente(1L, "Fulana Ficticia", nasc, "(11) 90000-0000", 0, 0, false, false, false, false, gestante, pcd, 0);
    }

    @Test
    void idadeConsideraAniversarioQueAindaNaoAconteceu() {
        assertThat(com(LocalDate.of(1966, 11, 11), false, false).idade(HOJE)).isEqualTo(59);
        assertThat(com(LocalDate.of(1966, 11, 10), false, false).idade(HOJE)).isEqualTo(60);
    }

    @Test
    void prioridadeLegalParaIdosoGestanteEPcd() {
        assertThat(com(LocalDate.of(1966, 11, 10), false, false).prioridadeLegal(HOJE)).isTrue();
        assertThat(com(LocalDate.of(1990, 1, 1), true, false).prioridadeLegal(HOJE)).isTrue();
        assertThat(com(LocalDate.of(1990, 1, 1), false, true).prioridadeLegal(HOJE)).isTrue();
        assertThat(com(LocalDate.of(1990, 1, 1), false, false).prioridadeLegal(HOJE)).isFalse();
    }
}
