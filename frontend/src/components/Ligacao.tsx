import { useCallback, useEffect, useRef, useState } from 'react'
import { useReconhecimento } from '../voice/useReconhecimento'
import { IconeMic } from './Icones'

type Etapa = 'tocando' | 'falando' | 'ouvindo' | 'pensando' | 'respondendo' | 'fim'

/** Fala o texto em pt-BR e avisa quando terminou (para so entao comecar a ouvir). Sem voz no aparelho: segue em 2 s. */
function falar(texto: string, aoTerminar: () => void) {
  if (!('speechSynthesis' in window)) {
    setTimeout(aoTerminar, 2000)
    return
  }
  const sintese = window.speechSynthesis
  sintese.cancel()
  // So segue (e liga o microfone) quando a voz REALMENTE parou: se o microfone abrir antes, ele ouve o proprio
  // Zelo dizendo "sim ou nao" e responde sozinho. Alguns aparelhos nunca disparam onend, por isso tambem
  // conferimos speechSynthesis.speaking a cada meio segundo, com um limite maximo bem folgado.
  let terminou = false
  const inicio = Date.now()
  const limite = 6000 + texto.length * 140
  const uma = () => {
    if (terminou) return
    terminou = true
    clearInterval(vigia)
    setTimeout(aoTerminar, 450) // folga para o eco do alto-falante sumir
  }
  const vigia = setInterval(() => {
    const passou = Date.now() - inicio
    if ((passou > 1500 && !sintese.speaking && !sintese.pending) || passou > limite) uma()
  }, 500)
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'pt-BR'
  u.rate = 0.88 // mais devagar: quem le com dificuldade costuma ouvir com calma
  const voz = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt-br'))
  if (voz) u.voice = voz
  u.onend = uma
  u.onerror = uma
  sintese.speak(u)
}

/** Toque de telefone (dois bipes) + vibracao enquanto a ligacao nao e atendida. E funcional (avisa que alguem
 * esta ligando), por isso continua mesmo com reduced-motion. */
function useToque(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    let ctx: AudioContext | null = null
    const timers: ReturnType<typeof setInterval>[] = []
    try {
      ctx = new AudioContext()
      const c = ctx
      const bipe = (inicio: number) => {
        const o = c.createOscillator()
        const g = c.createGain()
        o.frequency.value = 520
        g.gain.value = 0.12
        o.connect(g).connect(c.destination)
        o.start(c.currentTime + inicio)
        o.stop(c.currentTime + inicio + 0.35)
      }
      const tocar = () => {
        bipe(0)
        bipe(0.5)
        if ('vibrate' in navigator) navigator.vibrate([350, 150, 350])
      }
      void c.resume()
      tocar()
      timers.push(setInterval(tocar, 2200))
    } catch {
      /* sem audio: a tela de ligacao continua clara */
    }
    return () => {
      timers.forEach(clearInterval)
      if ('vibrate' in navigator) navigator.vibrate(0)
      void ctx?.close()
    }
  }, [ativo])
}

/**
 * "O Zelo liga para voce": para quem nao le mensagens (ex.: pessoa idosa), a vaga chega como LIGACAO.
 * Ela atende com um botao grande, o Zelo FALA a oferta e ela responde FALANDO "sim" — ou tocando
 * nos botoes enormes. A resposta passa pelo mesmo interpretador do assistente (aoResponder).
 */
export function Ligacao({
  nome,
  oferta,
  aoResponder,
  aoEncerrar,
}: {
  nome: string
  oferta: string
  aoResponder: (texto: string) => Promise<{ resposta: string; aceitou: boolean; terminou: boolean }>
  aoEncerrar: (atendeu: boolean) => void
}) {
  const [etapa, setEtapa] = useState<Etapa>('tocando')
  const [legenda, setLegenda] = useState('')
  const [ouvido, setOuvido] = useState('')
  const encerrada = useRef(false)
  useToque(etapa === 'tocando')

  const encerrar = useCallback(
    (atendeu: boolean) => {
      if (encerrada.current) return
      encerrada.current = true
      window.speechSynthesis?.cancel()
      aoEncerrar(atendeu)
    },
    [aoEncerrar],
  )

  const etapaRef = useRef(etapa)
  const falaAtual = useRef(0)
  const dizer = useCallback((texto: string, depois: () => void) => {
    const id = ++falaAtual.current
    falar(texto, () => {
      if (id === falaAtual.current) depois()
    })
  }, [])
  useEffect(() => {
    etapaRef.current = etapa
  }, [etapa])

  const responder = useCallback(
    async (texto: string, porVoz = false) => {
      // pela VOZ so vale na vez da pessoa (senao o microfone pode ter ouvido o proprio Zelo);
      // pelos BOTOES vale a qualquer momento: tocar interrompe a fala, como cortar alguem numa ligacao
      if (etapaRef.current === 'pensando' || etapaRef.current === 'fim' || (porVoz && etapaRef.current !== 'ouvindo')) return
      falaAtual.current++
      window.speechSynthesis?.cancel()
      etapaRef.current = 'pensando'
      setOuvido(texto)
      setEtapa('pensando')
      try {
        const r = await aoResponder(texto)
        setLegenda(r.resposta)
        setEtapa('respondendo')
        dizer(r.resposta, () => {
          if (r.terminou) {
            setEtapa('fim')
            setTimeout(() => encerrar(true), 1200)
          } else {
            setEtapa('ouvindo')
          }
        })
      } catch {
        setLegenda('A ligação caiu. Tente de novo.')
        setEtapa('ouvindo')
      }
    },
    [aoResponder, encerrar, dizer],
  )

  const voz = useReconhecimento((t) => void responder(t, true))
  const vozRef = useRef(voz)
  vozRef.current = voz

  // ao terminar de falar, comeca a ouvir sozinho (como numa ligacao de verdade)
  useEffect(() => {
    if (etapa === 'ouvindo' && vozRef.current.suportado && !vozRef.current.ouvindo) vozRef.current.iniciar()
  }, [etapa])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  function atender() {
    setEtapa('falando')
    const fala = `Alô${nome ? `, ${nome}` : ''}! Aqui é o Zelo. ${oferta} Você quer essa consulta? Pode dizer sim ou não.`
    setLegenda(fala)
    dizer(fala, () => setEtapa('ouvindo'))
  }

  const tocando = etapa === 'tocando'
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="ligacao-titulo" className="absolute inset-0 z-50 flex flex-col bg-noite p-5 text-papel">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span aria-hidden className={`flex size-28 items-center justify-center rounded-full bg-ambar font-display text-5xl font-bold text-tinta ${tocando ? 'animate-pulse' : ''}`}>Z</span>
        <h2 id="ligacao-titulo" className="mt-5 text-3xl font-extrabold">{tocando ? 'Zelo está ligando…' : 'Em ligação com o Zelo'}</h2>
        <p className="mt-1 text-lg text-papel/80">{tocando ? 'Uma vaga de consulta para você' : etapa === 'ouvindo' ? (voz.ouvindo ? 'Estou ouvindo… fale "sim" ou "não"' : 'Responda pelos botões ou pelo microfone') : etapa === 'pensando' ? 'Um instante…' : ''}</p>
        {!tocando && (
          // legenda do que o Zelo esta falando: quem tem dificuldade de ouvir tambem acompanha
          <p aria-live="polite" className="mt-5 rounded-2xl bg-white/10 p-4 text-left text-xl leading-snug">{legenda}</p>
        )}
        {ouvido && !tocando && <p className="mt-3 text-base text-papel/80">Você disse: “{ouvido}”</p>}
        {voz.erro && etapa === 'ouvindo' && <p role="alert" className="mt-3 rounded-lg bg-ambar p-2 text-base font-semibold text-tinta">{voz.erro}</p>}
      </div>

      {tocando ? (
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => encerrar(false)} className="min-h-20 rounded-full bg-alerta text-xl font-extrabold text-white">Recusar</button>
          <button type="button" autoFocus onClick={atender} className="min-h-20 rounded-full bg-emerald-600 text-xl font-extrabold text-white">Atender</button>
        </div>
      ) : etapa === 'fim' ? (
        <p className="pb-6 text-center text-xl font-bold">Ligação encerrada.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={etapa === 'pensando'} onClick={() => void responder('sim, eu quero')} className="min-h-20 rounded-2xl bg-emerald-600 text-2xl font-extrabold text-white disabled:opacity-50">Sim, eu quero</button>
            <button type="button" disabled={etapa === 'pensando'} onClick={() => void responder('não posso')} className="min-h-20 rounded-2xl bg-white text-2xl font-extrabold text-tinta disabled:opacity-50">Não posso</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {voz.suportado && (
              <button type="button" disabled={etapa !== 'ouvindo'} aria-pressed={voz.ouvindo} onClick={voz.ouvindo ? voz.parar : voz.iniciar} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-papel/60 text-base font-bold disabled:opacity-50">
                <IconeMic className="size-5" /> {voz.ouvindo ? 'Ouvindo' : 'Falar'}
              </button>
            )}
            <button type="button" onClick={() => encerrar(true)} className="min-h-12 rounded-xl bg-alerta text-base font-bold text-white">Desligar</button>
          </div>
        </div>
      )}
    </div>
  )
}
