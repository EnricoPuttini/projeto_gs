import type { ReactNode } from 'react'
import { IconeInfo } from './Icones'

/**
 * "O que e isso?" ao lado de cada dado. Usa <details>/<summary> nativos: funciona com teclado e leitor
 * de tela sem JavaScript extra, e o texto fica na pagina (busca do navegador e impressao encontram).
 */
export function Info({ titulo = 'O que é isso?', children, claro = false }: { titulo?: string; children: ReactNode; claro?: boolean }) {
  return (
    <details className="group mt-1">
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold underline-offset-4 hover:underline ${
          claro ? 'text-white/90' : 'text-petroleo'
        }`}
      >
        <IconeInfo className="size-4" />
        {titulo}
      </summary>
      <div className={`mt-1 rounded-xl p-3 text-sm leading-relaxed ${claro ? 'bg-white/10 text-white' : 'bg-fundo text-tinta'}`}>{children}</div>
    </details>
  )
}
