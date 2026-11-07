package br.com.zelo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.ZoneId;
import java.util.List;

/** Configuracao do Zelo vinda de variaveis de ambiente (ver application.yml). */
@ConfigurationProperties(prefix = "zelo")
public record ZeloProperties(List<String> corsOrigins, boolean demoMode, ZoneId timezone,
                             @DefaultValue Encaixe encaixe, @DefaultValue Confirmacao confirmacao,
                             @DefaultValue Impacto impacto) {

    /** Quanto tempo a pessoa tem para responder a uma oferta de vaga. */
    public record Encaixe(@DefaultValue("15") int ofertaMinutos) {
    }

    /** Sem resposta ate X horas antes da consulta, a consulta vira NAO_RESPONDIDA e a vaga e liberada. */
    public record Confirmacao(@DefaultValue("4") int horasLimiteSemResposta) {
    }

    /** Espera tipica ate uma vaga regular; base do calculo de "dias de espera economizados". */
    public record Impacto(@DefaultValue("45") int esperaRegularDias) {
    }
}
