package br.com.zelo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;
import java.util.List;

/** Configuracao do Zelo vinda de variaveis de ambiente (ver application.yml). */
@ConfigurationProperties(prefix = "zelo")
public record ZeloProperties(List<String> corsOrigins, boolean demoMode, ZoneId timezone) {
}
