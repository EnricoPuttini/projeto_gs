package br.com.zelo.dto;

import br.com.zelo.model.ConsultaStatus;
import br.com.zelo.model.OfertaStatus;
import br.com.zelo.model.Origem;
import br.com.zelo.model.Ubs;
import br.com.zelo.model.VagaStatus;

import java.time.LocalDateTime;
import java.util.List;

/** Visoes ja "juntadas" (nomes em vez de ids) para o painel da UBS e o app do cidadao. */
public final class PainelDTOs {

    private PainelDTOs() {
    }

    public record ConsultaDetalhe(Long id, Long pacienteId, String pacienteNome, String especialidade,
                                  LocalDateTime dataHora, ConsultaStatus status, Double riscoFalta,
                                  boolean riscoAlto, Origem origem) {
    }

    public record FilaDetalhe(Long id, Long pacienteId, String pacienteNome, String especialidade, int gravidade,
                              long diasEspera, boolean prioridadeLegal, int posicao) {
    }

    public record VagaDetalhe(Long id, String especialidade, LocalDateTime dataHora, VagaStatus status) {
    }

    public record OfertaDetalhe(Long id, Long vagaId, Long pacienteId, String pacienteNome, String ubsNome,
                                String especialidade, LocalDateTime dataHoraVaga, LocalDateTime enviadaEm,
                                LocalDateTime expiraEm, OfertaStatus status, long segundosRestantes) {
    }

    public record Impacto(long vagasRecuperadas, long diasEsperaEconomizados, Double taxaComparecimento,
                          long consultasRealizadas, long faltas) {
    }

    public record PainelUbs(Ubs ubs, LocalDateTime agora, List<ConsultaDetalhe> agenda, List<FilaDetalhe> fila,
                            List<VagaDetalhe> vagas, List<OfertaDetalhe> ofertas, Impacto impacto) {
    }
}
