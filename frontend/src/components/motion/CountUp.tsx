import { useEffect, useRef, useState } from 'react'
import { gsap, reduzirMovimento, ScrollTrigger } from './gsap'

/**
 * Numero que conta ate o valor. Duas funcoes:
 * - apresentacao: conta de 0 quando entra na tela (uma vez);
 * - produto: quando o valor MUDA (ex.: vaga recuperada), interpola do anterior ao novo — o olho percebe a mudanca.
 * O valor final fica sempre no DOM num texto sr-only; leitor de tela le o numero certo e nao ouve a contagem.
 */
export function CountUp({
  valor,
  formatar = (n) => Math.round(n).toLocaleString('pt-BR'),
  aoEntrarNaTela = false,
  className = '',
}: {
  valor: number
  formatar?: (n: number) => string
  aoEntrarNaTela?: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const atual = useRef(aoEntrarNaTela ? 0 : valor)
  const [texto, setTexto] = useState(formatar(atual.current))

  useEffect(() => {
    const animar = () => {
      const estado = { n: atual.current }
      return gsap.to(estado, {
        n: valor,
        duration: aoEntrarNaTela ? 1.6 : 0.8,
        ease: 'power2.out',
        onUpdate: () => setTexto(formatar(estado.n)),
        onComplete: () => {
          atual.current = valor
        },
      })
    }
    if (reduzirMovimento() || atual.current === valor) {
      atual.current = valor
      setTexto(formatar(valor))
      return
    }
    if (aoEntrarNaTela) {
      const st = ScrollTrigger.create({ trigger: ref.current, start: 'top 90%', once: true, onEnter: () => void animar() })
      return () => st.kill()
    }
    const t = animar()
    return () => {
      t.kill()
    }
    // formatar e estavel por chamada; reanimar so quando o valor muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, aoEntrarNaTela])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      <span aria-hidden>{texto}</span>
      <span className="sr-only">{formatar(valor)}</span>
    </span>
  )
}
