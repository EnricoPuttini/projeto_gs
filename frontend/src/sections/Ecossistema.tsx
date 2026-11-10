import { useRef } from 'react'
import { gsap, reduzirMovimento, useGSAP } from '../components/motion/gsap'
import { RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'

const { ecossistema } = SITE
// posicao de cada no no diagrama (% da largura/altura); o Zelo fica no centro
const POS: Record<string, [number, number]> = {
  cidadao: [14, 22],
  ubs: [14, 78],
  secretaria: [50, 92],
  defesa: [86, 78],
  meteo: [86, 22],
}

export function Ecossistema() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const linhas = gsap.utils.toArray<SVGLineElement>('[data-ligacao]')
      if (reduzirMovimento()) return
      // pathLength=1 normaliza o comprimento: o tracejado vale em qualquer escala do SVG
      gsap.set(linhas, { strokeDasharray: 1, strokeDashoffset: 1 })
      // as ligacoes se desenham quando o diagrama entra na tela
      gsap.to(linhas, { strokeDashoffset: 0, duration: 1.2, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: '[data-diagrama]', start: 'top 70%' } })
      // um pulso percorre cada ligacao em loop: os dados circulam entre os parceiros
      gsap.utils.toArray<SVGCircleElement>('[data-pulso-eco]').forEach((p, i) => {
        const [x, y] = POS[p.dataset.no!]
        gsap.fromTo(p, { attr: { cx: 50, cy: 50 }, opacity: 0 }, { attr: { cx: x, cy: y }, opacity: 1, duration: 1.8, delay: 1.4 + i * 0.35, repeat: -1, repeatDelay: 1.2, ease: 'power1.inOut', scrollTrigger: { trigger: '[data-diagrama]', toggleActions: 'play pause resume pause' } })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} data-secao="Ecossistema" aria-labelledby="eco-titulo" className="bg-fundo py-24">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-petroleo">Ecossistema</p>
        <RevealLinhas como="h2" id="eco-titulo" linhas={[ecossistema.titulo]} className="mt-3 font-display text-display-lg font-semibold text-tinta" />

        {/* desktop: diagrama de nos; celular: a mesma informacao como lista */}
        <div data-diagrama className="relative mt-12 hidden aspect-[16/8] md:block">
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {ecossistema.nos.map((n) => (
              <line key={n.id} data-ligacao pathLength={1} x1="50" y1="50" x2={POS[n.id][0]} y2={POS[n.id][1]} stroke="#0f5c57" strokeOpacity="0.5" strokeWidth="0.35" />
            ))}
            {ecossistema.nos.map((n) => (
              <circle key={n.id} data-pulso-eco data-no={n.id} cx="50" cy="50" r="0.9" fill="#f2b84b" opacity="0" />
            ))}
          </svg>
          <div className="absolute left-1/2 top-1/2 flex size-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-petroleo text-white shadow-xl ring-8 ring-petroleo/15">
            <span className="font-display text-3xl font-semibold">Zelo</span>
            <span className="text-sm text-white/85">no meio</span>
          </div>
          <ul>
            {ecossistema.nos.map((n) => (
              <li key={n.id} className="absolute w-56 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 text-center shadow-md ring-1 ring-tinta/10" style={{ left: `${POS[n.id][0]}%`, top: `${POS[n.id][1]}%` }}>
                <p className="font-bold text-tinta">{n.nome}</p>
                <p className="text-sm text-tinta/75">{n.papel}</p>
              </li>
            ))}
          </ul>
        </div>
        <ul className="mt-8 grid gap-3 md:hidden">
          {ecossistema.nos.map((n) => (
            <li key={n.id} className="rounded-2xl bg-white p-4 ring-1 ring-tinta/10">
              <p className="font-bold text-tinta">{n.nome}</p>
              <p className="text-sm text-tinta/75">{n.papel}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
