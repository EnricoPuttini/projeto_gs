import { useState } from 'react'
import { aceitarOferta, recusarOferta } from '../api/endpoints'
import { ApiError } from '../api/cliente'
import { formatarDataHora, mmss } from '../api/formato'
import type { OfertaDetalhe } from '../api/tipos'
import { useContagem } from '../hooks/useContagem'
import { IconeRelogio } from './Icones'

/** Cartao da vaga oferecida, com contagem regressiva. Os botoes chamam a mesma regra que a conversa por voz. */
export function OfertaCard({ oferta, aoResponder }: { oferta: OfertaDetalhe; aoResponder: () => void }) {
  const restantes = useContagem(oferta.segundosRestantes, oferta.id)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const urgente = restantes <= 120

  async function responder(acao: 'aceitar' | 'recusar') {
    setOcupado(true)
    setErro(null)
    try {
      await (acao === 'aceitar' ? aceitarOferta(oferta.id) : recusarOferta(oferta.id))
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não deu certo. Tente de novo.')
    } finally {
      setOcupado(false)
      aoResponder()
    }
  }

  return (
    <section aria-label="Vaga disponível para você" className="rounded-2xl border-2 border-ambar bg-white p-4 shadow-md">
      <h2 className="text-lg font-extrabold text-petroleo">Vaga para você!</h2>
      <p className="mt-1 text-lg font-semibold">{oferta.especialidade}</p>
      <p className="text-base">{formatarDataHora(oferta.dataHoraVaga)}</p>
      <p className="text-base text-tinta/80">{oferta.ubsNome}</p>

      <p
        role="timer"
        aria-label={`Tempo para responder: ${mmss(restantes)}`}
        className={`mt-3 flex items-center gap-2 text-2xl font-extrabold tabular-nums ${urgente ? 'text-alerta' : 'text-petroleo'}`}
      >
        <IconeRelogio /> {mmss(restantes)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={ocupado || restantes === 0}
          onClick={() => void responder('aceitar')}
          className="min-h-14 rounded-xl bg-petroleo px-3 text-lg font-extrabold text-white disabled:opacity-50"
        >
          Quero a vaga
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void responder('recusar')}
          className="min-h-14 rounded-xl border-2 border-petroleo bg-white px-3 text-lg font-bold text-petroleo disabled:opacity-50"
        >
          Não posso
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-2 text-base font-medium text-alerta">
          {erro}
        </p>
      )}
    </section>
  )
}
