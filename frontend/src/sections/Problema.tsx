import { useRef } from 'react'
import { CountUp } from '../components/motion/CountUp'
import { gsap, useGSAP } from '../components/motion/gsap'
import { RevealLinhas } from '../components/motion/Reveal'
import { fmtPct, SITE } from '../content/site'

const { problema } = SITE
const COLUNAS = 6
// 6 de 30 cadeiras = 20%: a mesma taxa de falta da base real. Posicoes espalhadas para "parecer sala".
const VAZIAS = new Set([3, 8, 14, 17, 22, 27])
const FILA_FORA = 12

function Pessoa({ x, y, falta }: { x: number; y: number; falta: boolean }) {
  return (
    <g data-pessoa-falta={falta || undefined}>
      <circle cx={x} cy={y - 26} r="8" fill="#17211f" />
      <path d={`M${x - 13} ${y - 2} q0 -15 13 -15 q13 0 13 15 z`} fill="#17211f" />
    </g>
  )
}

function SalaDeEspera() {
  const cadeiras = Array.from({ length: problema.cadeiras }, (_, i) => ({ i, x: 60 + (i % COLUNAS) * 84, y: 92 + Math.floor(i / COLUNAS) * 66 }))
  return (
    <svg
      viewBox="0 0 600 560"
      role="img"
      aria-labelledby="sala-titulo"
      className="h-auto w-full"
    >
      <title id="sala-titulo">
        Sala de espera com {problema.cadeiras} cadeiras: {VAZIAS.size} ficam vazias por falta ({fmtPct(VAZIAS.size / problema.cadeiras)}), enquanto {FILA_FORA} pessoas esperam do lado de fora.
      </title>
      {/* parede da sala com a porta aberta a direita */}
      <rect x="20" y="40" width="540" height="390" fill="#ffffff" />
      <path d="M560 250 V40 H20 V430 H560 V330" fill="none" stroke="#17211f" strokeWidth="3" strokeLinejoin="round" />
      <text x="34" y="30" fontSize="15" fontWeight="700" fill="#17211f">Sala de espera da UBS</text>
      {cadeiras.map(({ i, x, y }) => {
        const falta = VAZIAS.has(i)
        return (
          <g key={i}>
            <rect data-assento-falta={falta || undefined} x={x - 22} y={y} width="44" height="16" rx="5" fill="#0f5c57" stroke="#0f5c57" strokeWidth="2.5" />
            <rect x={x - 22} y={y + 16} width="5" height="12" fill="#0f5c57" />
            <rect x={x + 17} y={y + 16} width="5" height="12" fill="#0f5c57" />
            <Pessoa x={x} y={y} falta={falta} />
            {falta && (
              <text data-marca-falta x={x} y={y + 13} textAnchor="middle" fontSize="13" fontWeight="800" fill="#c2410c" opacity="0">
                falta
              </text>
            )}
          </g>
        )
      })}
      {/* lado de fora: a fila que espera meses pela mesma consulta */}
      <text x="34" y="478" fontSize="15" fontWeight="700" fill="#17211f">Lá fora: fila de espera</text>
      <line x1="20" y1="540" x2="580" y2="540" stroke="#17211f" strokeOpacity="0.2" strokeWidth="2" />
      {Array.from({ length: FILA_FORA }, (_, i) => (
        <g key={i} data-fila>
          <Pessoa x={45 + i * 45} y={536} falta={false} />
        </g>
      ))}
    </svg>
  )
}

export function Problema() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ grande: '(min-width: 768px)', reduzir: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        const { grande, reduzir } = ctx.conditions as { grande: boolean; reduzir: boolean }
        const tl = gsap.timeline({
          scrollTrigger: reduzir
            ? undefined
            : grande
              ? // desktop: a secao fica parada enquanto o scroll "passa o tempo" na sala
                { trigger: ref.current, start: 'top top', end: '+=140%', pin: true, scrub: 0.6 }
              : // celular: sem pin (pesado e desorientador em tela pequena); toca uma vez ao aparecer
                { trigger: '[data-sala]', start: 'top 75%' },
        })
        tl.to('[data-pessoa-falta]', { opacity: 0, y: -10, stagger: 0.12, duration: 0.5 })
          .to('[data-assento-falta]', { attr: { fill: '#ffffff', stroke: '#c2410c' }, stagger: 0.12, duration: 0.5 }, '<')
          .to('[data-marca-falta]', { opacity: 1, stagger: 0.12, duration: 0.3 }, '<0.2')
          .from('[data-fila]', { opacity: 0, x: -16, stagger: 0.08, duration: 0.4 })
        // reduced-motion: estado final direto, mesma informacao, nenhum movimento
        if (reduzir) tl.progress(1)
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} data-secao="O problema" aria-labelledby="problema-titulo" className="flex min-h-dvh items-center bg-papel py-20">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-alerta-escuro">O problema</p>
          <RevealLinhas como="h2" id="problema-titulo" linhas={[problema.titulo]} className="mt-3 font-display text-display-lg font-semibold text-tinta" />
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-tinta/85">{problema.texto}</p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-tinta/15 pt-6">
            {problema.numeros.map((n) => (
              <div key={n.rotulo}>
                <dt className="sr-only">{n.rotulo}</dt>
                <dd>
                  <CountUp valor={n.valor * 100} aoEntrarNaTela formatar={(v) => `${Math.round(v)}%`} className="block font-display text-4xl font-semibold text-tinta sm:text-5xl" />
                  <span aria-hidden className="mt-1 block text-sm leading-snug text-tinta/80">{n.rotulo}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-tinta/70">Fonte: {problema.fonte}.</p>
        </div>
        <div data-sala className="rounded-3xl bg-fundo p-4 ring-1 ring-tinta/10 sm:p-6">
          <SalaDeEspera />
        </div>
      </div>
    </section>
  )
}
