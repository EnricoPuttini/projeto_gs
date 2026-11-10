import { Link } from 'react-router-dom'
import { IconeSeta } from '../components/Icones'
import { Magnetic } from '../components/motion/Magnetic'
import { RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'

const { fechamento } = SITE

export function Fechamento() {
  return (
    <section data-secao="Fechamento" aria-labelledby="fim-titulo" className="relative overflow-hidden bg-noite py-28 text-papel">
      {/* anel ambar decorativo: ecoa o "cuidado que chega antes" sem competir com o texto */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full border-[3rem] border-ambar/10" />
      <div className="relative mx-auto max-w-7xl px-4">
        <RevealLinhas
          como="h2"
          linhas={fechamento.frase}
          className="font-display text-display-xl font-semibold"
          classeLinha={(i) => (i === 1 ? 'italic text-ambar' : '')}
        />
        <div className="mt-12">
          <Magnetic className="rounded-full">
            <Link to="/demo" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-ambar px-8 text-lg font-bold text-tinta hover:brightness-95">
              {fechamento.cta} <IconeSeta className="size-5" />
            </Link>
          </Magnetic>
        </div>
        {fechamento.equipe.length > 0 && (
          <div className="mt-16 border-t border-papel/15 pt-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-papel/70">Equipe</h3>
            <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
              {fechamento.equipe.map((m) => (
                <li key={m.rm}>
                  <span className="block text-lg font-bold">{m.nome}</span>
                  <span className="text-sm text-papel/70">RM {m.rm}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
