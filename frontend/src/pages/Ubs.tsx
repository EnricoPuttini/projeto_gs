import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listarUbs, painelUbs } from '../api/endpoints'
import { diaDe, formatarHora, mmss } from '../api/formato'
import type { ConsultaDetalhe, ConsultaStatus, OfertaDetalhe, PainelUbs } from '../api/tipos'
import { Carregando, Erro, Vazio } from '../components/Estados'
import { LetraGrande } from '../components/LetraGrande'
import { useContagem } from '../hooks/useContagem'
import { usePolling } from '../hooks/usePolling'

const INTERVALO_MS = 4000

const ROTULO_STATUS: Record<ConsultaStatus, string> = {
  AGENDADA: 'Agendada',
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  NAO_RESPONDIDA: 'Sem resposta',
  REALIZADA: 'Realizada',
  FALTA: 'Faltou',
}

function Cartao({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={titulo} className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      <h2 className="mb-3 text-lg font-extrabold text-petroleo">{titulo}</h2>
      {children}
    </section>
  )
}

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-2xl bg-petroleo p-4 text-white shadow-sm">
      <p className="text-base font-medium text-white/90">{rotulo}</p>
      <p className="text-4xl font-extrabold tabular-nums">{valor}</p>
      {detalhe && <p className="text-sm text-white/80">{detalhe}</p>}
    </div>
  )
}

/** Risco em cor E numero E palavra: quem nao distingue cores le "78% · Alto". */
function Risco({ valor, alto }: { valor: number | null; alto: boolean }) {
  if (valor === null) return <span className="text-base text-tinta/70">—</span>
  const pct = Math.round(valor * 100)
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center gap-1 rounded-full px-3 py-1 text-base font-bold tabular-nums ${
        alto ? 'bg-alerta text-white' : 'bg-[#dcebe6] text-tinta'
      }`}
    >
      {pct}% · {alto ? 'Alto' : 'Baixo'}
    </span>
  )
}

function Agenda({ consultas, hoje }: { consultas: ConsultaDetalhe[]; hoje: string }) {
  if (consultas.length === 0) return <Vazio>Nenhuma consulta para hoje ou amanhã.</Vazio>
  const dias = [...new Set(consultas.map((c) => diaDe(c.dataHora)))].sort()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-base">
        <thead>
          <tr className="border-b-2 border-petroleo/20 text-sm uppercase tracking-wide text-tinta/80">
            <th scope="col" className="py-2 pr-3">Hora</th>
            <th scope="col" className="pr-3">Paciente</th>
            <th scope="col" className="pr-3">Especialidade</th>
            <th scope="col" className="pr-3">Situação</th>
            <th scope="col">Risco de falta</th>
          </tr>
        </thead>
        {dias.map((dia) => (
          <tbody key={dia}>
            <tr>
              <th colSpan={5} scope="colgroup" className="bg-fundo px-2 py-1 text-sm font-bold text-petroleo">
                {dia === hoje ? 'Hoje' : 'Amanhã'} · {dia.split('-').reverse().join('/')}
              </th>
            </tr>
            {consultas
              .filter((c) => diaDe(c.dataHora) === dia)
              .map((c) => (
                <tr key={c.id} className={`border-b border-petroleo/10 ${c.status === 'CANCELADA' ? 'opacity-60' : ''}`}>
                  <td className="py-2 pr-3 font-bold tabular-nums">{formatarHora(c.dataHora)}</td>
                  <td className="pr-3">
                    {c.pacienteNome}
                    {c.origem === 'ENCAIXE' && (
                      <span className="ml-2 rounded bg-ambar px-2 py-0.5 text-sm font-bold text-tinta">Encaixe</span>
                    )}
                  </td>
                  <td className="pr-3">{c.especialidade}</td>
                  <td className="pr-3">{ROTULO_STATUS[c.status]}</td>
                  <td>
                    <Risco valor={c.riscoFalta} alto={c.riscoAlto} />
                  </td>
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
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border-2 border-ambar p-3">
      <div>
        <p className="text-base font-bold">{oferta.pacienteNome}</p>
        <p className="text-sm text-tinta/80">
          {oferta.especialidade} · {formatarHora(oferta.dataHoraVaga)}
        </p>
      </div>
      <p role="timer" aria-label={`Expira em ${mmss(restantes)}`} className="text-xl font-extrabold tabular-nums text-petroleo">
        {mmss(restantes)}
      </p>
    </li>
  )
}

// A lista da fila rola: por isso o tabIndex={0} — area rolavel precisa ser alcancavel pelo teclado.
function Conteudo({ painel }: { painel: PainelUbs }) {
  const { impacto } = painel
  const taxa = impacto.taxaComparecimento === null ? '—' : `${Math.round(impacto.taxaComparecimento * 100)}%`
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador rotulo="Vagas recuperadas" valor={String(impacto.vagasRecuperadas)} detalhe="consultas que seriam perdidas" />
        <Indicador
          rotulo="Dias de espera economizados"
          valor={String(impacto.diasEsperaEconomizados)}
          detalhe="somando todas as pessoas encaixadas"
        />
        <Indicador
          rotulo="Taxa de comparecimento"
          valor={taxa}
          detalhe={
            impacto.taxaComparecimento === null
              ? 'ainda sem consultas encerradas'
              : `${impacto.consultasRealizadas} compareceram, ${impacto.faltas} faltaram`
          }
        />
        <Indicador
          rotulo="Moradores alertados"
          valor={String(impacto.moradoresAlertados)}
          detalhe="avisados antes da água chegar"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Cartao titulo="Agenda de hoje e amanhã" className="lg:col-span-2">
          <Agenda consultas={painel.agenda} hoje={painel.agora.slice(0, 10)} />
        </Cartao>

        <div className="space-y-4">
          <Cartao titulo="Ofertas em andamento">
            {painel.ofertas.length === 0 ? (
              <Vazio>Nenhuma oferta agora.</Vazio>
            ) : (
              <ul className="space-y-2">
                {painel.ofertas.map((o) => (
                  <OfertaLinha key={o.id} oferta={o} />
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao titulo="Vagas abertas">
            {painel.vagas.length === 0 ? (
              <Vazio>Nenhuma vaga aberta.</Vazio>
            ) : (
              <ul className="space-y-2">
                {painel.vagas.map((v) => (
                  <li key={v.id} className="flex items-center justify-between rounded-xl bg-fundo p-3 text-base">
                    <span>
                      {v.especialidade} · {formatarHora(v.dataHora)}
                    </span>
                    <span className="font-bold">{v.status === 'ABERTA' ? 'Aberta' : 'Em oferta'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      </div>

      <Cartao titulo={`Fila de espera (${painel.fila.length})`}>
        {painel.fila.length === 0 ? (
          <Vazio>Ninguém na fila.</Vazio>
        ) : (
          <div className="max-h-96 overflow-auto" tabIndex={0} role="region" aria-label="Lista da fila de espera">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b-2 border-petroleo/20 text-sm uppercase tracking-wide text-tinta/80">
                  <th scope="col" className="py-2 pr-3">Vez</th>
                  <th scope="col" className="pr-3">Paciente</th>
                  <th scope="col" className="pr-3">Especialidade</th>
                  <th scope="col" className="pr-3">Gravidade</th>
                  <th scope="col">Espera</th>
                </tr>
              </thead>
              <tbody>
                {painel.fila.map((f) => (
                  <tr key={f.id} className="border-b border-petroleo/10">
                    <td className="py-2 pr-3 font-bold tabular-nums">{f.posicao}º</td>
                    <td className="pr-3">
                      {f.pacienteNome}
                      {f.prioridadeLegal && <span className="ml-2 rounded bg-ambar px-2 py-0.5 text-sm font-bold">Prioridade</span>}
                    </td>
                    <td className="pr-3">{f.especialidade}</td>
                    <td className="pr-3">{['', 'Baixa', 'Média', 'Alta'][f.gravidade]}</td>
                    <td className="tabular-nums">{f.diasEspera} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  )
}

/** Painel da UBS (desktop): tudo vem de UM endpoint, atualizado sozinho a cada 4 s. */
export default function Ubs({ embutido = false }: { embutido?: boolean }) {
  const [params, setParams] = useSearchParams()
  const ubsId = Number(params.get('ubs') ?? 1)
  const unidades = usePolling(listarUbs, 120_000, 'ubs')
  const painel = usePolling(() => painelUbs(ubsId), INTERVALO_MS, ubsId)
  // Embutido na /demo, o <main> da pagina e da propria demo (so pode haver um por pagina).
  const Principal = embutido ? 'div' : 'main'
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)

  useEffect(() => {
    if (painel.dados) setAtualizadoEm(new Date())
  }, [painel.dados])

  return (
    <div className={embutido ? 'h-full overflow-y-auto' : 'min-h-dvh'}>
      <header className="flex flex-wrap items-center justify-between gap-3 bg-petroleo px-6 py-4 text-white">
        <div>
          <h1 className="text-2xl font-extrabold">Zelo · Painel da UBS</h1>
          {atualizadoEm && (
            <p className="text-sm text-white/90">Atualiza sozinho · última vez às {atualizadoEm.toLocaleTimeString('pt-BR')}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-base font-medium">
            Unidade
            <select
              value={ubsId}
              onChange={(e) => setParams({ ubs: e.target.value })}
              className="min-h-11 rounded-lg bg-white px-3 text-base text-tinta"
            >
              {(unidades.dados ?? [{ id: ubsId, nome: `UBS ${ubsId}`, endereco: '' }]).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
          <LetraGrande claro />
        </div>
      </header>

      <Principal className="mx-auto max-w-7xl p-4 md:p-6">
        {painel.carregando && <Carregando texto="Carregando o painel…" />}
        {painel.erro && (
          <div className="mb-4">
            <Erro mensagem={painel.erro} aoTentar={painel.atualizar} />
          </div>
        )}
        {painel.dados && <Conteudo painel={painel.dados} />}
      </Principal>
    </div>
  )
}
