import { useRef } from 'react'
import { gsap, reduzirMovimento, useGSAP } from './gsap'

/**
 * Faixa infinita de palavras. O conteudo e duplicado (copia escondida de leitor de tela) e a faixa
 * anda -50%, o que fecha o loop sem emenda. No hover desacelera (convite a ler); com reduced-motion fica parada.
 */
export function Marquee({ itens, className = '' }: { itens: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (reduzirMovimento()) return
      const trilho = ref.current!.querySelector('[data-trilho]')
      const anim = gsap.to(trilho, { xPercent: -50, ease: 'none', duration: 28, repeat: -1, scrollTrigger: { trigger: ref.current, toggleActions: 'play pause resume pause' } })
      const devagar = () => gsap.to(anim, { timeScale: 0.25, duration: 0.6 })
      const normal = () => gsap.to(anim, { timeScale: 1, duration: 0.6 })
      ref.current!.addEventListener('pointerenter', devagar)
      ref.current!.addEventListener('pointerleave', normal)
    },
    { scope: ref },
  )
  const faixa = (copia: boolean) => (
    <ul aria-hidden={copia || undefined} className="flex shrink-0 items-center">
      {itens.map((t) => (
        <li key={t} className="flex items-center whitespace-nowrap px-6 font-display text-display-md font-semibold">
          {t}
          <span aria-hidden className="ml-12 inline-block size-3 rotate-45 bg-ambar" />
        </li>
      ))}
    </ul>
  )
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <p className="sr-only">Temas do Zelo: {itens.join(', ')}.</p>
      <div data-trilho className="flex w-max" aria-hidden>
        {faixa(false)}
        {faixa(true)}
      </div>
    </div>
  )
}
