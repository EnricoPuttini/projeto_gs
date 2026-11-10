import { useRef } from 'react'
import type { ReactNode } from 'react'
import { gsap, ponteiroFino, reduzirMovimento, useGSAP } from './gsap'

/**
 * O elemento "puxa" levemente na direcao do mouse (CTA magnetico) e tem um brilho que segue o
 * ponteiro. Convida ao clique sem mudar o tamanho da area clicavel. Desligado em toque e reduced-motion.
 */
export function Magnetic({ children, forca = 0.35, className = '' }: { children: ReactNode; forca?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(
    () => {
      const el = ref.current!
      if (!ponteiroFino() || reduzirMovimento()) return
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' })
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' })
      const mover = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        x((e.clientX - (r.left + r.width / 2)) * forca)
        y((e.clientY - (r.top + r.height / 2)) * forca)
        el.style.setProperty('--brilho-x', `${e.clientX - r.left}px`)
        el.style.setProperty('--brilho-y', `${e.clientY - r.top}px`)
      }
      const soltar = () => {
        x(0)
        y(0)
      }
      el.addEventListener('pointermove', mover)
      el.addEventListener('pointerleave', soltar)
      return () => {
        el.removeEventListener('pointermove', mover)
        el.removeEventListener('pointerleave', soltar)
      }
    },
    { scope: ref },
  )
  return (
    <span ref={ref} className={`group/mag relative inline-flex ${className}`}>
      {children}
      {/* brilho radial que acompanha o mouse por cima do botao */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/mag:opacity-100"
        style={{ background: 'radial-gradient(120px circle at var(--brilho-x, 50%) var(--brilho-y, 50%), rgb(255 255 255 / 0.28), transparent 70%)' }}
      />
    </span>
  )
}
