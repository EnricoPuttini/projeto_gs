import type { ReactNode } from 'react'

/**
 * Celular ilustrativo das paginas de apresentacao (HTML, nao imagem: o texto fica nitido e legivel
 * por leitor de tela). Nao e o app de verdade — esse vive em /cidadao.
 */
export function CelularMock({ children, rotulo, className = '', escuro = false }: { children: ReactNode; rotulo: string; className?: string; escuro?: boolean }) {
  return (
    <figure aria-label={rotulo} className={`relative mx-auto w-[min(100%,18rem)] sm:w-[min(100%,20rem)] ${className}`}>
      <div className="rounded-[2.6rem] bg-tinta p-2.5 shadow-[0_30px_80px_-20px_rgb(11_36_34/0.55)] ring-1 ring-black/40">
        <div className={`relative flex aspect-[9/16] flex-col overflow-hidden rounded-[2.1rem] ${escuro ? 'bg-noite' : 'bg-[#e6efe9]'}`}>
          <div aria-hidden className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-tinta" />
          <div className="flex items-center gap-2 bg-petroleo px-4 pb-3 pt-9 text-white">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-ambar font-display text-base font-bold text-tinta">Z</span>
            <span>
              <span className="block text-sm font-bold leading-tight">Zelo</span>
              <span className="block text-xs text-white/85">assistente da Dona Cida</span>
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-2 p-3">{children}</div>
        </div>
      </div>
    </figure>
  )
}

export function Bolha({ de, children, className = '' }: { de: 'zelo' | 'cida'; children: ReactNode; className?: string }) {
  return (
    <div className={`flex ${de === 'cida' ? 'justify-end' : 'justify-start'} ${className}`}>
      <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm ${de === 'cida' ? 'rounded-br-sm bg-[#d4efc9]' : 'rounded-bl-sm bg-white'} text-tinta`}>
        <span className="sr-only">{de === 'cida' ? 'Dona Cida: ' : 'Zelo: '}</span>
        {children}
      </p>
    </div>
  )
}

/** Indicador "digitando…" (tres pontos). Decorativo. */
export function Digitando() {
  return (
    <div aria-hidden className="flex w-14 items-center justify-center gap-1 rounded-2xl rounded-bl-sm bg-white py-3 shadow-sm">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-petroleo/60" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}
