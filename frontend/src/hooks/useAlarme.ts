import { useCallback, useEffect, useRef, useState } from 'react'
import type { Intensidade } from '../api/tipos'

/**
 * Som e vibracao do alerta conforme a intensidade escolhida pela pessoa:
 * SILENCIOSO = nada; VIBRAR = vibra em loop; ALARME = vibra e toca uma sirene.
 * Navegadores bloqueiam audio sem toque previo do usuario: nesse caso `somBloqueado` fica true e a
 * tela mostra um botao "Ativar som" — o alerta visual continua valendo de qualquer forma.
 */
export function useAlarme(intensidade: Intensidade, ligado: boolean) {
  const [somBloqueado, setSomBloqueado] = useState(false)
  const contexto = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!ligado || intensidade === 'SILENCIOSO') return
    const timers: ReturnType<typeof setInterval>[] = []

    if ('vibrate' in navigator) {
      const vibrar = () => navigator.vibrate([500, 250, 500])
      vibrar()
      timers.push(setInterval(vibrar, 1500))
    }

    if (intensidade === 'ALARME') {
      try {
        const ctx = new AudioContext()
        contexto.current = ctx
        const ganho = ctx.createGain()
        ganho.gain.value = 0
        ganho.connect(ctx.destination)
        const osc = ctx.createOscillator()
        osc.type = 'square'
        osc.connect(ganho)
        osc.start()
        let alto = true
        // Alterna dois tons e liga/desliga o volume: sirene curta e inconfundivel.
        const tocar = () => {
          osc.frequency.value = alto ? 880 : 660
          ganho.gain.value = 0.18
          alto = !alto
          setTimeout(() => (ganho.gain.value = 0.0), 350)
        }
        void ctx.resume().finally(() => setSomBloqueado(ctx.state !== 'running'))
        tocar()
        timers.push(setInterval(tocar, 700))
      } catch {
        setSomBloqueado(true)
      }
    }

    return () => {
      timers.forEach(clearInterval)
      if ('vibrate' in navigator) navigator.vibrate(0)
      void contexto.current?.close()
      contexto.current = null
      setSomBloqueado(false)
    }
  }, [intensidade, ligado])

  const ativarSom = useCallback(() => {
    void contexto.current?.resume().then(() => setSomBloqueado(contexto.current?.state !== 'running'))
  }, [])

  return { somBloqueado, ativarSom }
}
