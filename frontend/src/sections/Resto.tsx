import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../components/motion/gsap'
import { Ecossistema } from './Ecossistema'
import { Enchente } from './Enchente'
import { Faixa } from './Faixa'
import { Fechamento } from './Fechamento'
import { Impacto } from './Impacto'
import { Ods } from './Ods'
import { Problema } from './Problema'
import { Solucao } from './Solucao'

const SECOES = [
  () => (
    // overflow-hidden: a faixa e levemente girada e nao pode criar rolagem horizontal
    <div className="overflow-hidden py-6">
      <Faixa />
    </div>
  ),
  Problema,
  Solucao,
  Enchente,
  Impacto,
  Ecossistema,
  Ods,
  Fechamento,
]

const ocioso = (f: () => void) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 400 }) : window.setTimeout(f, 50))

/**
 * Tudo que fica abaixo do hero, num pedaco de JS separado (React.lazy na Inicio).
 * Performance: as secoes montam UMA POR VEZ, cada uma num momento ocioso. Montar as 8 juntas virava uma
 * tarefa longa (~500 ms no celular) que travava a tela; assim sao tarefas curtas e tudo esta na pagina em ~1-2 s
 * (inclusive para leitor de tela — nada fica escondido esperando o scroll).
 */
export default function Resto() {
  const [montadas, setMontadas] = useState(1)

  useEffect(() => {
    if (montadas < SECOES.length) {
      const id = ocioso(() => setMontadas((n) => n + 1))
      return () => (window.cancelIdleCallback ?? window.clearTimeout)(id)
    }
    // todas montadas: recalcula posicoes de pins/gatilhos com a pagina completa
    ScrollTrigger.refresh()
  }, [montadas])

  return (
    <>
      {SECOES.slice(0, montadas).map((Secao, i) => (
        <Secao key={i} />
      ))}
      {/* reserva espaco enquanto o resto chega: o rodape nao pula */}
      {montadas < SECOES.length && <div className="min-h-dvh" />}
    </>
  )
}
