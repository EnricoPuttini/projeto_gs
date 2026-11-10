import { useEffect, useState } from 'react'
import { ApiError } from '../api/cliente'
import { confirmarSeguro } from '../api/endpoints'
import type { AlertaDetalhe } from '../api/tipos'
import { avisarSeguro } from '../eventos'
import { useAlarme } from '../hooks/useAlarme'
import { useFala } from '../voice/useFala'

const ROTULO_NIVEL = { ATENCAO: 'Atenção', ALTO: 'Alerta alto', CRITICO: 'Alerta crítico' } as const

/** Alerta de enchente em tela cheia. So some quando a pessoa toca em "Estou seguro". */
export function AlertaTelaCheia({
  alerta,
  aoConfirmar,
  embutido = false,
}: {
  alerta: AlertaDetalhe
  aoConfirmar: () => void
  embutido?: boolean
}) {
  const { somBloqueado, ativarSom } = useAlarme(alerta.intensidade, true)
  const fala = useFala()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Le o aviso em voz alta (exceto no modo silencioso): quem le com dificuldade ouve o que fazer.
  useEffect(() => {
    if (alerta.intensidade === 'SILENCIOSO') return
    const abrigo = alerta.abrigoNome ? ` Vá para o abrigo ${alerta.abrigoNome}.` : ''
    fala.falar(`Atenção! Vai chover forte perto de ${alerta.localApelido}.${abrigo} Quando estiver seguro, toque em Estou seguro.`)
    // fala muda de identidade a cada render; so queremos falar quando o alerta muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerta.id])

  async function seguro() {
    setEnviando(true)
    setErro(null)
    try {
      await confirmarSeguro(alerta.id)
      avisarSeguro()
      fala.parar()
      aoConfirmar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não consegui avisar. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alerta-titulo"
      data-lenis-prevent
      className={`${embutido ? 'absolute' : 'fixed'} inset-0 z-50 flex flex-col overflow-y-auto bg-alerta p-5 text-white`}
    >
      <p className="text-lg font-bold uppercase tracking-wide">{ROTULO_NIVEL[alerta.nivel]}</p>
      <h2 id="alerta-titulo" className="mt-1 text-4xl font-extrabold leading-tight">
        Vai chover forte perto de {alerta.localApelido}
      </h2>
      <p className="mt-3 text-xl">
        Previsão: cerca de {Math.round(alerta.chuvaMm)} mm nas próximas 3 horas. A rua pode alagar.
      </p>

      <ul className="mt-4 space-y-2 text-xl font-semibold">
        <li>Guarde documentos e remédios em lugar alto.</li>
        <li>Não atravesse água parada.</li>
      </ul>

      {alerta.abrigoNome && (
        <section aria-label="Abrigo mais perto" className="mt-5 rounded-2xl bg-white p-4 text-tinta">
          <p className="text-base font-bold uppercase text-alerta">Abrigo mais perto</p>
          <p className="text-2xl font-extrabold">{alerta.abrigoNome}</p>
          <p className="text-lg">
            {alerta.abrigoEndereco}
            {alerta.abrigoDistanciaMetros !== null && ` · a ${alerta.abrigoDistanciaMetros} metros`}
          </p>
          {alerta.rotaUrl && (
            <a
              href={alerta.rotaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-14 items-center justify-center rounded-xl bg-petroleo px-4 text-xl font-extrabold text-white"
            >
              Abrir a rota no mapa
            </a>
          )}
        </section>
      )}

      {alerta.intensidade === 'SILENCIOSO' && <p className="mt-4 text-base">Aviso silencioso, como você escolheu.</p>}
      {somBloqueado && (
        <button
          type="button"
          onClick={ativarSom}
          className="mt-4 min-h-12 rounded-xl border-2 border-white px-4 text-lg font-bold"
        >
          Tocar o som do alarme
        </button>
      )}

      <div className="mt-auto pt-6">
        {erro && (
          <p role="alert" className="mb-2 rounded-lg bg-white p-2 text-base font-semibold text-alerta">
            {erro}
          </p>
        )}
        <button
          type="button"
          autoFocus
          disabled={enviando}
          onClick={() => void seguro()}
          className="min-h-16 w-full rounded-2xl bg-ambar px-4 text-2xl font-extrabold text-tinta disabled:opacity-60"
        >
          {enviando ? 'Avisando…' : 'Estou seguro'}
        </button>
      </div>
    </div>
  )
}
