package br.com.zelo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Cabecalhos defensivos em toda resposta da API (sem Spring Security, que nao temos: nao ha login).
 * - nosniff: o navegador nao "adivinha" o tipo do conteudo;
 * - frame DENY: a API nunca e embutida em iframe (clickjacking);
 * - no-referrer: nao vaza a URL de origem;
 * - no-store em /api: dados de saude/localizacao (simulados) nao ficam em cache de navegador ou proxy.
 */
@Component
public class CabecalhosSegurancaFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
            throws ServletException, IOException {
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("X-Frame-Options", "DENY");
        resp.setHeader("Referrer-Policy", "no-referrer");
        if (req.getRequestURI().startsWith("/api/")) {
            resp.setHeader("Cache-Control", "no-store");
        }
        chain.doFilter(req, resp);
    }
}
