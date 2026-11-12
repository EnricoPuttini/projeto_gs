# Roteiro da demo

Tudo sai da tela **/demo**: roteiro numerado à esquerda (cada passo diz o que observar), celular da Dona Cida no centro e painel da UBS à direita. Para contextualizar a banca antes, use a página **Início** (problema e solução com dados reais) e **Como funciona** (o que significa cada número). Não precisa de preparação manual além do checklist abaixo.

## Checklist antes de gravar (5 minutos)

1. Backend com `ZELO_DEMO_MODE=true` (no Render: serviço `zelo-api-cnp7` → Environment → salvar; ele reinicia sozinho) (no Render: variável de ambiente e redeploy). **Desligue depois**: com o demo ligado, qualquer pessoa com o link consegue resetar o banco.
2. **Acorde o backend** (plano free do Render dorme e leva ~50 s): abra `https://zelo-api-cnp7.onrender.com/actuator/health` e espere `{"status":"UP"}`.
3. Abra `/demo` no **Chrome ou Edge** (Firefox não tem reconhecimento de voz), permita o microfone e deixe o som ligado.
4. Clique em **Recomeçar do zero**. Isso recarrega o seed com datas de hoje; sem isso a "consulta de amanhã" pode não existir.
5. Dê um clique em qualquer lugar da página (navegadores só liberam áudio depois de um toque).

## Versão de 30 segundos

| Tempo | Ação | O que o público vê |
|---|---|---|
| 0–5 s | Fala: "Consultas ficam vazias por falta, enquanto outras pessoas esperam meses." | Painel da UBS com agenda e fila |
| 5–12 s | Clique em **1 · Paciente cancela a consulta** | Surge o cartão da vaga no celular da Dona Cida com contagem de 15 min; o painel mostra a oferta em andamento |
| 12–20 s | Dona Cida **fala**: "quero a vaga" (ou toca no botão do cartão) | Confirmação em voz alta; a consulta de encaixe entra na agenda; **Vagas recuperadas** vira 1 |
| 20–27 s | Clique em **3 · Simular alerta de enchente** | No cartão do passo a chuva prevista sobe até passar o limite da área (barra fica laranja), a área do córrego pulsa no mini mapa e o celular toca a sirene em tela cheia com o abrigo a 465 m. Dona Cida diz "tô seguro" (ou toca o botão): a confirmação viaja até o painel |
| 27–30 s | Aponte os cartões de impacto | Vagas recuperadas, dias economizados e moradores alertados |

## Versão de 3 minutos (para a banca)

1. **Problema e persona** (Dona Cida, 64 anos, lê com dificuldade, manda áudio).
2. Mostre o **painel**: risco de falta em cor, número e palavra ("65% · Alto"), fila ordenada pelo motor (prioridade legal, gravidade, espera, distância, risco).
3. **Cancelamento → vaga**: fluxo da tabela acima. Comente que a oferta é do próximo da fila na mesma UBS e especialidade, e que quem cancelou não recebe a própria vaga.
4. **Oferta que expira**: clique em **Avançar relógio 15 min** com outra oferta aberta. A vaga passa ao próximo da fila sozinha.
5. **Enchente**: passo 3 completo (chuva sobe → área pulsa → alerta → "estou seguro"). Para repetir na gravação, use **Resetar a simulação** no próprio passo. Depois mostre *Meus locais*: o mapa com as áreas de alagamento e as três intensidades (silencioso, vibrar, alarme).
6. **Acessibilidade**: ative *Letra grande*, use só o teclado (foco visível) e ouça a resposta com o botão "Ouvir".
7. **Código**: Swagger (`/swagger-ui.html`), camadas `model → dao → bo → controller` e o teste de concorrência do encaixe.

## Bônus: "teste com o seu endereço" (/experimente)

Se a banca quiser testar, abra **/experimente** (link "Teste com o seu endereço" no Início):

1. Digite um endereço (ou use "Usar onde estou agora"): aparecem a **chuva prevista de verdade** para as próximas 3 h e a **UBS e a escola reais mais perto** (OpenStreetMap).
2. Marque **"Tenho 60 anos ou mais"** e clique em **Simular: abriu uma vaga**: o celular **toca**. Atenda; o Zelo fala a oferta. Diga "sim" (ou toque **Sim, eu quero**): a consulta aparece marcada.
3. **Simular: chuva forte na sua rua**: alerta em tela cheia com a rota a pé até a escola. Diga "tô seguro".

Nada disso grava no banco: é seguro deixar ligado mesmo com `ZELO_DEMO_MODE=false`.

## Ambiente de teste: sempre tem vaga

No celular da Dona Cida dá para repetir à vontade, por voz ou pelos botões: **"Quero uma vaga"** → **"Quero a vaga"** → **"Ver minha consulta"** → **"Cancelar consulta"** → "Quero uma vaga" de novo. Cada pedido abre uma vaga nova pelos caminhos reais (alguém desmarca, a vaga desce pela fila até ela) e o contador "Vagas recuperadas" do painel sobe.

## Se algo falhar ao vivo

| Sintoma | Solução rápida |
|---|---|
| "Não há consulta de amanhã para cancelar" | Clique em **Recomeçar do zero** |
| Tela com "O servidor está demorando" | O backend está acordando; espere ~50 s (as telas tentam sozinhas) |
| Microfone não funciona | Use os botões *Quero a vaga* / *Estou seguro* ou digite; o resultado é o mesmo |
| Sem som no alarme | Clique na tela uma vez ou no botão *Tocar o som do alarme* |
| Nenhum alerta de chuva | Já alertado nesta hora: **Resetar a simulação** (no passo 3) e simule de novo |
| Em /experimente, "lugares não responderam" | O OpenStreetMap demorou; a simulação segue com nomes genéricos. Tente outro endereço ou repita em 1 minuto |
| Painel não rola com a roda do mouse | Corrigido nesta versão; se acontecer, atualize a página (Ctrl+F5) |

## Por que cada botão é honesto

Nenhum botão mexe no banco por atalho: cada um aciona o **mesmo caminho do BO** que o sistema usa de verdade (cancelar consulta, processar áreas de risco, rodar os jobs). O relógio avançado só existe no modo demo.
