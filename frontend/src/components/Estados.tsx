import type { ReactNode } from 'react'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 p-4 text-petroleo">
      <span aria-hidden className="size-5 animate-spin rounded-full border-4 border-petroleo/30 border-t-petroleo" />
      <span className="text-base font-medium">{texto}</span>
    </div>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-petroleo/30 p-4 text-base text-tinta/80">{children}</p>
}

export function Erro({ mensagem, aoTentar }: { mensagem: string; aoTentar?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-alerta bg-white p-4 text-base">
      <span className="font-medium text-alerta">{mensagem}</span>
      {aoTentar && (
        <button
          type="button"
          onClick={aoTentar}
          className="min-h-11 rounded-lg bg-alerta px-4 font-semibold text-white"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}
