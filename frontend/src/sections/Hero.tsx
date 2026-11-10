import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bolha, CelularMock, Digitando } from '../components/CelularMock'
import { IconeChuva, IconeCalendario, IconeMic, IconeSeta } from '../components/Icones'
import { gsap, reduzirMovimento, useGSAP } from '../components/motion/gsap'
import { Magnetic } from '../components/motion/Magnetic'
import { RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'

const { hero } = SITE

/**
 * Conversa que se "digita" sozinha: mostra o produto funcionando antes de qualquer explicacao.
 * Com reduced-motion a conversa inteira aparece de uma vez.
 */
function ChatAutomatico() {
  const [visiveis, setVisiveis] = useState(() => (reduzirMovimento() ? hero.chat.length : 1))
  const [digitando, setDigitando] = useState(false)

  useEffect(() => {
    if (reduzirMovimento()) return
    let cancelado = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const rodar = (i: number) => {
      if (cancelado) return
      if (i >= hero.chat.length) {
        // pausa para ler e recomeca do zero
        timers.push(setTimeout(() => { setVisiveis(1); rodar(1) }, 4200))
        return
      }
      const zelo = hero.chat[i].de === 'zelo'
      setDigitando(zelo)
      timers.push(setTimeout(() => {
        setDigitando(false)
        setVisiveis(i + 1)
        timers.push(setTimeout(() => rodar(i + 1), 1300))
      }, zelo ? 1100 : 700))
    }
    // a primeira mensagem ja nasce visivel (o celular nunca aparece vazio)
    timers.push(setTimeout(() => rodar(1), 1600))
    return () => {
      cancelado = true
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <CelularMock rotulo="Exemplo de conversa da Dona Cida com o Zelo">
      {/* aria-live off: a conversa e ilustrativa e repete; nao deve ficar falando no leitor de tela */}
      <div className="flex flex-col gap-2" aria-live="off">
        {hero.chat.slice(0, visiveis).map((m, i) => (
          <Bolha key={i} de={m.de} className="animate-chegar">
            {m.audio && <IconeMic className="mr-1 inline size-4 align-[-2px] text-petroleo" />}
            {m.texto}
          </Bolha>
        ))}
        {digitando && <Digitando />}
      </div>
    </CelularMock>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (reduzirMovimento()) return
      // cartoes flutuam devagar (vida) e se deslocam em velocidades diferentes no scroll (profundidade)
      gsap.utils.toArray<HTMLElement>('[data-flutua]').forEach((el, i) => {
        gsap.to(el, { y: i % 2 ? -10 : 10, duration: 2.6 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.to(el, { yPercent: i % 2 ? -120 : -60, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } })
      })
      gsap.from('[data-hero-entra]', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.55 })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} data-secao="Início" aria-labelledby="hero-titulo" className="relative overflow-hidden bg-papel pt-24">
      {/* grade sutil de "papel milimetrado": editorial, sem gradiente generico */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(15_92_87/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(15_92_87/0.07)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 lg:grid-cols-[1.35fr_1fr] lg:pb-28 lg:pt-16">
        <div>
          <p data-hero-entra className="inline-flex items-center gap-2 rounded-full border border-tinta/15 bg-white px-3 py-1 text-sm font-semibold text-tinta">
            <span aria-hidden className="size-2 rounded-full bg-ambar" /> {hero.selo}
          </p>
          <RevealLinhas
            como="h1"
            id="hero-titulo"
            imediato
            linhas={hero.titulo}
            className="mt-6 font-display text-display-xl font-semibold text-tinta"
            classeLinha={(i) => (i === hero.enfase ? 'italic text-petroleo' : '')}
          />
          <p data-hero-entra className="mt-7 max-w-xl text-lg leading-relaxed text-tinta/85 sm:text-xl">{hero.subtitulo}</p>
          <div data-hero-entra className="mt-9 flex flex-wrap items-center gap-4">
            <Magnetic className="rounded-full">
              <Link to="/demo" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-petroleo px-7 text-lg font-bold text-white shadow-lg shadow-petroleo/25 hover:bg-petroleo-escuro">
                {hero.ctaPrincipal} <IconeSeta className="size-5" />
              </Link>
            </Magnetic>
            <Link to="/como-funciona" className="inline-flex min-h-14 items-center rounded-full text-lg font-bold text-tinta underline sm:px-5 decoration-ambar decoration-2 underline-offset-8 hover:decoration-4">
              {hero.ctaSecundario}
            </Link>
          </div>
        </div>

        <div className="relative">
          <ChatAutomatico />
          {/* cartoes decorativos: repetem o que o chat ja diz, entao ficam fora do leitor de tela */}
          <div aria-hidden data-flutua className="absolute -left-2 top-16 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-tinta shadow-xl ring-1 ring-tinta/5 sm:flex lg:-left-16">
            <span className="flex size-8 items-center justify-center rounded-full bg-petroleo/10 text-petroleo"><IconeCalendario className="size-5" /></span>
            {hero.cartoes[0]}
          </div>
          <div aria-hidden data-flutua className="absolute -right-2 bottom-24 hidden items-center gap-2 rounded-2xl bg-alerta px-4 py-3 text-sm font-bold text-white shadow-xl sm:flex lg:-right-10">
            <IconeChuva className="size-5" />
            {hero.cartoes[1]}
          </div>
        </div>
      </div>
    </section>
  )
}
