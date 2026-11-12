package br.com.zelo.bo;

import br.com.zelo.model.Intencao;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Interpreta o texto (ou a transcricao da voz) por regras e palavras-chave em pt-BR. Sem LLM: e
 * deterministico e explicavel. Ignora caixa, acentos e pontuacao ("Não posso!!" == "nao posso").
 *
 * <p>Ordem de decisao (a primeira regra que casa vence): INSEGURO → SEGURO → CANCELAR → NEGATIVA →
 * AFIRMATIVA → CONSULTA → SAUDACAO → AJUDA. Seguranca vem primeiro: numa enchente, "nao estou seguro"
 * nunca pode ser lido como um simples "nao". "Nao" vem antes de "sim" porque "nao, pode ser outra pessoa" nega, e a
 * palavra "pode" sozinha seria lida como aceite.
 */
@Component
public class InterpretadorMensagem {

    private static final List<String> RAIZES_CANCELAR = List.of("cancel", "desmarc");
    private static final Set<String> NEGACAO = Set.of("nao", "nunca", "jamais", "recuso", "negativo", "dispenso");
    private static final Set<String> AFIRMACAO = Set.of("sim", "quero", "aceito", "aceitar", "confirmo", "confirmar",
            "claro", "ok", "okay", "topo", "bora", "beleza", "combinado", "uhum");
    /** Aceite "fraco": so vale em resposta curta ("isso!", "pode marcar"), nunca no meio de uma frase ("isso e um teste"). */
    private static final Set<String> AFIRMACAO_CURTA = Set.of("isso", "pode", "vou", "certo");
    private static final int PALAVRAS_RESPOSTA_CURTA = 3;
    /** Pessoa em duvida (muito comum ao telefone): nunca pode virar "sim" ou "nao" por acaso. Comparado na frase normalizada. */
    private static final List<String> DUVIDA = List.of("nao entendi", "nao entendo", "nao sei", "nao ouvi", "como assim", "o que",
            "que e isso", "quem e", "quem fala", "quem ta falando", "quem esta falando", "repet", "de novo", "fala mais", "hein", "qual");
    private static final Set<String> SEGURANCA = Set.of("seguro", "segura", "salvo", "salva");
    private static final Set<String> PERIGO = Set.of("perigo", "alagando", "alagou", "enchente", "inundando", "inundou");
    private static final Set<String> CONSULTA = Set.of("consulta", "consultas", "agenda", "horario", "quando", "medico");
    private static final Set<String> SAUDACAO = Set.of("oi", "ola", "bom", "boa", "opa", "eae");
    private static final Set<String> AJUDA = Set.of("ajuda", "socorro", "como", "funciona", "menu");

    public Intencao interpretar(String texto) {
        List<String> palavras = palavras(texto);
        if (palavras.isEmpty()) {
            return Intencao.DESCONHECIDA;
        }
        boolean nega = palavras.stream().anyMatch(NEGACAO::contains);
        boolean dizSeguro = palavras.stream().anyMatch(SEGURANCA::contains);
        if (palavras.stream().anyMatch(PERIGO::contains) || (dizSeguro && nega)) {
            return Intencao.INSEGURO;
        }
        if (dizSeguro) {
            return Intencao.SEGURO;
        }
        if (palavras.stream().anyMatch(p -> RAIZES_CANCELAR.stream().anyMatch(p::startsWith))) {
            return Intencao.CANCELAR;
        }
        String frase = " " + String.join(" ", palavras) + " ";
        boolean afirma = palavras.stream().anyMatch(AFIRMACAO::contains)
                || frase.contains(" ta bom ") || frase.contains(" esta bom ")
                || (palavras.size() <= PALAVRAS_RESPOSTA_CURTA && palavras.stream().anyMatch(AFIRMACAO_CURTA::contains));
        // "sim ou nao?" e eco da propria pergunta (o microfone ouviu o Zelo): e duvida, nao resposta
        if ((afirma && nega && palavras.contains("ou")) || DUVIDA.stream().anyMatch(d -> frase.contains(" " + d))) {
            return Intencao.DUVIDA;
        }
        if (nega) {
            return Intencao.NEGATIVA;
        }
        if (afirma) {
            return Intencao.AFIRMATIVA;
        }
        if (palavras.stream().anyMatch(CONSULTA::contains)) {
            return Intencao.CONSULTA;
        }
        if (palavras.stream().anyMatch(SAUDACAO::contains)) {
            return Intencao.SAUDACAO;
        }
        if (palavras.stream().anyMatch(AJUDA::contains)) {
            return Intencao.AJUDA;
        }
        return Intencao.DESCONHECIDA;
    }

    /** Minusculas, sem acento, so letras e numeros, separadas por espaco. */
    static List<String> palavras(String texto) {
        if (texto == null) {
            return List.of();
        }
        String limpo = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .trim();
        return limpo.isEmpty() ? List.of() : Arrays.asList(limpo.split("\\s+"));
    }
}
