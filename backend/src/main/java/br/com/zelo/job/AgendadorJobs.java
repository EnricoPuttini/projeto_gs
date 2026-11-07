package br.com.zelo.job;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Agenda os jobs. Desligavel com zelo.jobs.enabled=false (testes de integracao). */
@Component
@EnableScheduling
@ConditionalOnProperty(name = "zelo.jobs.enabled", havingValue = "true", matchIfMissing = true)
public class AgendadorJobs {

    private final JobsProcessador jobs;

    public AgendadorJobs(JobsProcessador jobs) {
        this.jobs = jobs;
    }

    @Scheduled(fixedDelay = 15_000, initialDelay = 20_000)
    public void expirarOfertas() {
        jobs.expirarOfertas();
    }

    /** Todo dia as 18h: pede confirmacao das consultas de amanha. */
    @Scheduled(cron = "0 0 18 * * *", zone = "${zelo.timezone}")
    public void pedirConfirmacoes() {
        jobs.pedirConfirmacoes();
    }

    /** A previsao horaria muda devagar: consultar a cada 15 min basta e respeita a API gratuita. */
    @Scheduled(fixedDelay = 900_000, initialDelay = 60_000)
    public void processarAlertas() {
        jobs.processarAlertas();
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void liberarSemResposta() {
        jobs.liberarSemResposta();
    }
}
