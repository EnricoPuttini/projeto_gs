import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/cliente'
import { alertasAtivos, buscarPaciente, enviarMensagem, historico, ofertasPendentes } from '../api/endpoints'
import type { Acao } from '../api/tipos'
import { AlertaTelaCheia } from '../components/AlertaTelaCheia'
import { Carregando, Erro, Vazio } from '../components/Estados'
import { IconeEnviar, IconeMic, IconeSom } from '../components/Icones'
import { LetraGrande } from '../components/LetraGrande'
import { MeusLocais } from '../components/MeusLocais'
import { OfertaCard } from '../components/OfertaCard'
import { usePolling } from '../hooks/usePolling'
import { usePreferencia } from '../hooks/usePreferencia'
import { useFala } from '../voice/useFala'
import { useReconhecimento } from '../voice/useReconhecimento'

const INTERVALO_MS = 3000

/** App da Dona Cida: conversa estilo WhatsApp, com voz de entrada e saida. Mobile-first. */
export default function Cidadao({ embutido = false }: { embutido?: boolean }) {
  const [params] = useSearchParams()
  const pacienteId = Number(params.get('paciente') ?? 1)

  const paciente = usePolling(() => buscarPaciente(pacienteId), 60_000, pacienteId)
  const mensagens = usePolling(() => historico(pacienteId), INTERVALO_MS, pacienteId)
  const ofertas = usePolling(() => ofertasPendentes(pacienteId), INTERVALO_MS, pacienteId)
  const alertas = usePolling(() => alertasAtivos(pacienteId), INTERVALO_MS, pacienteId)
  const [aba, setAba] = useState<'conversa' | 'locais'>('conversa')

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [lerEmVozAlta, setLerEmVozAlta] = usePreferencia('ler-em-voz-alta', true)
  const fala = useFala()
  const fim = useRef<HTMLDivElement>(null)
  const jaFalados = useRef<Set<number> | null>(null)

  async function enviar(conteudo: string) {
    const limpo = conteudo.trim()
    if (!limpo || enviando) return
    setEnviando(true)
    setErroEnvio(null)
    setTexto('')
    try {
      const resposta = await enviarMensagem(pacienteId, limpo)
      setAcoes(resposta.acoes)
    } catch (e) {
      setErroEnvio(e instanceof ApiError ? e.message : 'Não consegui enviar. Tente de novo.')
      setTexto(limpo) // devolve o texto para a pessoa nao ter que digitar tudo outra vez
    } finally {
      setEnviando(false)
      mensagens.atualizar()
      ofertas.atualizar()
    }
  }

  const voz = useReconhecimento((falado) => void enviar(falado))

  const lista = useMemo(() => mensagens.dados ?? [], [mensagens.dados])

  // Le em voz alta so o que chega DEPOIS de abrir a tela (o historico antigo nao deve ser narrado).
  useEffect(() => {
    if (!mensagens.dados) return
    if (jaFalados.current === null) {
      jaFalados.current = new Set(lista.map((m) => m.id))
      return
    }
    for (const m of lista) {
      if (m.direcao === 'SAIDA' && !jaFalados.current.has(m.id)) {
        jaFalados.current.add(m.id)
        if (lerEmVozAlta) fala.falar(m.texto)
      }
    }
  }, [lista, mensagens.dados, lerEmVozAlta, fala])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lista.length, ofertas.dados?.length])

  const oferta = ofertas.dados?.[0]
  const alerta = alertas.dados?.[0]
  const nome = paciente.dados?.nome.split(' ')[0] ?? ''

  return (
    <div className={`relative mx-auto flex flex-col bg-[#e6efe9] ${embutido ? 'h-full' : 'h-dvh max-w-md'}`}>
      <header className="flex items-center justify-between gap-2 bg-petroleo px-4 py-3 text-white">
        <div>
          <h1 className="text-xl font-extrabold leading-tight">Zelo</h1>
          <p className="text-sm text-white/90">{nome ? `Conversa com ${nome}` : 'Seu assistente de saúde'}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={lerEmVozAlta}
            aria-label="Ler as respostas em voz alta"
            onClick={() => {
              if (lerEmVozAlta) fala.parar()
              setLerEmVozAlta(!lerEmVozAlta)
            }}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-white px-2 ${lerEmVozAlta ? 'bg-white text-petroleo' : 'text-white'}`}
          >
            <IconeSom />
          </button>
          <LetraGrande claro />
        </div>
      </header>

      <div role="tablist" aria-label="Seções" className="grid grid-cols-2 bg-petroleo-escuro">
        {([['conversa', 'Conversa'], ['locais', 'Meus locais']] as const).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`min-h-12 text-lg font-bold ${aba === id ? 'border-b-4 border-ambar bg-petroleo text-white' : 'text-white/80'}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'locais' ? (
        <MeusLocais pacienteId={pacienteId} />
      ) : (
      <>
      <main className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite" aria-label="Conversa">
        {mensagens.carregando && <Carregando texto="Abrindo a conversa…" />}
        {mensagens.erro && !mensagens.dados && <Erro mensagem={mensagens.erro} aoTentar={mensagens.atualizar} />}
        {mensagens.dados && lista.length === 0 && (
          <Vazio>Oi! Eu sou o Zelo. Toque no microfone e fale comigo, ou escreva abaixo.</Vazio>
        )}

        {lista.map((m) => (
          <div key={m.id} className={`flex ${m.direcao === 'ENTRADA' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-lg leading-snug shadow-sm ${
                m.direcao === 'ENTRADA' ? 'rounded-br-sm bg-[#d4efc9]' : 'rounded-bl-sm bg-white'
              }`}
            >
              <span className="sr-only">{m.direcao === 'ENTRADA' ? 'Você disse: ' : 'Zelo disse: '}</span>
              {m.texto}
              {m.direcao === 'SAIDA' && fala.suportado && (
                <button
                  type="button"
                  aria-label="Ouvir esta mensagem"
                  onClick={() => fala.falar(m.texto)}
                  className="mt-1 flex min-h-11 items-center gap-1 rounded-lg px-2 text-base font-semibold text-petroleo"
                >
                  <IconeSom /> Ouvir
                </button>
              )}
            </div>
          </div>
        ))}

        {oferta && (
          <OfertaCard
            oferta={oferta}
            aoResponder={() => {
              mensagens.atualizar()
              ofertas.atualizar()
            }}
          />
        )}
        {enviando && <Carregando texto="O Zelo está pensando…" />}
        <div ref={fim} />
      </main>

      {mensagens.erro && mensagens.dados && (
        <p role="alert" className="bg-alerta px-3 py-2 text-base font-medium text-white">
          {mensagens.erro}
        </p>
      )}
      {erroEnvio && (
        <p role="alert" className="bg-alerta px-3 py-2 text-base font-medium text-white">
          {erroEnvio}
        </p>
      )}
      {voz.erro && (
        <p role="alert" className="bg-ambar px-3 py-2 text-base font-medium text-tinta">
          {voz.erro}
        </p>
      )}

      {acoes.length > 0 && !oferta && (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {acoes.map((a) => (
            <button
              key={a.rotulo}
              type="button"
              disabled={enviando}
              onClick={() => {
                setAcoes([])
                void enviar(a.texto)
              }}
              className="min-h-11 rounded-full border-2 border-petroleo bg-white px-4 text-base font-bold text-petroleo disabled:opacity-50"
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2 bg-fundo p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void enviar(texto)
        }}
      >
        {voz.suportado && (
          <button
            type="button"
            aria-label={voz.ouvindo ? 'Parar de ouvir' : 'Falar com o Zelo'}
            aria-pressed={voz.ouvindo}
            onClick={voz.ouvindo ? voz.parar : voz.iniciar}
            disabled={enviando}
            className={`flex size-14 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50 ${
              voz.ouvindo ? 'animate-pulse bg-alerta' : 'bg-petroleo'
            }`}
          >
            <IconeMic />
          </button>
        )}
        <label className="flex-1">
          <span className="sr-only">Escreva sua mensagem</span>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={voz.ouvindo ? 'Estou ouvindo…' : 'Escreva aqui'}
            maxLength={500}
            autoComplete="off"
            className="min-h-12 w-full rounded-full border-2 border-petroleo/40 bg-white px-4 text-lg"
          />
        </label>
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={enviando || !texto.trim()}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ambar text-tinta disabled:opacity-40"
        >
          <IconeEnviar />
        </button>
      </form>
      </>
      )}

      {alerta && <AlertaTelaCheia alerta={alerta} embutido={embutido} aoConfirmar={() => { alertas.atualizar(); mensagens.atualizar() }} />}
    </div>
  )
}
