import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SITE } from '../content/site'
import { LetraGrande } from './LetraGrande'
import { Cursor } from './motion/Cursor'
import { SmoothScroll } from './motion/SmoothScroll'

const LINKS = [
  { para: '/', rotulo: 'Início' },
  { para: '/como-funciona', rotulo: 'Como funciona' },
  { para: '/demo', rotulo: 'Demonstração' },
  { para: '/ubs', rotulo: 'Painel da UBS' },
  { para: '/cidadao', rotulo: 'App do cidadão' },
]

/** Logo com pulso suave: o "batimento" do cuidado. O pulso some com reduced-motion (CSS global). */
export function MarcaViva({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex size-9 shrink-0">
        <svg viewBox="0 0 64 64" className="relative size-9 animate-respirar" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#0f5c57" />
          <path d="M20 22h24L22 42h22" fill="none" stroke="#f2b84b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`font-display text-2xl font-bold ${claro ? 'text-white' : 'text-tinta'}`}>{SITE.marca}</span>
    </span>
  )
}

/**
 * Moldura das paginas de APRESENTACAO (Inicio, Como funciona, Demonstracao): scroll com inercia,
 * cursor, navegacao que fica solida ao rolar e mostra em que secao a pessoa esta.
 * Secoes marcam-se com data-secao="Nome" para aparecer no indicador.
 */
export function Apresentacao({ children, largo = false, suave = true }: { children: ReactNode; largo?: boolean; suave?: boolean }) {
  const [rolou, setRolou] = useState(false)
  const [secao, setSecao] = useState<string | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const barra = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const aoRolar = () => {
      setRolou(window.scrollY > 24)
      const total = document.documentElement.scrollHeight - window.innerHeight
      // progresso via transform (barato para o navegador), nunca width
      if (barra.current) barra.current.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`
    }
    // primeira leitura de layout no proximo quadro: evita reflow forcado durante a montagem
    const primeiro = requestAnimationFrame(aoRolar)
    window.addEventListener('scroll', aoRolar, { passive: true })

    // secao ativa = a que cruza a linha do meio da tela
    const obs = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setSecao((e.target as HTMLElement).dataset.secao ?? null)),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll<HTMLElement>('[data-secao]').forEach((s) => obs.observe(s))
    return () => {
      cancelAnimationFrame(primeiro)
      window.removeEventListener('scroll', aoRolar)
      obs.disconnect()
    }
  }, [])

  const largura = largo ? 'max-w-[1600px]' : 'max-w-7xl'
  return (
    <div className="flex min-h-dvh flex-col bg-papel">
      {/* suave=false nas telas de produto (ex.: /demo): o Lenis captura a roda do mouse e travava os paineis internos */}
      {suave && <SmoothScroll />}
      <Cursor />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ambar focus:px-4 focus:py-2 focus:font-bold">
        Pular para o conteúdo
      </a>
      <header className={`fixed inset-x-0 top-0 z-50 ${menuAberto ? 'bg-papel' : ''} transition-[background-color,box-shadow] duration-300 ${rolou ? 'bg-papel/95 shadow-[0_1px_0_rgb(15_92_87/0.12)] backdrop-blur' : 'bg-transparent'}`}>
        <div className={`mx-auto flex items-center gap-3 px-4 py-2 ${largura}`}>
          <Link to="/" aria-label="Zelo, página inicial" className="flex min-h-11 shrink-0 items-center rounded-lg">
            <MarcaViva />
          </Link>
          {secao && secao !== 'Início' && (
            <span aria-hidden className="hidden whitespace-nowrap rounded-full bg-tinta px-3 py-1 text-sm font-semibold text-papel lg:inline">
              {secao}
            </span>
          )}
          {/* celular: menu recolhido (5 links nao cabem em 360px sem rolagem horizontal) */}
          <button
            type="button"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            onClick={() => setMenuAberto(!menuAberto)}
            className="ml-auto min-h-11 rounded-full bg-tinta px-4 text-base font-bold text-papel md:hidden"
          >
            {menuAberto ? 'Fechar' : 'Menu'}
          </button>
          <nav
            id="menu-principal"
            aria-label="Principal"
            className={`${menuAberto ? 'block' : 'hidden'} absolute inset-x-0 top-full border-b border-tinta/10 bg-papel p-3 shadow-lg md:static md:ml-auto md:block md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          >
            <ul className="flex flex-col gap-1 md:flex-row">
              {LINKS.map((l) => (
                <li key={l.para}>
                  <NavLink
                    to={l.para}
                    end={l.para === '/'}
                    onClick={() => setMenuAberto(false)}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 text-base font-semibold transition-colors ${
                        isActive ? 'bg-tinta text-papel' : 'text-tinta hover:bg-tinta/5'
                      }`
                    }
                  >
                    {l.rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden shrink-0 md:block">
            <LetraGrande />
          </div>
        </div>
        <div aria-hidden className="h-0.5 bg-transparent">
          <div ref={barra} className="h-full origin-left scale-x-0 bg-ambar" />
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="bg-noite text-papel/80">
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm ${largura}`}>
          <p>
            <strong className="font-display text-base text-papel">{SITE.marca}</strong> · {SITE.conceito} · Global Solution FIAP 2026
          </p>
          <p>{SITE.rodape.dados}</p>
        </div>
      </footer>
    </div>
  )
}
