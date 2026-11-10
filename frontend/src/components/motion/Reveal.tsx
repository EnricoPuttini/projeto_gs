import { useRef } from 'react'
import type { ElementType, ReactNode } from 'react'
import { gsap, reduzirMovimento, useGSAP } from './gsap'

/**
 * Titulo que aparece linha a linha "saindo de uma mascara". Cada linha fica num span com overflow
 * escondido e o texto sobe de baixo. O texto existe no DOM desde o inicio: leitor de tela le tudo,
 * e sem JS/movimento ele simplesmente ja esta la.
 */
export function RevealLinhas({
  linhas,
  como: Tag = 'h2',
  className = '',
  classeLinha = () => '',
  imediato = false,
  id,
}: {
  linhas: ReactNode[]
  /** id do titulo: as secoes usam aria-labelledby apontando para ele */
  id?: string
  como?: ElementType
  className?: string
  classeLinha?: (i: number) => string
  /** true = anima ao montar (hero); false = anima quando entra na tela */
  imediato?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (reduzirMovimento()) return
      gsap.from(ref.current!.querySelectorAll('[data-linha]'), {
        yPercent: 110,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.12,
        delay: imediato ? 0.15 : 0,
        scrollTrigger: imediato ? undefined : { trigger: ref.current, start: 'top 85%', once: true },
      })
    },
    { scope: ref },
  )
  return (
    <Tag ref={ref} id={id} className={className}>
      {linhas.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <span data-linha className={`block ${classeLinha(i)}`}>{l}</span>
        </span>
      ))}
    </Tag>
  )
}

/** Bloco que sobe e aparece ao entrar na tela. `atraso` escalona irmaos. */
export function Reveal({ children, className = '', atraso = 0, como: Tag = 'div' }: { children: ReactNode; className?: string; atraso?: number; como?: ElementType }) {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (reduzirMovimento()) return
      gsap.from(ref.current, {
        y: 32,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: atraso,
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      })
    },
    { scope: ref },
  )
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
