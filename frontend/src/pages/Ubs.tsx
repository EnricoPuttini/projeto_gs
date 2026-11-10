import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listarUbs, painelUbs } from '../api/endpoints'
import { diaDe, formatarHora, mmss } from '../api/formato'
import type { ConsultaDetalhe, ConsultaStatus, FilaDetalhe, OfertaDetalhe, PainelUbs } from '../api/tipos'
import { Erro, Vazio } from '../components/Estados'
import { IconeAmpulheta, IconeCalendario, IconeChuva, IconeFila, IconeOferta, IconePresenca } from '../components/Icones'
import { Info } from '../components/Info'
import { Layout } from '../components/Layout'
import { LetraGrande } from '../components/LetraGrande'
import { CountUp } from '../components/motion/CountUp'
import { useNovos } from '../hooks/useNovos'
import { LIMIAR_ALTO, pct } from '../dados/base'
import { useContagem } from '../hooks/useContagem'
import { usePolling } from '../hooks/usePolling'

const INTERVALO_MS = 4000
const VALIDADE_OFERTA_S = 15 * 60

/** Cor + texto para cada situacao: a cor nunca e a unica informacao. */
const SITUACAO: Record<ConsultaStatus, { rotulo: string; cor: string }> = {
  AGENDADA: { rotulo: 'Agendada', cor: 'bg-slate-100 text-slate-800' },
  AGUARDANDO_CONFIRMACAO: { rotulo: 'Aguardando confirmação', cor: 'bg-ambar/25 text-tinta' },
  CONFIRMADA: { rotulo: 'Confirmada', cor: 'bg-petroleo/10 text-petroleo' },
  CANCELADA: { rotulo: 'Cancelada', cor: 'bg-slate-200 text-slate-700 line-through' },
  NAO_RESPONDIDA: { rotulo: 'Sem resposta', cor: 'bg-alerta/10 text-alerta-escuro' },
  REALIZADA: { rotulo: 'Realizada', cor: 'bg-petroleo text-white' },
  FALTA: { rotulo: 'Faltou', cor: 'bg-alerta text-white' },
}
const GRAVIDADE = ['', 'Baixa', 'Média', 'Alta']
const COR_GRAVIDADE = ['', 'bg-slate-100 text-slate-800', 'bg-ambar/25 text-tinta', 'bg-alerta/10 text-alerta-escuro']

function Cartao({ titulo, subtitulo, icone, children, className = '', acao }: {
  titulo: string; subtitulo?: string; icone?: ReactNode; children: ReactNode; className?: string; acao?: ReactNode
}) {
  return (
    <section aria-label={titulo} className={`min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-petroleo/10 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icone && <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-fundo text-petroleo">{icone}</span>}
          <div>
            <h2 className="text-lg font-extrabold text-tinta">{titulo}</h2>
            {subtitulo && <p className="text-sm text-tinta/75">{subtitulo}</p>}
          </div>
        </div>
        {acao}
      </div>
      {children}
    </section>
  )
}

function Indicador({ icone, rotulo, valor, explicacao, detalhe }: {
  icone: ReactNode; rotulo: string; valor: ReactNode; explicacao: string; detalhe: ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-petroleo/10">
      <div className="flex items-center gap-2 text-petroleo">
        <span className="shrink-0">{icone}</span>
        <p className="text-base font-bold text-tinta">{rotulo}</p>
      </div>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-petroleo tabular-nums">{valor}</p>
      <p className="text-sm text-tinta/75">{explicacao}</p>
      <Info>{detalhe}</Info>
    </div>
  )
}

/** Risco em barra + numero + palavra: quem nao distingue cores le "31% · Alto". */
function Risco({ valor, alto }: { valor: number | null; alto: boolean }) {
  if (valor == null) return <span className="text-tinta/60">—</span>
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className="h-2 w-14 overflow-hidden rounded-full bg-slate-200">
        <span className={`block h-full rounded-full ${alto ? 'bg-alerta' : 'bg-petroleo/60'}`} style={{ width: `${Math.min(100, Math.round(valor * 200))}%` }} />
      </span>
      <span className={`rounded-full px-2 py-0.5 text-sm font-bold tabular-nums ${alto ? 'bg-alerta text-white' : 'bg-[#dcebe6] text-tinta'}`}>
        {Math.round(valor * 100)}% · {alto ? 'Alto' : 'Normal'}
      </span>
    </span>
  )
}

const Etiqueta = ({ children, cor }: { children: ReactNode; cor: string }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold ${cor}`}>{children}</span>
)

function Agenda({ consultas, hoje }: { consultas: ConsultaDetalhe[]; hoje: string }) {
  // encaixe que acabou de nascer pisca em ambar por 2 s: a recepcao percebe sem procurar
  const novas = useNovos(useMemo(() => consultas.map((c) => c.id), [consultas]))
  if (consultas.length === 0) return <Vazio>Nenhuma consulta para hoje ou amanhã.</Vazio>
  const dias = [...new Set(consultas.map((c) => diaDe(c.dataHora)))].sort()
  return (
    // em tela estreita a agenda rola na horizontal: precisa ser alcancavel pelo teclado
    <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela da agenda (rolável)">
      <table className="w-full text-left text-base">
        <caption className="sr-only">Consultas de hoje e amanhã com situação e risco de falta</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wider text-tinta/70">
            <th scope="col" className="py-2 pr-3 font-bold">Hora</th>
            <th scope="col" className="pr-3 font-bold">Paciente</th>
            <th scope="col" className="pr-3 font-bold">Especialidade</th>
            <th scope="col" className="pr-3 font-bold">Situação</th>
            <th scope="col" className="font-bold">Risco de falta</th>
          </tr>
        </thead>
        {dias.map((dia) => (
          <tbody key={dia}>
            <tr>
              <th colSpan={5} scope="colgroup" className="bg-fundo px-3 py-1.5 text-sm font-bold text-petroleo">
                {dia === hoje ? 'Hoje' : 'Amanhã'} · {dia.split('-').reverse().join('/')}
              </th>
            </tr>
            {consultas.filter((c) => diaDe(c.dataHora) === dia).map((c) => (
              <tr key={c.id} className={`border-b border-petroleo/10 ${novas.has(c.id) ? 'animate-destaque' : c.origem === 'ENCAIXE' ? 'bg-ambar/10' : ''}`}>
                <td className="py-2.5 pr-3 font-bold tabular-nums">{formatarHora(c.dataHora)}</td>
                <td className="pr-3">
                  <span className={c.status === 'CANCELADA' ? 'text-tinta/60' : ''}>{c.pacienteNome}</span>
                  {c.origem === 'ENCAIXE' && <span className="ml-2"><Etiqueta cor="bg-ambar text-tinta">Encaixe</Etiqueta></span>}
                </td>
                <td className="pr-3">{c.especialidade}</td>
                <td className="pr-3"><Etiqueta cor={SITUACAO[c.status].cor}>{SITUACAO[c.status].rotulo}</Etiqueta></td>
                <td><Risco valor={c.riscoFalta} alto={c.riscoAlto} /></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

function OfertaLinha({ oferta }: { oferta: OfertaDetalhe }) {
  const restantes = useContagem(oferta.segundosRestantes, oferta.id)
  const fracao = Math.max(0, Math.min(1, restantes / VALIDADE_OFERTA_S))
  return (
    <li className="rounded-xl p-3 ring-2 ring-ambar">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">{oferta.pacienteNome}</p>
          <p className="text-sm text-tinta/75">{oferta.especialidade} · {formatarHora(oferta.dataHoraVaga)}</p>
        </div>
        <p role="timer" aria-label={`Responde em até ${mmss(restantes)}`} className="text-xl font-extrabold tabular-nums text-petroleo">{mmss(restantes)}</p>
      </div>
      <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${fracao < 0.15 ? 'bg-alerta' : 'bg-ambar'}`} style={{ width: `${fracao * 100}%` }} />
      </div>
    </li>
  )
}

function Fila({ fila }: { fila: FilaDetalhe[] }) {
  const novas = useNovos(useMemo(() => fila.map((f) => f.id), [fila]))
  if (fila.length === 0) return <Vazio>Ninguém na fila.</Vazio>
  const especialidades = [...new Set(fila.map((f) => f.especialidade))]
  return (
    <div className="relative max-h-[28rem] overflow-auto" tabIndex={0} role="region" aria-label="Lista da fila de espera">
      <table className="w-full text-left text-base">
        <caption className="sr-only">Fila de espera por especialidade, na ordem em que as vagas são oferecidas</caption>
        <thead className="sticky top-0 bg-white">
          <tr className="text-xs uppercase tracking-wider text-tinta/70">
            <th scope="col" className="py-2 pr-3 font-bold">Vez</th>
            <th scope="col" className="pr-3 font-bold">Paciente</th>
            <th scope="col" className="pr-3 font-bold">Gravidade</th>
            <th scope="col" className="font-bold">Espera</th>
          </tr>
        </thead>
        {especialidades.map((esp) => (
          <tbody key={esp}>
            <tr>
              <th colSpan={4} scope="colgroup" className="bg-fundo px-3 py-1.5 text-sm font-bold text-petroleo">{esp}</th>
            </tr>
            {fila.filter((f) => f.especialidade === esp).map((f) => (
              <tr key={f.id} className={`border-b border-petroleo/10 ${novas.has(f.id) ? 'animate-destaque' : f.posicao === 1 ? 'bg-petroleo/5' : ''}`}>
                <td className="py-2.5 pr-3 font-extrabold tabular-nums">{f.posicao}º</td>
                <td className="pr-3">
                  {f.pacienteNome}
                  {f.posicao === 1 && <span className="ml-2"><Etiqueta cor="bg-petroleo text-white">Próxima vaga</Etiqueta></span>}
                  {f.prioridadeLegal && <span className="ml-2"><Etiqueta cor="bg-ambar text-tinta">Prioridade</Etiqueta></span>}
                </td>
                <td className="pr-3"><Etiqueta cor={COR_GRAVIDADE[f.gravidade]}>{GRAVIDADE[f.gravidade]}</Etiqueta></td>
                <td className="tabular-nums">{f.diasEspera} dias</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

function Conteudo({ painel }: { painel: PainelUbs }) {
  const { impacto } = painel
  // O backend omite campos nulos: taxa ausente = nenhuma consulta encerrada ainda.
  const temTaxa = impacto.taxaComparecimento != null
  return (
    // @container: o layout segue a largura do proprio painel (inteiro na pagina, estreito dentro da /demo).
    <div className="@container space-y-5">
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @6xl:grid-cols-4">
        <Indicador icone={<IconeCalendario />} rotulo="Vagas recuperadas" valor={<CountUp valor={impacto.vagasRecuperadas} />}
          explicacao="consultas que ficariam vazias e foram para alguém da fila"
          detalhe="Conta as vagas liberadas (cancelamento ou falta de resposta) que viraram consulta de encaixe." />
        <Indicador icone={<IconeAmpulheta />} rotulo="Dias de espera economizados" valor={<CountUp valor={impacto.diasEsperaEconomizados} />}
          explicacao="tempo de fila que as pessoas encaixadas deixaram de esperar"
          detalhe="Para cada encaixe: espera típica por uma vaga regular (45 dias, premissa ajustável) menos os dias até a consulta encaixada. Somado para todos." />
        <Indicador icone={<IconePresenca />} rotulo="Taxa de comparecimento" valor={temTaxa ? <CountUp valor={impacto.taxaComparecimento! * 100} formatar={(v) => `${Math.round(v)}%`} /> : '—'}
          explicacao={temTaxa ? `${impacto.consultasRealizadas} compareceram, ${impacto.faltas} faltaram` : 'aparece quando houver consultas encerradas'}
          detalhe="Consultas realizadas ÷ (realizadas + faltas). Mostra se os lembretes e encaixes estão enchendo as cadeiras." />
        <Indicador icone={<IconeChuva />} rotulo="Moradores alertados" valor={<CountUp valor={impacto.moradoresAlertados} />}
          explicacao="pessoas avisadas antes da chuva forte chegar"
          detalhe="Moradores diferentes que receberam ao menos um alerta de enchente para algum dos seus locais salvos." />
      </div>

      <div className="grid gap-5 @5xl:grid-cols-3">
        <Cartao titulo="Agenda de hoje e amanhã" subtitulo="Quem vem, a situação de cada consulta e a chance de faltar." icone={<IconeCalendario />} className="@5xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-fundo px-3 py-2 text-sm">
            <span className="font-bold">Risco de falta:</span>
            <span>chance estimada de o paciente não vir, por um modelo treinado em consultas reais do SUS.</span>
            <span><strong>Alto</strong> = a partir de {pct(LIMIAR_ALTO, 0)} (os 25% de maior risco) → recebe lembrete extra.</span>
            <Link to="/como-funciona#risco" className="inline-flex min-h-11 items-center font-bold text-petroleo underline underline-offset-4">Entenda o cálculo</Link>
          </div>
          <Agenda consultas={painel.agenda} hoje={painel.agora.slice(0, 10)} />
        </Cartao>

        <div className="min-w-0 space-y-5">
          <Cartao titulo="Ofertas em andamento" subtitulo="Vagas oferecidas agora; cada pessoa tem 15 minutos para responder." icone={<IconeOferta />}>
            {painel.ofertas.length === 0 ? (
              <Vazio>Nenhuma oferta agora. Quando alguém desmarcar, ela aparece aqui.</Vazio>
            ) : (
              <ul className="space-y-2">{painel.ofertas.map((o) => <OfertaLinha key={o.id} oferta={o} />)}</ul>
            )}
          </Cartao>

          <Cartao titulo="Vagas abertas" subtitulo="Liberadas e ainda sem dono." icone={<IconeCalendario />}>
            {painel.vagas.length === 0 ? (
              <Vazio>Nenhuma vaga parada: as liberadas já foram oferecidas.</Vazio>
            ) : (
              <ul className="space-y-2">
                {painel.vagas.map((v) => (
                  <li key={v.id} className="flex items-center justify-between rounded-xl bg-fundo p-3">
                    <span>{v.especialidade} · {formatarHora(v.dataHora)}</span>
                    <Etiqueta cor={v.status === 'ABERTA' ? 'bg-alerta/10 text-alerta-escuro' : 'bg-ambar/25 text-tinta'}>{v.status === 'ABERTA' ? 'Aberta' : 'Em oferta'}</Etiqueta>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      </div>

      <Cartao titulo={`Fila de espera · ${painel.fila.length} pessoas`} subtitulo="Na ordem em que as próximas vagas serão oferecidas, por especialidade." icone={<IconeFila />}
        acao={<Link to="/como-funciona#fila" className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-bold text-petroleo underline underline-offset-4">Por que nessa ordem?</Link>}>
        <p className="mb-3 rounded-xl bg-fundo px-3 py-2 text-sm">
          Ordem: <strong>prioridade legal</strong> (60+, gestante, PcD) → <strong>gravidade</strong> → <strong>tempo de espera</strong> → <strong>distância até a UBS</strong> → <strong>menor risco de falta</strong>.
        </p>
        <Fila fila={painel.fila} />
      </Cartao>
    </div>
  )
}

/** Painel da UBS: tudo vem de UM endpoint, atualizado sozinho a cada 4 s. */
export default function Ubs({ embutido = false }: { embutido?: boolean }) {
  const [params, setParams] = useSearchParams()
  const ubsId = Number(params.get('ubs') ?? 1)
  const unidades = usePolling(listarUbs, 120_000, 'ubs')
  const painel = usePolling(() => painelUbs(ubsId), INTERVALO_MS, ubsId)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)

  useEffect(() => {
    if (painel.dados) setAtualizadoEm(new Date())
  }, [painel.dados])

  const seletor = (
    <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-base font-semibold">
      Unidade
      <select value={ubsId} onChange={(e) => setParams({ ubs: e.target.value })} className="min-h-11 min-w-0 max-w-full rounded-lg border border-petroleo/20 bg-white px-3 text-base text-tinta">
        {(unidades.dados ?? [{ id: ubsId, nome: `UBS ${ubsId}`, endereco: '' }]).map((u) => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </select>
    </label>
  )
  const status = atualizadoEm && (
    <p className="flex items-center gap-2 text-sm text-tinta/75">
      <span aria-hidden className="size-2 animate-pulse rounded-full bg-emerald-500" />
      Ao vivo · atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}
    </p>
  )
  const corpo = (
    <>
      {painel.carregando && (
        // skeleton com o desenho do painel: a pessoa ja sabe onde cada coisa vai aparecer
        <div role="status" className="space-y-5">
          <span className="sr-only">Carregando o painel…</span>
          <div aria-hidden className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="esqueleto h-36" />)}
          </div>
          <div aria-hidden className="esqueleto h-96" />
        </div>
      )}
      {painel.erro && <div className="mb-4"><Erro mensagem={painel.erro} aoTentar={painel.atualizar} /></div>}
      {painel.dados && <Conteudo painel={painel.dados} />}
    </>
  )

  if (embutido) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-petroleo/10 bg-white/95 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-lg font-extrabold">Painel da UBS</p>
            {status}
          </div>
          {seletor}
        </div>
        <div className="p-5">{corpo}</div>
      </div>
    )
  }

  return (
    <Layout largo>
      <div className="mx-auto max-w-[1500px] px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Painel da UBS</h1>
            <p className="mt-1 max-w-2xl text-base text-tinta/80">
              O que a recepção vê: a agenda com o risco de falta, as vagas que o Zelo está recuperando e o impacto acumulado.
            </p>
            {status}
          </div>
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
            {seletor}
            <span className="sm:hidden"><LetraGrande /></span>
          </div>
        </div>
        {corpo}
      </div>
    </Layout>
  )
}
