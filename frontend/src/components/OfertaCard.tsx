import { useRef, useState } from 'react'
import { aceitarOferta, recusarOferta } from '../api/endpoints'
import { ApiError } from '../api/cliente'
import { formatarDataHora, mmss } from '../api/formato'
import type { OfertaDetalhe } from '../api/tipos'
import { avisarVagaAceita } from '../eventos'
import { useContagem } from '../hooks/useContagem'
import { confete } from './motion/Confetti'

const VALIDADE_S = 15 * 60

/**
 * Anel de contagem regressiva: o tempo que falta e visto de relance, sem precisar ler numeros.
 * O numero continua no centro (e no role="timer") para quem prefere ler.
 */
function AnelTempo({ restantes, urgente }: { restantes: number; urgente: boolean }) {
  const fracao = Math.max(0, Math.min(1, restantes / VALIDADE_S))
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 100 100" aria-hidden className="size-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(15 92 87 / 0.12)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r="44" fill="none" pathLength={1}
          stroke={urgente ? '#c2410c' : '#0f5c57'} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={1} strokeDashoffset={1 - fracao}
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
        />
      </svg>
      <span
        role="timer"
        aria-label={`Tempo para responder: ${mmss(restantes)}`}
        className={`absolute inset-0 flex items-center justify-center text-xl font-extrabold tabular-nums ${urgente ? 'text-alerta' : 'text-petroleo'}`}
      >
        {mmss(restantes)}
      </span>
    </div>
  )
}

/**
 * Cartao da vaga oferecida. Com `pelaConversa`, os botoes respondem PELO CHAT ("quero a vaga" / "nao posso"): a pessoa ve
 * a confirmacao escrita e os proximos passos, igual a quem responde por voz. Sem ele, chamam a API da oferta direto.
 */
export function OfertaCard({ oferta, aoResponder, pelaConversa }: { oferta: OfertaDetalhe; aoResponder: () => void; pelaConversa?: (texto: string) => Promise<void> }) {
  const restantes = useContagem(oferta.segundosRestantes, oferta.id)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const botaoAceitar = useRef<HTMLButtonElement>(null)
  const urgente = restantes <= 120

  async function responder(acao: 'aceitar' | 'recusar') {
    setOcupado(true)
    setErro(null)
    try {
      if (pelaConversa) {
        await pelaConversa(acao === 'aceitar' ? 'quero a vaga' : 'não posso')
      } else if (acao === 'aceitar') {
        await aceitarOferta(oferta.id)
        // celebracao curta: o alivio de conseguir a consulta (nao acontece com reduced-motion)
        confete(botaoAceitar.current)
        avisarVagaAceita()
      } else {
        await recusarOferta(oferta.id)
      }
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não deu certo. Tente de novo.')
    } finally {
      setOcupado(false)
      aoResponder()
    }
  }

  return (
    <section aria-label="Vaga disponível para você" className="animate-chegar rounded-2xl border-2 border-ambar bg-white p-4 shadow-md">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold text-petroleo">Vaga para você!</h2>
          <p className="mt-1 text-lg font-semibold">{oferta.especialidade}</p>
          <p className="text-base">{formatarDataHora(oferta.dataHoraVaga)}</p>
          <p className="text-base text-tinta/80">{oferta.ubsNome}</p>
        </div>
        <AnelTempo restantes={restantes} urgente={urgente} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          ref={botaoAceitar}
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
