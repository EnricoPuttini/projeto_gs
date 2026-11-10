import { Reveal, RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'

// ODS 11 (laranja #FD9D24) nao tem contraste com texto branco: usa tinta escura no numero.
const TEXTO_ESCURO = new Set([11])

export function Ods() {
  return (
    <section data-secao="ODS" aria-labelledby="ods-titulo" className="bg-papel py-24">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-petroleo">Agenda 2030 da ONU</p>
        <RevealLinhas como="h2" linhas={['Objetivos de Desenvolvimento Sustentável']} className="mt-3 font-display text-display-lg font-semibold text-tinta" />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SITE.ods.map((o, i) => (
            <Reveal key={o.numero} como="li" atraso={i * 0.08} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-tinta/10">
              <div className={`p-5 ${TEXTO_ESCURO.has(o.numero) ? 'text-tinta' : 'text-white'}`} style={{ backgroundColor: o.cor }}>
                <p className="font-display text-5xl font-bold leading-none">ODS {o.numero}</p>
                <p className="mt-2 text-lg font-bold">{o.nome}</p>
              </div>
              <p className="p-5 text-base leading-relaxed text-tinta/85">{o.contribuicao}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
