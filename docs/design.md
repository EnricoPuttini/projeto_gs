# Design do Zelo

> Conceito: **"cuidado que chega antes"**. Calor humano + precisão de dado público. Editorial, não template de SaaS.

## 1. Regra de ouro: duas intensidades

| | Apresentação | Produto |
|---|---|---|
| Páginas | Início, Como funciona, Demonstração | App do cidadão, Painel da UBS |
| Tom | Cinematográfico, storytelling no scroll | Calmo, legível, confiável |
| Scroll | Lenis (inércia) + GSAP ScrollTrigger | Nativo |
| Cursor | Círculo verde com `mix-blend-difference` (só `pointer: fine`) | Nativo, sempre |
| Animação | Reveal por máscara, parallax, pins, marquee, contadores | **Só funcional**: algo chegou, mudou ou vai expirar |
| Transição de rota | Fade + deslocamento 16px, 400 ms | Fade, ≤ 300 ms |

Na Demonstração, o celular e o painel continuam sendo **produto** (calmos); só a moldura (roteiro, partícula de conexão) é apresentação.

## 2. Paleta (tokens em `src/index.css` → `@theme`)

| Token | Hex | Uso |
|---|---|---|
| `petroleo` | `#0f5c57` | Marca, ação primária, dados "bons" |
| `petroleo-escuro` | `#0a403c` | Hover, foco |
| `noite` | `#0b2422` | Seções escuras (verde quase preto derivado da marca) |
| `ambar` | `#f2b84b` | Destaque, CTA secundário, "algo novo" |
| `alerta` | `#c2410c` | **Só perigo**: enchente, risco alto, tempo acabando |
| `alerta-escuro` | `#9a3412` | Texto de alerta sobre fundo claro (contraste AA) |
| `fundo` | `#eef3f1` | Fundo claro |
| `tinta` | `#17211f` | Texto |
| `papel` | `#fbfaf6` | Fundo "editorial" das seções de leitura |

Contraste: todo par texto/fundo é verificado pelo axe-core (meta 0 violações). Âmbar nunca é texto sobre fundo claro; sobre `noite`/`petroleo` usa-se `amber-200` quando o texto é pequeno.

**Proibido:** gradiente roxo/azul, glassmorphism generalizado, emoji como ícone, foto de banco de imagem, número inventado.

## 3. Tipografia

- **Display:** Fraunces (variável, `@fontsource-variable/fraunces`, servida localmente com `font-display: swap`). Títulos grandes, com eixo `opsz` alto e leve itálico em palavras de ênfase.
- **Texto e interface:** Figtree (variável). Produto usa **só Figtree**.
- **Escala fluida** (`clamp`), em `@theme`:
  - `display-xl`: clamp(2.6rem, 6vw + 1rem, 6rem)
  - `display-lg`: clamp(2.1rem, 3.6vw + 1rem, 4rem)
  - `display-md`: clamp(1.7rem, 2vw + 1rem, 2.75rem)
  - texto base nunca abaixo de 16px; corpo de leitura 18–20px.

## 4. Ilustração

SVG próprio, traço geométrico, cores da paleta, sem gradiente: celular, sala de espera (cadeiras), pessoas em fila (silhuetas simples), UBS, mapa do bairro com córrego, abrigo. Decorativos com `aria-hidden`; informativos com `role="img"` + `aria-label`/`<title>`.

## 5. Mapa da página Início (`src/sections/`)

| # | Seção | O que acontece | Dado (fonte) |
|---|---|---|---|
| 1 | **Hero** | Título em reveal por máscara linha a linha; celular com chat do Zelo "digitando" sozinho; 2 cartões flutuantes em parallax; CTA magnético | Textos do próprio app |
| 2 | **Marquee** | Faixa infinita com os temas; desacelera no hover | — |
| 3 | **O problema** (pin) | Sala de espera: a cada trecho de scroll cadeiras esvaziam (≈ 1 em 5) e a fila do lado de fora cresce; contadores animam | Kaggle: taxa de falta 20,2%, 29% com falta anterior, 32,7% com 15+ dias |
| 4 | **Como resolve** (pin) | Celular fixo; a tela troca em 4 passos; linha SVG se desenha entre os passos | Fluxo real do sistema |
| 5 | **Enchente** (escura) | Mapa SVG do bairro com córrego; chuva em canvas; área de risco pulsa; alerta chega ao celular; rota até o abrigo se desenha | Regras reais (3 h, raio, limite) |
| 6 | **Impacto** | 4 indicadores contam ao entrar na tela | API `/painel/ubs/1` (impacto); fallback com texto "servidor acordando" |
| 7 | **Ecossistema** | Nós (Cidadão, UBS, Secretaria, Defesa Civil, Open-Meteo); linhas se desenham; pulso percorre | Integrações reais/planejadas, rotuladas |
| 8 | **ODS 3, 10, 11, 13** | Cartões com cores oficiais (3 `#4C9F38`, 10 `#DD1367`, 11 `#FD9D24`, 13 `#3F7E44`) | Frase concreta por ODS |
| 9 | **Fechamento** | Frase final grande, CTA, equipe | `src/content/site.ts` |

Abaixo de 768px (`gsap.matchMedia`), os pins viram sequência vertical simples.

## 6. Animações por página

**Início:** reveal por máscara (títulos), parallax (cartões do hero), marquee, pin + scrub (problema, solução), desenho de linha SVG (solução, rota, ecossistema), canvas de chuva (pausa fora da tela), contadores, CTA magnético com brilho, pulso no logo, nav transparente → sólida com seção ativa.

**Como funciona:** reveal suave das seções, índice com seção ativa, sem pins (é página de leitura).

**Demonstração:** passo atual do roteiro destacado; "partícula" viaja do celular ao painel (ou o contrário) quando um evento acontece.

**Produto (cidadão e painel):** mensagem nova desliza e aparece; anel de contagem regressiva no cartão da vaga; confete verde/âmbar por 1,5 s ao aceitar a vaga; números do painel interpolam quando mudam; linha nova destacada por 2 s; skeletons no carregamento.

**`prefers-reduced-motion`:** desliga parallax, pins, Lenis, cursor, marquee e confete; conteúdo aparece direto, sem perder informação.

## 7. Organização do código

- `src/content/site.ts` — todo texto de apresentação, números de apresentação (derivados de `estatisticas.json`), itens do marquee, ODS e equipe, num objeto tipado.
- `src/components/motion/` — Reveal, Magnetic, Marquee, CountUp, Cursor, SmoothScroll, Confetti (+ `useReducedMotion`).
- `src/sections/` — uma seção da Início por arquivo.
- GSAP + ScrollTrigger com `useGSAP` (`@gsap/react`), que desfaz tudo ao desmontar.

## 8. Desvios declarados em relação ao pedido

- O endpoint `/painel/metricas` não existe: os indicadores vêm de `/painel/ubs/{id}`, que já devolve os 4 números de impacto. Nenhuma mudança de backend.
- Os nomes da equipe ficam como campos a preencher em `site.ts` (não invento nomes).
- Screenshots com Chrome real via `puppeteer-core` (mesmo papel do Playwright, já instalado e validado aqui).

## 9. Resultados medidos e cortes feitos (09/11)

**Lighthouse mobile, página Início, build de produção** (5 rodadas finais): Performance 90–94 (mediana 92), Acessibilidade 100, Boas práticas 96, SEO 91. LCP 1,2–1,3 s, TBT ~300 ms, CLS 0. Antes das otimizações: Performance 69–75, LCP 2,7–3,5 s, TBT 680–1.540 ms.

Medido por experimento (uma mudança por vez), não por palpite:

| Mudança | Efeito medido | Por quê |
|---|---|---|
| **Cortada** a grade quadriculada com máscara radial no fundo do hero | TBT −800 ms | Decorativa; custava mais que todo o resto da página |
| Lenis **desligado em tela de toque** | TBT −200 ms | No toque a inércia já é nativa; no desktop continua |
| Início importada direto (sem `lazy`) | LCP 2,8 s → 1,3 s | A porta de entrada não pode esperar um segundo download |
| Seções abaixo do hero em pedaço separado e **montadas uma por vez** em momentos ociosos | TBT 540 → 300 ms | Montar 8 seções juntas era uma tarefa longa; tudo continua no DOM em ~1–2 s (inclusive para leitor de tela) |
| Animações infinitas (marquee, pulsos) só rodam com a seção na tela | menos CPU fora da tela | ScrollTrigger `toggleActions: play pause resume pause` |
| Subtítulo do hero sem animação de entrada | é o elemento de LCP | Texto pinta na primeira pintura |

**Ajustes de acessibilidade decididos no processo (axe-core: 0 violações em 16 combinações, com e sem reduced-motion):**
- passos inativos da solução esmaecem para 75% (não 30%): o efeito continua e o texto mantém contraste AA;
- mensagem nova do chat entra só com deslocamento/escala, **sem opacidade**: o texto nunca fica translúcido;
- ODS 3 e ODS 11 usam texto escuro sobre a cor oficial (branco não atinge AA);
- contagens animadas expõem o valor final em texto `sr-only` (leitor de tela não ouve a contagem);
- `<caption class="sr-only">` dentro de área rolável precisa de ancestral `relative` (sem isso esticava a página em 1.000 px).
