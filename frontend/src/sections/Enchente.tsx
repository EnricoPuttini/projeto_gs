import { useEffect, useRef } from 'react'
import { IconeChuva } from '../components/Icones'
import { gsap, reduzirMovimento, useGSAP } from '../components/motion/gsap'
import { RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'

const { enchente } = SITE

/**
 * Chuva em canvas: da "peso" ao momento antes do alerta. Leve (linhas simples), so roda enquanto a secao
 * esta visivel (IntersectionObserver) e nao existe com reduced-motion. `intensidade` (0..1) vem do scroll.
 */
function Chuva({ intensidade }: { intensidade: React.RefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reduzirMovimento()) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let ativo = false
    const gotas = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.8 }))
    const ajustar = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio
      canvas.height = canvas.clientHeight * devicePixelRatio
    }
    const quadro = () => {
      const { width: w, height: h } = canvas
      ctx.clearRect(0, 0, w, h)
      const n = Math.floor(gotas.length * (0.15 + 0.85 * (intensidade.current ?? 0)))
      ctx.strokeStyle = 'rgba(200, 230, 228, 0.45)'
      ctx.lineWidth = 1.2 * devicePixelRatio
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const g = gotas[i]
        g.y += 0.012 * g.v
        if (g.y > 1) { g.y = 0; g.x = Math.random() }
        ctx.moveTo(g.x * w, g.y * h)
        ctx.lineTo(g.x * w - 3 * devicePixelRatio, g.y * h + 14 * devicePixelRatio)
      }
      ctx.stroke()
      if (ativo) raf = requestAnimationFrame(quadro)
    }
    ajustar()
    window.addEventListener('resize', ajustar)
    // pausa fora da tela: nenhum quadro gasto quando ninguem esta vendo
    const obs = new IntersectionObserver(([e]) => {
      ativo = e.isIntersecting
      cancelAnimationFrame(raf)
      if (ativo) raf = requestAnimationFrame(quadro)
    })
    obs.observe(canvas)
    return () => {
      ativo = false
      cancelAnimationFrame(raf)
      obs.disconnect()
      window.removeEventListener('resize', ajustar)
    }
  }, [intensidade])
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}

function Mapa() {
  return (
    <svg viewBox="0 0 640 440" role="img" aria-labelledby="mapa-titulo" className="h-auto w-full">
      <title id="mapa-titulo">
        Mapa ilustrativo do bairro: a casa da Dona Cida fica dentro da área de risco perto do córrego; a rota a pé leva até a escola que serve de abrigo.
      </title>
      <rect width="640" height="440" fill="#0f2f2c" />
      {/* quarteiroes */}
      <g fill="#143c38">
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x={20 + (i % 6) * 104} y={20 + Math.floor(i / 6) * 104} width="84" height="84" rx="6" />
        ))}
      </g>
      {/* corrego */}
      <path d="M-10 300 C 90 250, 160 330, 260 290 S 420 200, 520 250 S 640 230, 660 210" fill="none" stroke="#3f9fae" strokeWidth="16" strokeLinecap="round" />
      <text x="520" y="290" fill="#9fd6dd" fontSize="14" fontWeight="700">Córrego</text>
      {/* area de risco (pulsa) */}
      <g data-area opacity="0">
        <circle data-pulso cx="250" cy="290" r="96" fill="#c2410c" opacity="0.18" />
        <circle cx="250" cy="290" r="96" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="8 6" />
        <text x="320" y="404" textAnchor="middle" fill="#fdba74" fontSize="14" fontWeight="800">Área de risco</text>
      </g>
      {/* rota casa -> abrigo */}
      <path data-rota d="M232 268 V 150 H 432 V 92" fill="none" stroke="#f2b84b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* casa da Dona Cida */}
      <g>
        <circle cx="232" cy="268" r="14" fill="#ffffff" />
        <path d="M225 270 l7-7 7 7 v6 h-14z" fill="#0f5c57" />
        <text x="200" y="330" fill="#ffffff" fontSize="14" fontWeight="700">Casa da Dona Cida</text>
      </g>
      {/* abrigo */}
      <g>
        <rect x="412" y="62" width="40" height="30" rx="6" fill="#f2b84b" />
        <path d="M418 76 h28 M432 68 v16" stroke="#17211f" strokeWidth="3" />
        <text x="464" y="84" fill="#ffffff" fontSize="14" fontWeight="700">Abrigo (escola)</text>
      </g>
    </svg>
  )
}

export function Enchente() {
  const ref = useRef<HTMLElement>(null)
  const intensidade = useRef(0)

  useGSAP(
    () => {
      const passos = gsap.utils.toArray<HTMLElement>('[data-passo-chuva]')
      const rota = ref.current!.querySelector<SVGPathElement>('[data-rota]')!
      const comp = rota.getTotalLength()
      gsap.set(rota, { strokeDasharray: comp, strokeDashoffset: comp })

      if (reduzirMovimento()) {
        // estado final, sem movimento: area visivel, alerta e rota desenhada
        gsap.set('[data-area]', { opacity: 1 })
        gsap.set(rota, { strokeDashoffset: 0 })
        gsap.set(passos, { opacity: 1 })
        return
      }
      gsap.set(passos, { opacity: 0.6 }) // 0.6 sobre o fundo escuro ainda passa AA
      gsap.set('[data-alerta]', { autoAlpha: 0, y: 24 })
      gsap.to('[data-pulso]', { attr: { r: 112 }, opacity: 0.05, duration: 1.4, repeat: -1, ease: 'sine.out' })

      // a historia avanca com o scroll: chove, a area acende, o alerta chega, a rota aparece
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 65%', end: 'bottom 75%', scrub: 0.8 } })
      const est = { i: 0 }
      tl.to(est, { i: 1, duration: 1, onUpdate: () => (intensidade.current = est.i) }, 0)
        .to(passos[0], { opacity: 1, duration: 0.3 }, 0)
        .to('[data-area]', { opacity: 1, duration: 0.6 }, 0.8)
        .to(passos[1], { opacity: 1, duration: 0.3 }, 0.8)
        .to('[data-alerta]', { autoAlpha: 1, y: 0, duration: 0.6 }, 1.5)
        .to(passos[2], { opacity: 1, duration: 0.3 }, 1.5)
        .to(rota, { strokeDashoffset: 0, duration: 1 }, 2.1)
        .to(passos[3], { opacity: 1, duration: 0.3 }, 2.1)
    },
    { scope: ref },
  )

  return (
    <section ref={ref} data-secao="Enchente" aria-labelledby="enchente-titulo" className="bg-noite py-24 text-papel">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">Alerta de enchente</p>
          <RevealLinhas como="h2" id="enchente-titulo" linhas={[enchente.titulo]} className="mt-3 font-display text-display-lg font-semibold" />
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-papel/85">{enchente.texto}</p>
          <ol className="mt-8 space-y-3">
            {enchente.passos.map((p, i) => (
              <li key={p} data-passo-chuva className="flex items-center gap-3 text-lg font-semibold">
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-papel/10 font-display text-base">{i + 1}</span>
                {p}
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-papel/65">{enchente.fonte}</p>
        </div>

        <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
          <Mapa />
          <Chuva intensidade={intensidade} />
          <div data-alerta className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-alerta p-4 shadow-2xl sm:left-auto sm:w-80">
            <IconeChuva className="size-8 shrink-0" />
            <p className="text-base font-bold leading-snug">
              {enchente.alerta} <span className="font-semibold">{enchente.abrigo}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
