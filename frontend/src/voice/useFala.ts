import { useCallback, useEffect } from 'react'

const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Texto → voz (speechSynthesis) em pt-BR. Sem suporte, `falar` simplesmente nao faz nada. */
export function useFala() {
  // Cancela a fala ao sair da tela, para o audio nao continuar tocando em outra pagina.
  useEffect(() => () => void (suportado && window.speechSynthesis.cancel()), [])

  const falar = useCallback((texto: string) => {
    if (!suportado) return
    window.speechSynthesis.cancel()
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = 'pt-BR'
    fala.rate = 0.9 // um pouco mais devagar: quem le com dificuldade tambem costuma ouvir com calma
    const voz = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt-br'))
    if (voz) fala.voice = voz
    window.speechSynthesis.speak(fala)
  }, [])

  const parar = useCallback(() => suportado && window.speechSynthesis.cancel(), [])

  return { suportado, falar, parar }
}
