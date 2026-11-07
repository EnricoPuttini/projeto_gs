package br.com.zelo.integration;

import br.com.zelo.bo.MensagemBO;
import br.com.zelo.model.Canal;
import br.com.zelo.model.Direcao;
import org.springframework.stereotype.Component;

/** Canal padrao: o chat do aplicativo. "Enviar" = gravar no historico, que o app le por polling. */
@Component
public class AppCanal implements CanalMensageria {

    private final MensagemBO mensagens;

    public AppCanal(MensagemBO mensagens) {
        this.mensagens = mensagens;
    }

    @Override
    public void enviar(long pacienteId, String texto, String tipo) {
        mensagens.registrar(pacienteId, Direcao.SAIDA, Canal.APP, texto, tipo);
    }
}
