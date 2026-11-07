# Prompts à IA (regra da GS)

## Fase 0 — Planejamento
Pedi arquitetura (mermaid), modelo de dados, endpoints, plano por marcos e perguntas bloqueantes antes de qualquer código. A IA devolveu o plano e 5 perguntas; aprovei e mandei começar.

## M1 — Base (backend, banco, CRUD)
Pedi o projeto Spring Boot 3/Java 21 em camadas `model → dao → bo → controller`, DDL Oracle `ZL_*` com constraints nomeadas, seed simulado, docker-compose com Oracle Free, Swagger e tratamento de erros em `ProblemDetail`. A IA gerou o código, a máquina de estados declarativa (enums) e 24 testes; revisei as regras de transição e o DDL.
