import { painelUbs } from '../api/endpoints'
import { CountUp } from '../components/motion/CountUp'
import { Reveal, RevealLinhas } from '../components/motion/Reveal'
import { SITE } from '../content/site'
import { usePolling } from '../hooks/usePolling'

const { impacto } = SITE

/** Os 4 indicadores lidos ao vivo da API (mesmo endpoint do painel da UBS). Sem API, texto explica o porque. */
export function Impacto() {
  const painel = usePolling(() => painelUbs(1), 15_000, 'impacto-inicio')
  const i = painel.dados?.impacto
  const semDados = !i
  const itens = [
    { rotulo: 'vagas recuperadas', valor: i?.vagasRecuperadas, explica: 'consultas que ficariam vazias e foram para alguém da fila' },
    { rotulo: 'dias de espera economizados', valor: i?.diasEsperaEconomizados, explica: 'somando o tempo que cada pessoa encaixada deixou de esperar' },
    { rotulo: 'taxa de comparecimento', valor: i?.taxaComparecimento == null ? undefined : i.taxaComparecimento * 100, pct: true, explica: 'realizadas ÷ (realizadas + faltas); aparece quando houver consultas encerradas' },
    { rotulo: 'moradores alertados', valor: i?.moradoresAlertados, explica: 'pessoas avisadas antes da chuva forte chegar' },
  ]
  return (
    <section data-secao="Impacto" aria-labelledby="impacto-titulo" className="bg-papel py-24">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-petroleo">Impacto</p>
        <RevealLinhas como="h2" id="impacto-titulo" linhas={[impacto.titulo]} className="mt-3 max-w-3xl font-display text-display-lg font-semibold text-tinta" />
        <p className="mt-4 max-w-2xl text-lg text-tinta/85">{impacto.texto}</p>
        <dl className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-tinta/10 ring-1 ring-tinta/10 sm:grid-cols-2 lg:grid-cols-4">
          {itens.map((x, n) => (
            <Reveal key={x.rotulo} atraso={n * 0.08} className="bg-white p-6">
              <dt className="text-base font-bold text-tinta">{x.rotulo}</dt>
              <dd className="mt-3">
                {x.valor == null ? (
                  <span className="font-display text-6xl font-semibold text-tinta/30">—</span>
                ) : (
                  <CountUp valor={x.valor} aoEntrarNaTela formatar={(v) => (x.pct ? `${Math.round(v)}%` : Math.round(v).toLocaleString('pt-BR'))} className="font-display text-6xl font-semibold text-petroleo" />
                )}
                <span className="mt-2 block text-sm text-tinta/75">{x.explica}</span>
              </dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-4 text-sm text-tinta/70">
          {semDados ? impacto.fallback : 'Fonte: API do Zelo, painel da UBS de referência, ao vivo. Rode a demonstração para ver os números subirem.'}
        </p>
      </div>
    </section>
  )
}
