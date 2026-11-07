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
