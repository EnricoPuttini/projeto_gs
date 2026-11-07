# Decisões

1. **Sem JPA.** O professor quer ver o DAO; usamos `NamedParameterJdbcTemplate` e SQL explícito.
2. **Datas em `LocalDateTime`/`TIMESTAMP` no fuso America/Sao_Paulo**, sempre derivadas do `Clock` injetado (testes fixam o tempo; a demo poderá avançar o relógio).
3. **IDENTITY `BY DEFAULT`** (não `ALWAYS`) para o seed fixar IDs; o seed realinha o contador com `START WITH LIMIT VALUE`.
4. **Filtros opcionais montados no SQL**, não `:p IS NULL OR ...`, para evitar bind de NULL sem tipo no Oracle.
5. **Vaga só nasce de consulta CANCELADA/NAO_RESPONDIDA** (`UQ_VAGA_CONS`). Por isso NAO_RESPONDIDA não pode virar CANCELADA depois.
6. **Concorrência no encaixe (M2):** `SELECT ... FOR UPDATE` na vaga + índice único funcional `UQ_OFE_PEND` (no máximo 1 oferta PENDENTE por vaga).
7. **Sem login:** dados simulados; o app escolhe o `pacienteId`.
8. **Ordenação do encaixe (aplicada no M2):** prioridade legal (idoso 60+, gestante, PcD) → gravidade (3 > 1) → mais dias de espera → menor distância casa–UBS (Haversine) → menor risco de falta. Desempate final por ID da fila, para ser determinístico.
