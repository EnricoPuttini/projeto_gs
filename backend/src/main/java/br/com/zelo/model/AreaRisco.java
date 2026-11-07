package br.com.zelo.model;

public record AreaRisco(Long id, String nome, double lat, double lng, int raioMetros, double limiarMmHora) {
}
