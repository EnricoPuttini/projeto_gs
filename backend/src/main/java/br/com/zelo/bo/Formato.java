package br.com.zelo.bo;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Formatacao de datas para mensagens ao cidadao, em linguagem simples. */
final class Formato {

    private static final DateTimeFormatter DATA_HORA =
            DateTimeFormatter.ofPattern("EEEE, dd/MM 'às' HH:mm", Locale.forLanguageTag("pt-BR"));

    private Formato() {
    }

    /** Ex.: "quinta-feira, 12/11 às 09:00". */
    static String dataHora(LocalDateTime dataHora) {
        return DATA_HORA.format(dataHora);
    }
}
