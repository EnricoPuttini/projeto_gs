import { Apresentacao } from '../components/Apresentacao'
import { Faixa } from '../sections/Faixa'
import { Hero } from '../sections/Hero'

/** Pagina inicial: storytelling em secoes (ver docs/design.md, secao 5). */
export default function Inicio() {
  return (
    <Apresentacao>
      <Hero />
      {/* overflow-hidden: a faixa e levemente girada e nao pode criar rolagem horizontal */}
      <div className="overflow-hidden py-6">
        <Faixa />
      </div>
    </Apresentacao>
  )
}
