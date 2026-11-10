import { lazy, Suspense, useEffect, useState } from 'react'
import { Apresentacao } from '../components/Apresentacao'
import { Hero } from '../sections/Hero'

const Resto = lazy(() => import('../sections/Resto'))

/**
 * Pagina inicial: storytelling em secoes (ver docs/design.md, secao 5).
 * Performance: o hero monta primeiro; as secoes de baixo (e os ScrollTriggers delas) so depois que o
 * navegador fica ocioso, para nao disputar a CPU com a primeira pintura no celular.
 */
export default function Inicio() {
  const [montarResto, setMontarResto] = useState(false)

  useEffect(() => {
    // Safari nao tem requestIdleCallback: cai para um timeout curto
    const ocioso = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 600))
    const cancelar = window.cancelIdleCallback ?? window.clearTimeout
    const id = ocioso(() => setMontarResto(true), { timeout: 1500 })
    return () => cancelar(id)
  }, [])

  return (
    <Apresentacao setas>
      <Hero />
      {/* min-h reserva espaco: o rodape nao "sobe" e desce quando o resto chega */}
      <Suspense fallback={<div className="min-h-dvh" />}>{montarResto ? <Resto /> : <div className="min-h-dvh" />}</Suspense>
    </Apresentacao>
  )
}
