import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../content/site'
import { LetraGrande } from './LetraGrande'
import { MenuLateral } from './MenuLateral'
import { Cursor } from './motion/Cursor'
import { SmoothScroll } from './motion/SmoothScroll'
import { SetasSecao } from './SetasSecao'

/** Barra superior do celular (< 768px): so marca e letra grande; a navegacao fica no menu inferior. */
export function TopoCelular() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-papel/95 px-4 py-2 backdrop-blur md:hidden">
      <Link to="/" aria-label="Zelo, página inicial" className="flex min-h-11 items-center gap-2 rounded-lg">
        <svg viewBox="0 0 64 64" className="size-8 animate-respirar" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#0f5c57" />
          <path d="M20 22h24L22 42h22" fill="none" stroke="#f2b84b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span aria-hidden className="font-display text-xl font-bold">{SITE.marca}</span>
      </Link>
      <LetraGrande compacto />
    </header>
  )
}

/**
 * Moldura das paginas de APRESENTACAO (Inicio, Como funciona, Demonstracao): menu lateral recolhivel,
 * barra de progresso da leitura, cursor e scroll com inercia. `setas` liga a navegacao por secoes.
 * `suave=false` nas telas de produto (ex.: /demo): o Lenis captura a roda do mouse dos paineis internos.
 */
export function Apresentacao({ children, largo = false, suave = true, setas = false, centralizar = false }: { children: ReactNode; largo?: boolean; suave?: boolean; setas?: boolean; centralizar?: boolean }) {
  const barra = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const aoRolar = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      // progresso via transform (barato para o navegador), nunca width
      if (barra.current) barra.current.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`
    }
    // primeira leitura de layout no proximo quadro: evita reflow forcado durante a montagem
    const primeiro = requestAnimationFrame(aoRolar)
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      cancelAnimationFrame(primeiro)
      window.removeEventListener('scroll', aoRolar)
    }
  }, [])

  const largura = largo ? 'max-w-[1600px]' : 'max-w-7xl'
  return (
    <div className="min-h-dvh bg-papel">
      {suave && <SmoothScroll />}
      <Cursor />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-24 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ambar focus:px-4 focus:py-2 focus:font-bold">
        Pular para o conteúdo
      </a>
      <div aria-hidden className="fixed inset-x-0 top-0 z-[55] h-1">
        <div ref={barra} className="h-full origin-left scale-x-0 bg-ambar" />
      </div>
      <MenuLateral>
        <TopoCelular />
        {/* centralizar: telas de painel (ex.: /demo) ficam no meio da altura disponivel em telas grandes */}
        <main id="conteudo" className={centralizar ? 'flex flex-1 flex-col justify-center' : 'flex-1'}>{children}</main>
        <footer className="bg-noite text-papel/80">
          <div className={`mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm ${largura}`}>
            <p>
              <strong className="font-display text-base text-papel">{SITE.marca}</strong> · {SITE.conceito} · Global Solution FIAP 2026
            </p>
            <p>{SITE.rodape.dados}</p>
          </div>
        </footer>
      </MenuLateral>
      {setas && <SetasSecao />}
    </div>
  )
}
