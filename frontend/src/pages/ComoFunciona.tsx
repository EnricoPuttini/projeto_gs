import type { ReactNode } from 'react'
import { Layout } from '../components/Layout'
import { BASE, FATORES, LIMIAR_ALTO, milhar, pct } from '../dados/base'

function Secao({ id, titulo, resumo, children }: { id: string; titulo: string; resumo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-petroleo/10 md:p-8">
      <h2 id={`${id}-t`} className="text-2xl font-extrabold tracking-tight">{titulo}</h2>
      <p className="mt-2 text-lg text-tinta/80">{resumo}</p>
      <div className="mt-5 space-y-4 text-base leading-relaxed">{children}</div>
    </section>
  )
}

/** Lista de termos: <dl> semantico, cada termo com a sua definicao. */
function Termos({ itens }: { itens: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-petroleo/10 rounded-2xl ring-1 ring-petroleo/10">
      {itens.map(([t, d], i) => (
        <div key={i} className="grid gap-1 p-4 sm:grid-cols-[14rem_1fr] sm:gap-4">
          <dt className="font-bold">{t}</dt>
          <dd className="text-tinta/85">{d}</dd>
        </div>
      ))}
    </dl>
  )
}

const Chip = ({ children, cor }: { children: ReactNode; cor: string }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-bold ${cor}`}>{children}</span>
)

const SUMARIO = [
  ['risco', 'Risco de falta'],
  ['fila', 'Ordem da fila'],
  ['situacao', 'Situação da consulta'],
  ['vaga', 'Vagas e ofertas'],
  ['impacto', 'Indicadores de impacto'],
  ['alerta', 'Alerta de enchente'],
  ['fontes', 'De onde vêm os dados'],
] as const

export default function ComoFunciona() {
  const pesos = FATORES.map((f) => ({ ...f, peso: BASE.modelo.pesos[f.chave] })).sort((a, b) => Math.abs(b.peso) - Math.abs(a.peso))
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Como funciona — e o que cada dado significa</h1>
        <p className="mt-3 max-w-3xl text-lg text-tinta/85">
          Tudo o que aparece no painel da UBS e no app do cidadão, explicado em linguagem simples, com as regras exatas que o sistema aplica.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
          <nav aria-label="Nesta página" className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-tinta/70">Nesta página</p>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {SUMARIO.map(([id, t]) => (
                <li key={id}>
                  <a href={`#${id}`} className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-petroleo hover:bg-white">{t}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-6">
            <Secao id="risco" titulo="Risco de falta" resumo="A chance estimada de o paciente não aparecer na consulta, de 0% a 100%.">
              <p>
                É calculado por uma <strong>regressão logística</strong> treinada em {milhar(BASE.modelo.consultasTreino + BASE.modelo.consultasTeste)} consultas reais do SUS.
                Ela soma o peso de cada fator abaixo e transforma o resultado numa probabilidade. Na base real, {pct(BASE.taxaFalta)} das consultas tiveram falta.
              </p>
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-fundo p-4">
                <Chip cor="bg-[#dcebe6] text-tinta">18% · Normal</Chip>
                <Chip cor="bg-alerta text-white">31% · Alto</Chip>
                <span>
                  <strong>Alto</strong> = a partir de <strong>{pct(LIMIAR_ALTO, 0)}</strong>: são os 25% de consultas com maior risco. Elas recebem lembrete extra e ficam em destaque no painel.
                  Nesse grupo, a falta real foi de {pct(BASE.modelo.taxaFaltaNoGrupoAlto, 0)} — bem acima da média.
                </span>
              </div>
              <h3 className="text-lg font-bold">O que pesa no cálculo (pesos aprendidos dos dados)</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {pesos.map((f) => (
                  <li key={f.chave} className="flex items-center justify-between gap-3 rounded-xl bg-fundo px-4 py-3">
                    <span>
                      <span className="font-semibold">{f.nome}</span>
                      <span className="block text-sm text-tinta/70">{f.unidade}</span>
                    </span>
                    <Chip cor={f.peso > 0 ? 'bg-alerta/15 text-alerta-escuro' : 'bg-petroleo/10 text-petroleo'}>{f.peso > 0 ? '↑ aumenta' : '↓ diminui'}</Chip>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-tinta/75">
                Qualidade do modelo: AUC de {BASE.modelo.aucTeste.toLocaleString('pt-BR')} em {milhar(BASE.modelo.consultasTeste)} consultas que ele nunca viu
                (0,5 seria chute; 1,0 seria perfeito). É um apoio para a equipe priorizar lembretes, não um julgamento sobre a pessoa.
                Curiosidade honesta: na base, quem recebeu SMS faltou <em>mais</em>, porque o SMS só era enviado para consultas marcadas com antecedência maior — que já faltam mais.
              </p>
            </Secao>

            <Secao id="fila" titulo="Ordem da fila de espera" resumo="Quando uma vaga abre, ela vai para a primeira pessoa desta ordem, na mesma UBS e especialidade.">
              <ol className="space-y-2">
                {[
                  ['Prioridade legal', 'Pessoas com 60 anos ou mais, gestantes e pessoas com deficiência (Lei 10.048/2000 e Estatuto da Pessoa Idosa) vêm primeiro.'],
                  ['Gravidade', 'Definida pela equipe de saúde quando a pessoa entra na fila: Alta, Média ou Baixa.'],
                  ['Tempo de espera', 'Quem espera há mais dias passa na frente.'],
                  ['Distância até a UBS', 'Em empate, quem mora mais perto (distância em linha reta) — mais chance de chegar a tempo.'],
                  ['Menor risco de falta', 'Por fim, quem tem mais chance de comparecer: a vaga recuperada não pode virar outra cadeira vazia.'],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3 rounded-xl bg-fundo p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-petroleo font-extrabold text-white">{i + 1}</span>
                    <span><strong>{t}.</strong> {d}</span>
                  </li>
                ))}
              </ol>
              <Termos
                itens={[
                  ['Vez', 'A posição da pessoa nessa ordem, dentro da especialidade. "1º" é quem recebe a próxima vaga.'],
                  [<Chip cor="bg-ambar text-tinta">Prioridade</Chip>, 'A pessoa tem prioridade legal (60+, gestante ou PcD).'],
                  ['Espera', 'Dias desde que a pessoa entrou na fila.'],
                ]}
              />
            </Secao>

            <Secao id="situacao" titulo="Situação da consulta" resumo="Cada consulta passa por estas etapas — o sistema não deixa pular nenhuma.">
              <Termos
                itens={[
                  ['Agendada', 'Marcada; ainda falta mais de um dia.'],
                  ['Aguardando confirmação', 'Na véspera, o Zelo perguntou "você vai?" e espera a resposta.'],
                  ['Confirmada', 'A pessoa respondeu que vai. Encaixes já nascem confirmados.'],
                  ['Cancelada', 'A pessoa avisou que não vai. A vaga é liberada na hora.'],
                  ['Sem resposta', 'Ninguém respondeu até 4 horas antes. A vaga é liberada para a fila.'],
                  ['Realizada / Faltou', 'O que aconteceu de fato; alimenta a taxa de comparecimento.'],
                  [<Chip cor="bg-ambar text-tinta">Encaixe</Chip>, 'Consulta que nasceu de uma vaga recuperada pelo Zelo.'],
                ]}
              />
            </Secao>

            <Secao id="vaga" titulo="Vagas e ofertas" resumo="O caminho de uma vaga liberada até virar consulta de novo.">
              <Termos
                itens={[
                  ['Vaga aberta', 'Liberada por cancelamento ou falta de resposta, esperando o próximo da fila.'],
                  ['Em oferta', 'Oferecida a uma pessoa, que tem 15 minutos para dizer sim ou não. Nunca há duas ofertas ao mesmo tempo para a mesma vaga.'],
                  ['Preenchida', 'Alguém aceitou: a vaga virou consulta de encaixe.'],
                  ['Perdida', 'Ninguém da fila podia aceitar, ou o horário passou.'],
                  ['Tempo restante', 'Contagem regressiva da oferta; ao zerar, a vaga passa sozinha para o próximo.'],
                ]}
              />
            </Secao>

            <Secao id="impacto" titulo="Indicadores de impacto" resumo="Os quatro números do topo do painel, e como cada um é calculado.">
              <Termos
                itens={[
                  ['Vagas recuperadas', 'Quantas vagas liberadas viraram consulta de encaixe. Cada uma é uma cadeira que ficaria vazia.'],
                  ['Dias de espera economizados', 'Para cada encaixe: espera típica por uma vaga regular (45 dias, premissa ajustável) menos os dias até a consulta encaixada. Somado para todas as pessoas.'],
                  ['Taxa de comparecimento', 'Consultas realizadas ÷ (realizadas + faltas). Aparece "—" enquanto nenhuma consulta foi encerrada.'],
                  ['Moradores alertados', 'Pessoas diferentes que receberam ao menos um alerta de enchente antes da chuva.'],
                ]}
              />
            </Secao>

            <Secao id="alerta" titulo="Alerta de enchente" resumo="Quando e como o morador é avisado.">
              <Termos
                itens={[
                  ['Área de risco', 'Trecho perto de córrego, com um centro, um raio (em metros) e um limite de chuva.'],
                  ['Limite de chuva', 'Milímetros de chuva previstos para as próximas 3 horas que já alagam aquela área. Passou do limite: alerta.'],
                  ['Nível', <>Atenção (chuva no limite), Alto (1,5× o limite), <Chip cor="bg-alerta text-white">Crítico</Chip> (2× o limite ou mais).</>],
                  ['Como avisar', 'Escolha do morador para cada local: Silencioso (só na tela), Vibrar ou Alarme (vibra e toca sirene).'],
                  ['Abrigo mais perto', 'Escola pública mais próxima do local, com rota a pé no mapa.'],
                  ['Estou seguro', 'Encerra o alerta. Também funciona por voz: "tô seguro". Se a pessoa disser que não está segura, o Zelo passa os telefones da Defesa Civil (199) e dos Bombeiros (193).'],
                ]}
              />
            </Secao>

            <Secao id="fontes" titulo="De onde vêm os dados" resumo="O que é real, o que é simulado — sem letra miúda.">
              <Termos
                itens={[
                  ['Modelo de risco', <>Base pública <em>Medical Appointment No Shows</em> (Kaggle, Joni Hoppen; licença CC BY-NC-SA 4.0): {milhar(BASE.consultas)} consultas de {milhar(BASE.pacientes)} pacientes anonimizados, Vitória-ES, 2016.</>],
                  ['Pacientes da demonstração', 'Nomes e telefones inventados. Idade, hipertensão, diabetes, deficiência e Bolsa Família sorteados nas mesmas proporções da base real, por faixa etária.'],
                  ['Previsão de chuva', 'Open-Meteo (previsão horária gratuita). Na demonstração, o botão "Simular chuva forte" substitui a previsão de uma área.'],
                  ['Bairro, UBS e córregos', 'Fictícios nesta versão (marcados como exemplo); serão trocados pelo bairro de referência da equipe.'],
                ]}
              />
            </Secao>
          </div>
        </div>
      </div>
    </Layout>
  )
}
