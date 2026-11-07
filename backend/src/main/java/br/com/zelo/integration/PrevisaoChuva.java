package br.com.zelo.integration;

import br.com.zelo.model.AreaRisco;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fonte de previsao usada pelo AlertaBO. Normalmente delega a Open-Meteo; no modo demo, o botao
 * "Simular chuva forte" registra aqui um valor para a area, que tem prioridade sobre a previsao real.
 * Fora do modo demo o mapa nunca e preenchido (so o DemoController escreve nele).
 */
@Component
public class PrevisaoChuva {

    private final OpenMeteoClient openMeteo;
    private final Map<Long, Double> simulada = new ConcurrentHashMap<>();

    public PrevisaoChuva(OpenMeteoClient openMeteo) {
        this.openMeteo = openMeteo;
    }

    public Optional<Double> proximasHoras(AreaRisco area, int horas) {
        Double simuladaMm = simulada.get(area.id());
        if (simuladaMm != null) {
            return Optional.of(simuladaMm);
        }
        return openMeteo.milimetrosProximasHoras(area.lat(), area.lng(), horas);
    }

    public void simular(long areaId, double milimetros) {
        simulada.put(areaId, milimetros);
    }

    public void limparSimulacao() {
        simulada.clear();
    }
}
