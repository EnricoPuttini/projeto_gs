import type { ReactNode } from 'react'
import { TopoCelular } from './Apresentacao'
import { MenuLateral } from './MenuLateral'

/** Moldura das telas de PRODUTO no computador (painel da UBS): mesma navegacao, sem efeitos de apresentacao. */
export function Layout({ children, largo = false }: { children: ReactNode; largo?: boolean }) {
  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-24 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ambar focus:px-4 focus:py-2 focus:font-bold">
        Pular para o conteúdo
      </a>
      <MenuLateral>
        <TopoCelular />
        <main id="conteudo" className="flex-1">{children}</main>
        <footer className="border-t border-petroleo/10 bg-white">
          <div className={`mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-tinta/80 ${largo ? 'max-w-[1500px]' : 'max-w-6xl'}`}>
            <p>
              <strong className="text-tinta">Zelo</strong> · Global Solution FIAP 2026 · CitizenTech
            </p>
            <p>Pacientes e telefones fictícios · Modelo de risco treinado em base pública real (Kaggle, 2016)</p>
          </div>
        </footer>
      </MenuLateral>
    </div>
  )
}
