import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LetraGrande } from './LetraGrande'

const LINKS = [
  { para: '/', rotulo: 'Início' },
  { para: '/como-funciona', rotulo: 'Como funciona' },
  { para: '/ubs', rotulo: 'Painel da UBS' },
  { para: '/cidadao', rotulo: 'App do cidadão' },
  { para: '/demo', rotulo: 'Demonstração' },
]

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="size-9 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={claro ? '#ffffff' : '#0f5c57'} />
        <path d="M20 22h24L22 42h22" fill="none" stroke="#f2b84b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`text-2xl font-extrabold tracking-tight ${claro ? 'text-white' : 'text-petroleo'}`}>Zelo</span>
    </span>
  )
}

/** Moldura das paginas de computador: navegacao unica, conteudo e rodape com a origem dos dados. */
export function Layout({ children, largo = false }: { children: ReactNode; largo?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ambar focus:px-4 focus:py-2 focus:font-bold">
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b border-petroleo/10 bg-white/90 backdrop-blur">
        <div className={`mx-auto flex items-center gap-4 px-4 py-2 ${largo ? 'max-w-[1500px]' : 'max-w-6xl'}`}>
          <Link to="/" aria-label="Zelo, página inicial" className="flex min-h-11 shrink-0 items-center rounded-lg">
            <Marca />
          </Link>
          <nav aria-label="Principal" className="min-w-0 flex-1 overflow-x-auto">
            <ul className="flex gap-1">
              {LINKS.map((l) => (
                <li key={l.para}>
                  <NavLink
                    to={l.para}
                    end={l.para === '/'}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-base font-semibold ${
                        isActive ? 'bg-petroleo text-white' : 'text-tinta hover:bg-fundo'
                      }`
                    }
                  >
                    {l.rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden shrink-0 sm:block">
            <LetraGrande />
          </div>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-petroleo/10 bg-white">
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-tinta/80 ${largo ? 'max-w-[1500px]' : 'max-w-6xl'}`}>
          <p>
            <strong className="text-tinta">Zelo</strong> · Global Solution FIAP 2026 · CitizenTech
          </p>
          <p>Pacientes e telefones fictícios · Modelo de risco treinado em base pública real (Kaggle, 2016)</p>
        </div>
      </footer>
    </div>
  )
}
