# Decisões

1. **Sem JPA.** O professor quer ver o DAO; usamos `NamedParameterJdbcTemplate` e SQL explícito.
2. **Datas em `LocalDateTime`/`TIMESTAMP` no fuso America/Sao_Paulo**, sempre derivadas do `Clock` injetado (testes fixam o tempo; a demo poderá avançar o relógio).
3. **IDENTITY `BY DEFAULT`** (não `ALWAYS`) para o seed fixar IDs; o seed realinha o contador com `START WITH LIMIT VALUE`.
4. **Filtros opcionais montados no SQL**, não `:p IS NULL OR ...`, para evitar bind de NULL sem tipo no Oracle.
5. **Vaga só nasce de consulta CANCELADA/NAO_RESPONDIDA** (`UQ_VAGA_CONS`). Por isso NAO_RESPONDIDA não pode virar CANCELADA depois.
6. **Concorrência no encaixe (M2):** `SELECT ... FOR UPDATE` na vaga + índice único funcional `UQ_OFE_PEND` (no máximo 1 oferta PENDENTE por vaga).
7. **Sem login:** dados simulados; o app escolhe o `pacienteId`.
8. **Ordenação do encaixe (aplicada no M2):** prioridade legal (idoso 60+, gestante, PcD) → gravidade (3 > 1) → mais dias de espera → menor distância casa–UBS (Haversine) → menor risco de falta. Desempate final por ID da fila, para ser determinístico.
9. **Aceite de oferta vencida (`noRollbackFor`).** Se a pessoa aceita depois do prazo, o BO grava a expiração e já oferece ao próximo, e só então devolve o erro; sem `noRollbackFor` o erro desfaria a expiração.
10. **Ordem de lock: sempre vaga → oferta.** Aceite, recusa, expiração e novo encaixe travam a linha da vaga primeiro, o que evita deadlock e serializa a decisão. Provado em `EncaixeConcorrenciaIT` (10 threads → 1 oferta PENDENTE; 2 aceites → 1 consulta).
11. **Quem cancelou não recebe a própria vaga**, e ninguém recebe a mesma vaga duas vezes (`pacientesJaOfertados`).
12. **Confirmação sem resposta:** a consulta AGUARDANDO_CONFIRMACAO vira NAO_RESPONDIDA quando faltam menos de `zelo.confirmacao.horas-limite-sem-resposta` (padrão 4 h) e a vaga é liberada. Cada consulta é processada na sua transação.
13. **Indicadores de impacto.**
    - *Vagas recuperadas* = vagas PREENCHIDA.
    - *Dias economizados* = por encaixe, `max(0, espera regular típica − dias até a consulta encaixada)`; a espera típica é configurável (`zelo.impacto.espera-regular-dias`, padrão 45) e é uma **premissa**, a validar com a UBS.
    - *Taxa de comparecimento* = REALIZADA / (REALIZADA + FALTA); sem consultas encerradas devolve nulo e o painel mostra "—".
14. **Jobs** (`@Scheduled`) só delegam a `JobsProcessador`, que o modo demo também chamará; desligáveis com `zelo.jobs.enabled=false`.
15. **Assistente por regras:** ordem CANCELAR → NEGATIVA → AFIRMATIVA → CONSULTA → SAUDAÇÃO → AJUDA. O contexto manda: com oferta pendente, "sim/não/cancela" respondem à oferta; sem ela, respondem ao pedido de confirmação da consulta.
16. **Frontend sem biblioteca de estado:** `usePolling` mantém o último dado bom, não acumula requisições e pausa com a aba escondida. A contagem regressiva usa os segundos do servidor, não o relógio do celular.
17. **Regra do alerta de enchente:** o limiar da área (`LIMIAR_MM`) é comparado com a **soma** da chuva prevista da hora atual até +3 h (não com o pico de uma hora), como na especificação. Local salvo ATIVO a até `RAIO_M` do centro da área é alertado. O nível sobe com a razão chuva/limiar: ≥ 1,0 ATENÇÃO, ≥ 1,5 ALTO, ≥ 2,0 CRÍTICO.
18. **Sem alerta repetido:** a chave única (local, área, hora cheia) impede reenviar o mesmo alerta enquanto o job roda a cada 15 min. Um alerta fica "ativo" até a pessoa tocar em "Estou seguro" ou passarem 6 h.
19. **Open-Meteo defensiva:** timeout de 3 s (conexão) e 4 s (leitura), cache de 10 min por coordenada arredondada (~1 km) e fallback: qualquer erro vira "sem previsão" + log, e a área é pulada.
20. **Segurança antes de intenção:** no assistente, "não estou seguro" e palavras de perigo (alagando, enchente...) vêm antes de NEGATIVA/AFIRMATIVA e respondem com Defesa Civil (199), Bombeiros (193) e o abrigo.
21. **Modo demo sem atalhos:** cada botão aciona o caminho real do BO. O relógio da demo é um `Clock` ajustável que só existe com `ZELO_DEMO_MODE=true`; "Resetar" recarrega o próprio `02_dml.sql` (copiado ao classpath no build). A chuva simulada tem prioridade sobre a previsão real, só para a área escolhida.
22. **Erros HTTP honestos:** rota inexistente responde 404 e método errado 405 (antes o handler genérico devolvia 500).
23. **Prova de concorrência executada.** `EncaixeConcorrenciaIT` (Testcontainers, Oracle Free, DDL e seed de produção) passou: 10 chamadas simultâneas a `ofertarProximo` criam exatamente 1 oferta PENDENTE; 2 aceites simultâneos da mesma oferta criam 1 consulta (o outro recebe "oferta não está mais disponível").
24. **Segurança (revisão M5).** Sem segredos no histórico do Git; `.env` fora do controle de versão; `npm audit` sem vulnerabilidades; SQL sempre com parâmetros nomeados (o único SQL dinâmico concatena constantes do código); CORS por lista explícita; `/demo` nem é registrado sem `ZELO_DEMO_MODE=true`; erros nunca vazam stack trace; cabeçalhos `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` e `Cache-Control: no-store` na API; container sem root. Spring Boot atualizado para 3.5.16 (a 3.3 saiu de suporte). Não há autenticação por decisão de escopo (dados 100% simulados): qualquer pessoa pode abrir o app de qualquer paciente.
25. **Acessibilidade medida, não só desenhada.** Auditoria axe-core (WCAG 2.1 A/AA e boas práticas) num Chrome real em 7 estados de tela (conversa, locais, painel, cartão da vaga, alerta, letra grande e demo): 0 violações, inclusive de contraste. Todos os alvos de toque têm 44 px ou mais.
