package br.com.zelo.dao;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guarda contra um erro que so apareceria com Oracle de verdade (ORA-12899): todo valor listado num
 * CHECK (... IN ('A','B')) precisa caber na coluna VARCHAR2(n) correspondente. Le o mesmo DDL de producao.
 */
class DdlConsistenciaTest {

    private static final Pattern COLUNA = Pattern.compile("^\\s*(\\w+)\\s+VARCHAR2\\((\\d+)\\)", Pattern.MULTILINE);
    private static final Pattern CHECK_IN = Pattern.compile("\\b(\\w+)\\s+IN\\s*\\(\\s*('[^)]*')\\s*\\)");

    @Test
    void todoValorDeCheckCabeNaColuna() throws Exception {
        String ddl = Files.readString(Path.of("../database/01_ddl.sql"));
        int verificados = 0;

        for (String tabela : ddl.split("(?i)CREATE TABLE ")) {
            Map<String, Integer> tamanhos = new HashMap<>();
            Matcher c = COLUNA.matcher(tabela);
            while (c.find()) {
                tamanhos.put(c.group(1).toUpperCase(), Integer.parseInt(c.group(2)));
            }
            Matcher k = CHECK_IN.matcher(tabela);
            while (k.find()) {
                Integer limite = tamanhos.get(k.group(1).toUpperCase());
                if (limite == null) {
                    continue; // IN sobre coluna numerica (flags 0/1)
                }
                for (String valor : k.group(2).split(",")) {
                    String semAspas = valor.trim().replace("'", "");
                    assertThat(semAspas.length())
                            .as("valor '%s' em %s (VARCHAR2(%d))", semAspas, k.group(1), limite)
                            .isLessThanOrEqualTo(limite);
                    verificados++;
                }
            }
        }
        assertThat(verificados).as("o teste precisa realmente ter checado valores").isGreaterThan(25);
    }
}
