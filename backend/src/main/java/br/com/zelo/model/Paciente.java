package br.com.zelo.model;

import java.time.LocalDate;
import java.time.Period;

public record Paciente(Long id, String nome, LocalDate dataNascimento, String telefone, double lat, double lng,
                       boolean hipertensao, boolean diabetes, boolean deficiencia, boolean bolsaFamilia,
                       boolean gestante, boolean pcd, int faltasAnteriores) {

    public int idade(LocalDate hoje) {
        return Period.between(dataNascimento, hoje).getYears();
    }

    /** Prioridade legal (Estatuto da Pessoa Idosa 60+, gestante, PcD): usada no desempate do encaixe. */
    public boolean prioridadeLegal(LocalDate hoje) {
        return idade(hoje) >= 60 || gestante || pcd;
    }
}
