import { Apresentacao } from '../components/Apresentacao'
import { Ecossistema } from '../sections/Ecossistema'
import { Enchente } from '../sections/Enchente'
import { Faixa } from '../sections/Faixa'
import { Fechamento } from '../sections/Fechamento'
import { Hero } from '../sections/Hero'
import { Impacto } from '../sections/Impacto'
import { Ods } from '../sections/Ods'
import { Problema } from '../sections/Problema'
import { Solucao } from '../sections/Solucao'

/** Pagina inicial: storytelling em secoes (ver docs/design.md, secao 5). */
export default function Inicio() {
  return (
    <Apresentacao>
      <Hero />
      {/* overflow-hidden: a faixa e levemente girada e nao pode criar rolagem horizontal */}
      <div className="overflow-hidden py-6">
        <Faixa />
      </div>
      <Problema />
      <Solucao />
      <Enchente />
      <Impacto />
      <Ecossistema />
      <Ods />
      <Fechamento />
    </Apresentacao>
  )
}
