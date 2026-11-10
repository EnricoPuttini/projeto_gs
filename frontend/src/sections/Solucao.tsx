import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Bolha, CelularMock } from '../components/CelularMock'
import { IconeMic } from '../components/Icones'
import { gsap, useGSAP } from '../components/motion/gsap'
import { RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'

const { solucao } = SITE

/** O que aparece na tela do celular em cada passo (textos de site.ts; o resto e a interface do app). */
const TELAS: ReactNode[] = [
  <>
    <Bolha de="zelo">{solucao.passos[0].tela}</Bolha>
    <div className="flex justify-start gap-2 pl-1">
      <span className="rounded-full border-2 border-petroleo bg-white px-3 py-1 text-xs font-bold text-petroleo">Vou sim</span>
      <span className="rounded-full border-2 border-petroleo bg-white px-3 py-1 text-xs font-bold text-petroleo">Não posso</span>
    </div>
  </>,
  <>
    <Bolha de="cida"><IconeMic className="mr-1 inline size-4 align-[-2px] text-petroleo" />Não vou poder ir.</Bolha>
    <Bolha de="zelo">{solucao.passos[1].tela}</Bolha>
  </>,
  <>
    <Bolha de="zelo">{solucao.passos[2].tela}</Bolha>
    <div className="rounded-2xl border-2 border-ambar bg-white p-3 text-tinta shadow">
      <p className="text-sm font-extrabold text-petroleo">Vaga para você!</p>
      <p className="text-sm font-semibold">Clínica Geral · amanhã, 8h</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-petroleo">15:00</p>
    </div>
  </>,
  <>
    <Bolha de="cida"><IconeMic className="mr-1 inline size-4 align-[-2px] text-petroleo" />Quero a vaga!</Bolha>
    <Bolha de="zelo">{solucao.passos[3].tela}</Bolha>
    <p className="rounded-xl bg-petroleo px-3 py-2 text-center text-xs font-bold text-white">Painel da UBS: +1 vaga recuperada</p>
  </>,
]

export function Solucao() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      // so desktop com movimento: celular fixo, passos trocam com o scroll
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const passos = gsap.utils.toArray<HTMLElement>('[data-passo]')
        const telas = gsap.utils.toArray<HTMLElement>('[data-tela]')
        const linha = ref.current!.querySelector<SVGPathElement>('[data-linha-passos]')!
        const comprimento = linha.getTotalLength()
        gsap.set(linha, { strokeDasharray: comprimento, strokeDashoffset: comprimento })
        // 0.75 (nao menos): o passo inativo esmaece mas continua com contraste AA para quem enxerga pouco
        gsap.set(passos.slice(1), { opacity: 0.75 })
        gsap.set(telas.slice(1), { autoAlpha: 0, y: 20 })

        const tl = gsap.timeline({
          scrollTrigger: { trigger: ref.current, start: 'top top', end: `+=${passos.length * 90}%`, pin: true, scrub: 0.6 },
        })
        tl.to(linha, { strokeDashoffset: 0, ease: 'none', duration: passos.length - 1 }, 0)
        passos.forEach((p, i) => {
          if (i === 0) return
          tl.to(passos[i - 1], { opacity: 0.75, duration: 0.3 }, i - 0.5)
            .to(p, { opacity: 1, duration: 0.3 }, i - 0.5)
            .to(telas[i - 1], { autoAlpha: 0, y: -20, duration: 0.3 }, i - 0.5)
            .to(telas[i], { autoAlpha: 1, y: 0, duration: 0.3 }, i - 0.35)
        })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} data-secao="Como resolve" aria-labelledby="solucao-titulo" className="flex min-h-dvh items-center bg-fundo py-20">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-petroleo">A solução</p>
          <RevealLinhas como="h2" id="solucao-titulo" linhas={[solucao.titulo]} className="mt-3 font-display text-display-lg font-semibold text-tinta" />
          <ol className="relative mt-10 space-y-8 pl-14">
            {/* linha que liga os passos e se desenha conforme o scroll (desktop) */}
            <svg aria-hidden className="absolute left-[1.15rem] top-2 h-[calc(100%-1rem)] w-1 overflow-visible" preserveAspectRatio="none" viewBox="0 0 4 100">
              <path d="M2 0 V100" stroke="rgb(15 92 87 / 0.15)" strokeWidth="4" vectorEffect="non-scaling-stroke" />
              <path data-linha-passos d="M2 0 V100" stroke="#0f5c57" strokeWidth="4" vectorEffect="non-scaling-stroke" />
            </svg>
            {solucao.passos.map((p, i) => (
              <li key={p.titulo} className="relative">
                <span aria-hidden className="absolute -left-14 top-0 flex size-10 items-center justify-center rounded-full bg-petroleo font-display text-lg font-bold text-white ring-4 ring-fundo">
                  {i + 1}
                </span>
                {/* so o texto esmaece nos passos inativos; o numero fica opaco para a linha nao aparecer atraves dele */}
                <div data-passo>
                  <h3 className="text-xl font-bold text-tinta">{p.titulo}</h3>
                  <p className="mt-1 text-base leading-relaxed text-tinta/90">{p.texto}</p>
                </div>
                {/* celular: sem pin, cada passo mostra o que aparece na tela logo abaixo */}
                <div className="mt-3 space-y-2 rounded-2xl bg-[#e6efe9] p-3 md:hidden">{TELAS[i]}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="hidden md:block">
          <CelularMock rotulo="Tela do Zelo em cada passo">
            <div className="relative min-h-[18rem]">
              {TELAS.map((t, i) => (
                <div key={i} data-tela className="absolute inset-x-0 bottom-0 flex flex-col gap-2" aria-hidden={i > 0 || undefined}>
                  {t}
                </div>
              ))}
            </div>
          </CelularMock>
        </div>
      </div>
    </section>
  )
}
