import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, reduzirMovimento, ScrollTrigger } from './gsap'

/**
 * Scroll com inercia (Lenis) SO nas paginas de apresentacao: da o ritmo "cinematografico" aos pins.
 * Sincronizado com o relogio do GSAP para o ScrollTrigger ler a posicao certa a cada quadro.
 * Com reduced-motion fica o scroll nativo.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (reduzirMovimento()) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: { offset: -80 } })
    lenis.on('scroll', ScrollTrigger.update)
    const quadro = (tempo: number) => lenis.raf(tempo * 1000)
    gsap.ticker.add(quadro)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(quadro)
      lenis.destroy()
    }
  }, [])
  return null
}
