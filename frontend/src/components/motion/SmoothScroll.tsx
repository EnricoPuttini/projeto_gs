import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, ponteiroFino, reduzirMovimento, ScrollTrigger } from './gsap'

/**
 * Scroll com inercia (Lenis) SO nas paginas de apresentacao: da o ritmo "cinematografico" aos pins.
 * Sincronizado com o relogio do GSAP para o ScrollTrigger ler a posicao certa a cada quadro.
 * Com reduced-motion ou em tela de toque fica o scroll nativo.
 */
// instancia ativa (se houver): as setas de secao rolam por ela para manter a mesma inercia
let lenisAtivo: Lenis | null = null

/** Rola ate o elemento: pelo Lenis se ativo; senao nativo (instantaneo com reduced-motion). */
export function rolarPara(el: Element) {
  if (lenisAtivo) lenisAtivo.scrollTo(el as HTMLElement, { offset: -16 })
  else el.scrollIntoView({ behavior: reduzirMovimento() ? 'auto' : 'smooth', block: 'start' })
}

export function SmoothScroll() {
  useEffect(() => {
    // toque: a inercia ja e nativa; o Lenis so gastaria CPU (medido: ~200 ms de TBT no celular)
    if (reduzirMovimento() || !ponteiroFino()) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: { offset: -80 } })
    lenisAtivo = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const quadro = (tempo: number) => lenis.raf(tempo * 1000)
    gsap.ticker.add(quadro)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(quadro)
      lenis.destroy()
      lenisAtivo = null
    }
  }, [])
  return null
}
