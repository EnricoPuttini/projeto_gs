# Roteiro da demo

Tudo sai da tela **/demo**: celular da Dona Cida à esquerda, painel da UBS à direita. Não precisa de preparação manual além do checklist abaixo.

## Checklist antes de gravar (5 minutos)

1. Backend com `ZELO_DEMO_MODE=true` (no Render: variável de ambiente e redeploy). **Desligue depois**: com o demo ligado, qualquer pessoa com o link consegue resetar o banco.
2. **Acorde o backend** (plano free do Render dorme e leva ~50 s): abra `https://SEU-API.onrender.com/actuator/health` e espere `{"status":"UP"}`.
3. Abra `/demo` no **Chrome ou Edge** (Firefox não tem reconhecimento de voz), permita o microfone e deixe o som ligado.
4. Clique em **Resetar dados**. Isso recarrega o seed com datas de hoje; sem isso a "consulta de amanhã" pode não existir.
5. Dê um clique em qualquer lugar da página (navegadores só liberam áudio depois de um toque).

## Versão de 30 segundos

| Tempo | Ação | O que o público vê |
|---|---|---|
| 0–5 s | Fala: "Consultas ficam vazias por falta, enquanto outras pessoas esperam meses." | Painel da UBS com agenda e fila |
| 5–12 s | Clique em **Paciente cancela consulta** | Surge o cartão da vaga no celular da Dona Cida com contagem de 15 min; o painel mostra a oferta em andamento |
| 12–20 s | Dona Cida **fala**: "quero a vaga" | Confirmação em voz alta; a consulta de encaixe entra na agenda; **Vagas recuperadas** vira 1 |
| 20–27 s | Clique em **Simular chuva forte no bairro** | Tela cheia vermelha, sirene e vibração, abrigo mais próximo e rota. Ela diz "estou seguro" |
| 27–30 s | Aponte os cartões de impacto | Vagas recuperadas, dias economizados e moradores alertados |

## Versão de 3 minutos (para a banca)

1. **Problema e persona** (Dona Cida, 64 anos, lê com dificuldade, manda áudio).
2. Mostre o **painel**: risco de falta em cor, número e palavra ("65% · Alto"), fila ordenada pelo motor (prioridade legal, gravidade, espera, distância, risco).
3. **Cancelamento → vaga**: fluxo da tabela acima. Comente que a oferta é do próximo da fila na mesma UBS e especialidade, e que quem cancelou não recebe a própria vaga.
4. **Oferta que expira**: clique em **Avançar relógio 15 min** com outra oferta aberta. A vaga passa ao próximo da fila sozinha.
5. **Chuva**: simule e mostre as três intensidades em *Meus locais* (silencioso, vibrar, alarme).
6. **Acessibilidade**: ative *Letra grande*, use só o teclado (foco visível) e ouça a resposta com o botão "Ouvir".
7. **Código**: Swagger (`/swagger-ui.html`), camadas `model → dao → bo → controller` e o teste de concorrência do encaixe.

## Se algo falhar ao vivo

| Sintoma | Solução rápida |
|---|---|
| "Não há consulta de amanhã para cancelar" | Clique em **Resetar dados** |
| Tela com "O servidor está demorando" | O backend está acordando; espere ~50 s (as telas tentam sozinhas) |
| Microfone não funciona | Use os botões *Quero a vaga* / *Estou seguro* ou digite; o resultado é o mesmo |
| Sem som no alarme | Clique na tela uma vez ou no botão *Tocar o som do alarme* |
| Nenhum alerta de chuva | Já alertado nesta hora: **Resetar dados** e simule de novo |

## Por que cada botão é honesto

Nenhum botão mexe no banco por atalho: cada um aciona o **mesmo caminho do BO** que o sistema usa de verdade (cancelar consulta, processar áreas de risco, rodar os jobs). O relógio avançado só existe no modo demo.
