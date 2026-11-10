# Prompts à IA (regra da GS)

## Fase 0 — Planejamento
Pedi arquitetura (mermaid), modelo de dados, endpoints, plano por marcos e perguntas bloqueantes antes de qualquer código. A IA devolveu o plano e 5 perguntas; aprovei e mandei começar.

## M1 — Base (backend, banco, CRUD)
Pedi o projeto Spring Boot 3/Java 21 em camadas `model → dao → bo → controller`, DDL Oracle `ZL_*` com constraints nomeadas, seed simulado, docker-compose com Oracle Free, Swagger e tratamento de erros em `ProblemDetail`. A IA gerou o código, a máquina de estados declarativa (enums) e 24 testes; revisei as regras de transição e o DDL.

## M2 — Fatia vertical (encaixe, confirmação, assistente, app e painel)
Pedi o motor de encaixe com `SELECT ... FOR UPDATE` e prova de concorrência, confirmação D-1, assistente por regras em pt-BR, risco de falta por regressão logística lida de JSON e o frontend (chat com voz, cartão de vaga com contagem regressiva e painel com polling). A IA escreveu o código e 108 testes unitários; o teste de concorrência exige Docker e precisa ser rodado pela equipe.

## M3 — Alertas de enchente, modo demo e indicadores
Pedi o job de alerta com Open-Meteo (timeout, cache e fallback), a regra de raio/limiar com abrigo mais próximo e link de rota, "Meus locais", a tela cheia com som e vibração por intensidade, o relógio ajustável e a página /demo. A IA implementou e escreveu 142 testes; conferi a regra do limiar (soma de 3 h) e as definições dos indicadores.

## M4 — Deploy e roteiro
Pedi o Dockerfile multi-stage do backend, o blueprint do Render (backend Docker + frontend estático), o README de deploy e o roteiro da demo de 30 s e 3 min. A IA construiu a imagem e a executou contra o Oracle local para validar variáveis de ambiente, CORS e o modo demo desligado; o deploy real depende das credenciais da equipe.

## M5 — Segurança e acessibilidade
Pedi revisão de segurança (segredos, dependências, cabeçalhos, CORS) e auditoria de acessibilidade com ferramenta real. A IA rodou o axe-core em Chrome, corrigiu marcos de página, ordem de títulos e área rolável sem teclado, atualizou o Spring Boot e executou os testes de integração com Oracle via Testcontainers.

## M5 — Dados reais e redesenho
Pedi dados reais (Kaggle) e um site mais bonito e autoexplicativo. A IA baixou a base pública "Medical Appointment No Shows", treinou a regressão logística (AUC 0,674) substituindo os coeficientes provisórios, calibrou o seed com as taxas reais e redesenhou o site: página inicial com o problema e a solução, página "Como funciona" explicando cada dado, painel com explicações e demo guiada por passos.

## M5 — Redesign "inesquecível"
Pedi um redesign cinematográfico nas páginas de apresentação e calmo no produto, com GSAP/ScrollTrigger, Lenis, Fraunces, storytelling em 9 seções e metas de axe 0 violações e Lighthouse mobile ≥ 90. A IA escreveu `docs/design.md`, implementou seção por seção conferindo prints em 390 e 1440 px, e otimizou por experimento (cortou a grade decorativa do hero, desligou o Lenis no toque, montou as seções progressivamente): Performance mediana 92, Acessibilidade 100.
