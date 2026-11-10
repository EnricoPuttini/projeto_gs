import { Marquee } from '../components/motion/Marquee'
import { SITE } from '../content/site'

/** Faixa de temas entre o hero e o problema: muda o ritmo da leitura e anuncia o escopo. */
export function Faixa() {
  return (
    <section aria-label="Temas do Zelo" className="-rotate-1 scale-[1.02] border-y-2 border-tinta bg-ambar py-5 text-tinta">
      <Marquee itens={SITE.marquee} />
    </section>
  )
}
