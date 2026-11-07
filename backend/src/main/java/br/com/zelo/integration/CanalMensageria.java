package br.com.zelo.integration;

/**
 * Por onde o Zelo fala com o cidadao. O BO so conhece esta interface: trocar o app por WhatsApp
 * (Twilio) e escrever outra implementacao, sem tocar na regra de negocio.
 */
public interface CanalMensageria {

    void enviar(long pacienteId, String texto, String tipo);
}
