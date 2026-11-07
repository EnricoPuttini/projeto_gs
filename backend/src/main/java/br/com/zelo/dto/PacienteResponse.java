package br.com.zelo.dto;

import br.com.zelo.model.Paciente;

import java.time.LocalDate;

/** Paciente + campos derivados (idade e prioridade legal), calculados com o Clock injetado no BO. */
public record PacienteResponse(Long id, String nome, LocalDate dataNascimento, int idade, String telefone,
                               double lat, double lng, boolean hipertensao, boolean diabetes, boolean deficiencia,
                               boolean bolsaFamilia, boolean gestante, boolean pcd, int faltasAnteriores,
                               boolean prioridadeLegal) {

    public static PacienteResponse de(Paciente p, LocalDate hoje) {
        return new PacienteResponse(p.id(), p.nome(), p.dataNascimento(), p.idade(hoje), p.telefone(), p.lat(), p.lng(),
                p.hipertensao(), p.diabetes(), p.deficiencia(), p.bolsaFamilia(), p.gestante(), p.pcd(),
                p.faltasAnteriores(), p.prioridadeLegal(hoje));
    }
}
