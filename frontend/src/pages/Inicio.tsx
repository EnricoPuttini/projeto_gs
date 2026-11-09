import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { painelUbs } from '../api/endpoints'
import {
  IconeCalendario,
  IconeChuva,
  IconeDados,
  IconeEscudo,
  IconeFila,
  IconeMic,
  IconeOferta,
  IconePresenca,
  IconeSeta,
} from '../components/Icones'
import { Layout } from '../components/Layout'
import { BASE, milhar, pct } from '../dados/base'
import { usePolling } from '../hooks/usePolling'

function Passo({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <li className="group relative flex gap-4 pb-6 last:pb-0">
      <span aria-hidden className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-0.5 bg-petroleo/15 group-last:hidden" />
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-petroleo text-lg font-extrabold text-white">{n}</span>
      <div>
        <h4 className="text-lg font-bold">{titulo}</h4>
        <p className="text-base text-tinta/80">{children}</p>
      </div>
    </li>
  )
}

function Numero({ valor, rotulo, fonte }: { valor: string; rotulo: string; fonte?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-petroleo/10">
      <p className="text-4xl font-extrabold tracking-tight text-petroleo tabular-nums">{valor}</p>
      <p className="mt-1 text-base font-medium">{rotulo}</p>
      {fonte && <p className="mt-2 text-sm text-tinta/70">{fonte}</p>}
    </div>
  )
}

/** Impacto ao vivo, lido do mesmo endpoint do painel da UBS de referencia. */
function ImpactoAoVivo() {
  const painel = usePolling(() => painelUbs(1), 10_000, 'inicio')
  const i = painel.dados?.impacto
  const itens = [
    { icone: <IconeCalendario />, valor: i?.vagasRecuperadas, rotulo: 'vagas recuperadas', ex: 'consultas que ficariam vazias e foram para alguém da fila' },
    { icone: <IconeFila />, valor: i?.diasEsperaEconomizados, rotulo: 'dias de espera economizados', ex: 'soma do tempo que as pessoas encaixadas deixaram de esperar' },
    { icone: <IconeChuva />, valor: i?.moradoresAlertados, rotulo: 'moradores alertados', ex: 'pessoas avisadas antes da chuva forte chegar' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {itens.map((x) => (
        <div key={x.rotulo} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
          <span className="text-ambar">{x.icone}</span>
          <p className="mt-2 text-4xl font-extrabold tabular-nums">{x.valor ?? '—'}</p>
          <p className="text-base font-bold">{x.rotulo}</p>
          <p className="mt-1 text-sm text-white/80">{x.ex}</p>
        </div>
      ))}
      {painel.erro && !painel.dados && (
        <p className="text-sm text-white/80 sm:col-span-3">Os números ao vivo aparecem quando o servidor estiver no ar.</p>
      )}
    </div>
  )
}

export default function Inicio() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-fundo">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-ambar/30 px-3 py-1 text-sm font-bold text-tinta">CitizenTech · Global Solution FIAP 2026</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-tinta sm:text-5xl">
              Nenhuma consulta vazia. <span className="text-petroleo">Ninguém pego de surpresa pela enchente.</span>
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-relaxed text-tinta/85">
              O <strong>Zelo</strong> é um assistente por <strong>voz e texto</strong> que entrega a consulta desmarcada para o próximo da fila em minutos — e avisa quem mora em área de risco <strong>antes</strong> de a rua alagar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-petroleo px-5 text-lg font-bold text-white shadow-sm hover:bg-petroleo-escuro">
                Ver a demonstração <IconeSeta className="size-5" />
              </Link>
              <Link to="/como-funciona" className="inline-flex min-h-12 items-center rounded-xl border-2 border-petroleo px-5 text-lg font-bold text-petroleo hover:bg-white">
                Entender como funciona
              </Link>
            </div>
          </div>

          <figure className="rounded-3xl bg-petroleo p-6 text-white shadow-xl">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-200">Dado real, não estimativa</p>
            <p className="mt-2 text-7xl font-extrabold tabular-nums">{pct(BASE.taxaFalta, 0)}</p>
            <p className="mt-1 text-xl font-semibold">das consultas marcadas no SUS ficaram vazias porque o paciente faltou.</p>
            <p className="mt-4 text-base text-white/85">
              É 1 em cada 5 cadeiras vazias — enquanto outras pessoas esperam meses na fila.
            </p>
            <figcaption className="mt-5 border-t border-white/20 pt-3 text-sm text-white/75">
              Fonte: {milhar(BASE.consultas)} consultas reais de Vitória-ES (2016), base pública <em>Medical Appointment No Shows</em> (Kaggle).
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Problema */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="problema">
        <h2 id="problema" className="text-3xl font-extrabold tracking-tight">O problema que a gente ataca</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Numero valor={pct(BASE.taxaFaltaComFaltaAnterior, 0)} rotulo="faltam de novo entre quem já faltou antes" fonte={`contra ${pct(BASE.taxaFaltaSemFaltaAnterior, 0)} de quem nunca faltou`} />
          <Numero valor={pct(BASE.taxaFalta15DiasOuMais, 0)} rotulo="de falta quando a consulta é marcada com 15 dias ou mais" fonte={`no mesmo dia, só ${pct(BASE.taxaFaltaMesmoDia, 1)}`} />
          <Numero valor="Sem aviso" rotulo="quem mora perto de córrego descobre o alagamento quando a água já está na porta" fonte="previsão existe (Open-Meteo), mas não chega a quem precisa" />
        </div>
      </section>

      {/* Solucao */}
      <section className="bg-white py-14" aria-labelledby="solucao">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="solucao" className="text-3xl font-extrabold tracking-tight">Como o Zelo resolve</h2>
          <p className="mt-2 max-w-3xl text-lg text-tinta/80">Duas frentes, um único assistente no celular — no mesmo canal de mensagens que o morador já usa.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl bg-fundo p-6 ring-1 ring-petroleo/10">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-petroleo text-white"><IconeCalendario /></span>
                <h3 className="text-2xl font-extrabold">Vaga que abre, vaga que se preenche</h3>
              </div>
              <ol className="mt-6">
                <Passo n={1} titulo="Alguém desmarca — ou não confirma">O Zelo pede confirmação na véspera. Quem cancela ou não responde até 4 horas antes libera a vaga.</Passo>
                <Passo n={2} titulo="O Zelo escolhe quem vem a seguir">Mesma UBS e especialidade, nesta ordem: prioridade legal, gravidade, tempo de espera, distância e menor risco de faltar.</Passo>
                <Passo n={3} titulo="A pessoa recebe a oferta">Por mensagem e voz: "Abriu uma vaga… você quer?". Ela tem 15 minutos para responder.</Passo>
                <Passo n={4} titulo='"Quero a vaga" — pronto'>A consulta é marcada na hora. Se recusar ou o tempo acabar, a vaga vai para o próximo automaticamente.</Passo>
              </ol>
            </article>
            <article className="rounded-3xl bg-fundo p-6 ring-1 ring-petroleo/10">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-alerta text-white"><IconeChuva /></span>
                <h3 className="text-2xl font-extrabold">Aviso antes da água chegar</h3>
              </div>
              <ol className="mt-6">
                <Passo n={1} titulo="O morador salva seus lugares">Casa, trabalho, casa da filha — e escolhe como quer ser avisado: silencioso, vibrar ou alarme.</Passo>
                <Passo n={2} titulo="O Zelo olha a previsão">A cada 15 minutos consulta a chuva prevista para cada área de risco do bairro.</Passo>
                <Passo n={3} titulo="Chuva forte prevista? Alerta">Se a chuva das próximas 3 horas passar do limite da área, todos os locais dentro do raio são avisados.</Passo>
                <Passo n={4} titulo="Tela cheia, abrigo e rota">Sirene, o que fazer, o abrigo mais perto com a rota no mapa e o botão "Estou seguro".</Passo>
              </ol>
            </article>
          </div>
        </div>
      </section>

      {/* Persona */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="persona">
        <div className="grid items-center gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-petroleo/10 md:grid-cols-[auto_1fr] md:p-10">
          <div aria-hidden className="mx-auto flex size-32 items-center justify-center rounded-full bg-ambar text-5xl font-extrabold text-tinta">C</div>
          <div>
            <h2 id="persona" className="text-3xl font-extrabold tracking-tight">Feito para a Dona Cida</h2>
            <p className="mt-3 text-lg leading-relaxed text-tinta/85">
              64 anos, hipertensa, lê com dificuldade e conversa por áudio no WhatsApp. Ela espera há 3 meses por um clínico geral e mora perto de um córrego que transborda.
            </p>
            <ul className="mt-4 grid gap-2 text-base sm:grid-cols-2">
              <li className="flex items-center gap-2"><IconeMic className="size-5 text-petroleo" /> Fala com o Zelo pelo microfone</li>
              <li className="flex items-center gap-2"><IconeOferta className="size-5 text-petroleo" /> Ouve as respostas em voz alta</li>
              <li className="flex items-center gap-2"><IconePresenca className="size-5 text-petroleo" /> Botões grandes e "letra grande"</li>
              <li className="flex items-center gap-2"><IconeEscudo className="size-5 text-petroleo" /> Aviso de enchente que não passa despercebido</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Impacto */}
      <section className="bg-petroleo py-14 text-white" aria-labelledby="impacto">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="impacto" className="text-3xl font-extrabold tracking-tight">Impacto, medido pelo próprio sistema</h2>
          <p className="mt-2 max-w-3xl text-lg text-white/85">Ao vivo, na UBS de referência. Os números sobem a cada vaga recuperada e a cada morador avisado.</p>
          <div className="mt-8">
            <ImpactoAoVivo />
          </div>
        </div>
      </section>

      {/* Transparencia */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="dados">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-petroleo ring-1 ring-petroleo/10"><IconeDados /></span>
          <div>
            <h2 id="dados" className="text-3xl font-extrabold tracking-tight">Dados reais onde importa, pessoas fictícias onde precisa</h2>
            <p className="mt-3 max-w-3xl text-lg text-tinta/85">
              O risco de falta é calculado por um modelo treinado em <strong>{milhar(BASE.consultas)} consultas reais</strong> do SUS. Os pacientes da demonstração são fictícios, mas com idade e condições de saúde sorteadas nas mesmas proporções da base real. Nenhum dado pessoal real é usado.
            </p>
            <Link to="/como-funciona" className="mt-4 inline-flex min-h-11 items-center gap-2 text-lg font-bold text-petroleo underline-offset-4 hover:underline">
              Ver o que significa cada dado <IconeSeta className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
