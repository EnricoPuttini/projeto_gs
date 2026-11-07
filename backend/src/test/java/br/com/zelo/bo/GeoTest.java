package br.com.zelo.bo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeoTest {

    @Test
    void distanciaDeUmPontoParaSiMesmoEZero() {
        assertThat(Geo.distanciaKm(-23.56, -46.64, -23.56, -46.64)).isZero();
    }

    @Test
    void umGrauDeLatitudeTemAproximadamente111Km() {
        assertThat(Geo.distanciaKm(-23.0, -46.0, -24.0, -46.0)).isBetween(110.5, 111.8);
    }

    @Test
    void sampaRioFicamACercaDe360Km() {
        // Praca da Se (SP) ate Cristo Redentor (RJ): referencia publica ~ 358 km em linha reta
        assertThat(Geo.distanciaKm(-23.5505, -46.6333, -22.9519, -43.2105)).isBetween(350.0, 366.0);
    }

    @Test
    void ESimetrica() {
        assertThat(Geo.distanciaKm(-23.5, -46.6, -23.6, -46.7)).isEqualTo(Geo.distanciaKm(-23.6, -46.7, -23.5, -46.6));
    }
}
