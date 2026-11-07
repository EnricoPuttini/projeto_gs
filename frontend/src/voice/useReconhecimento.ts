import { useCallback, useEffect, useRef, useState } from 'react'

const MENSAGENS_ERRO: Record<string, string> = {
  'not-allowed': 'O microfone está bloqueado. Libere o microfone no navegador ou digite a mensagem.',
  'service-not-allowed': 'O microfone está bloqueado. Libere o microfone no navegador ou digite a mensagem.',
  'no-speech': 'Não ouvi nada. Toque no microfone e fale de novo.',
  'audio-capture': 'Não encontrei um microfone neste aparelho.',
  network: 'Sem internet para entender a voz. Digite a mensagem.',
}

/**
 * Voz → texto com a Web Speech API em pt-BR. Se o navegador nao suporta (Firefox, por exemplo),
 * `suportado` e falso e a tela mostra so o campo de texto: o app continua 100% utilizavel.
 */
export function useReconhecimento(aoReconhecer: (texto: string) => void) {
  const Construtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
  const [ouvindo, setOuvindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ref = useRef<ReconhecimentoVoz | null>(null)
  const callback = useRef(aoReconhecer)
  callback.current = aoReconhecer

  useEffect(() => () => ref.current?.abort(), [])

  const iniciar = useCallback(() => {
    if (!Construtor) return
    setErro(null)
    const rec = new Construtor()
    rec.lang = 'pt-BR'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const texto = e.results[0]?.[0]?.transcript?.trim()
      if (texto) callback.current(texto)
    }
    rec.onerror = (e) => setErro(MENSAGENS_ERRO[e.error] ?? 'Não consegui entender. Tente de novo ou digite.')
    rec.onend = () => setOuvindo(false)
    ref.current = rec
    try {
      rec.start()
      setOuvindo(true)
    } catch {
      setErro('Não consegui ligar o microfone. Digite a mensagem.')
    }
  }, [Construtor])

  const parar = useCallback(() => ref.current?.stop(), [])

  return { suportado: Construtor !== undefined, ouvindo, erro, iniciar, parar }
}
