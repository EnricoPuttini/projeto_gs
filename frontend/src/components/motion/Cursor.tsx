import { useEffect, useRef } from 'react'
import { gsap, ponteiroFino, reduzirMovimento } from './gsap'

const CLICAVEL = 'a, button, [role="button"], [data-cursor], summary, label, select'
const TEXTO = 'input, textarea, [contenteditable="true"]'

/**
 * Circulo verde que segue o mouse (mix-blend-difference) e cresce sobre o que e clicavel.
 * E um ACRESCIMO: o cursor nativo nunca e escondido. Some sobre campos de texto (onde o cursor
 * de digitacao importa) e nao existe em toque nem com reduced-motion.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !ponteiroFino() || reduzirMovimento()) return
    const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' })

    const mover = (e: PointerEvent) => {
      x(e.clientX)
      y(e.clientY)
      const alvo = e.target as Element | null
      const sobreTexto = !!alvo?.closest(TEXTO)
      const sobreClicavel = !sobreTexto && !!alvo?.closest(CLICAVEL)
      gsap.to(el, { scale: sobreClicavel ? 2.6 : 1, opacity: sobreTexto ? 0 : 1, duration: 0.25, overwrite: 'auto' })
    }
    const sair = () => gsap.to(el, { opacity: 0, duration: 0.2 })
    window.addEventListener('pointermove', mover, { passive: true })
    document.addEventListener('pointerleave', sair)
    return () => {
      window.removeEventListener('pointermove', mover)
      document.removeEventListener('pointerleave', sair)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] -ml-3 -mt-3 size-6 rounded-full bg-[#5fd3c8] opacity-0 mix-blend-difference"
    />
  )
}
