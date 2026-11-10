import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/cliente'
import { configuracao, demoAvancarRelogio, demoCancelarConsulta, demoChuva, demoResetar, listarAreasRisco, listarLocais } from '../api/endpoints'
import { areasQueContem } from '../dados/geo'
import { formatarHora } from '../api/formato'
import { Apresentacao } from '../components/Apresentacao'
import { Carregando, Erro } from '../components/Estados'
import { gsap, reduzirMovimento } from '../components/motion/gsap'
import { MolduraCelular } from '../components/MolduraCelular'
import { SensorChuva } from '../components/SensorChuva'
import type { FaseEnchente } from '../components/SensorChuva'
import { ESTOU_SEGURO, VAGA_ACEITA } from '../eventos'
import { usePolling } from '../hooks/usePolling'
import Cidadao from './Cidadao'
import Ubs from './Ubs'

type Direcao = 'painel-celular' | 'celular-painel'

interface Passo {
  rotulo: string
  observe: string
  executar: () => Promise<string>
  /** para onde a "particula" voa quando o passo da certo (mostra que os dois lados estao ligados) */
  voo?: Direcao
  secundario?: boolean
  /** passo especial: simulacao encadeada da enchente (chuva sobe, area pulsa, alerta, "estou seguro") */
  enchente?: boolean
}

/** O roteiro do pitch, na ordem. Cada botao chama o MESMO caminho do backend que o sistema usa de verdade. */
const PASSOS: Passo[] = [
  {
    rotulo: 'Paciente cancela a consulta',
    observe: 'O Seu José desmarca. Em segundos a vaga chega ao celular da Dona Cida, e o painel mostra a oferta com o relógio de 15 min.',
    voo: 'painel-celular',
    executar: async () => (await demoCancelarConsulta(), 'Consulta cancelada. A vaga foi oferecida à primeira pessoa da fila.'),
  },
  {
    rotulo: 'Dona Cida aceita por voz',
    observe: 'No celular, toque no microfone e diga "quero a vaga" — ou use o botão. O encaixe aparece na agenda e "Vagas recuperadas" sobe.',
    executar: async () => 'Agora é com a Dona Cida: fale "quero a vaga" no celular ao lado.',
  },
  {
    rotulo: 'Simular alerta de enchente',
    observe: 'A chuva prevista sobe até passar o limite da área do córrego, a área pulsa e o celular toca a sirene. Depois a Dona Cida diz "estou seguro" (botão ou voz).',
    enchente: true,
    executar: async () => '',
  },
  {
    rotulo: 'Avançar o relógio 15 min',
    observe: 'Mostra o que acontece se alguém não responde: a oferta expira e a vaga passa sozinha para o próximo da fila.',
    executar: async () => `Relógio da demonstração: ${formatarHora((await demoAvancarRelogio(15)).agora)}.`,
  },
  {
    rotulo: 'Recomeçar do zero',
    observe: 'Recarrega todos os dados com as datas de hoje. Use antes de gravar.',
    secundario: true,
    executar: async () => (await demoResetar(), 'Dados recarregados. Pronto para começar.'),
  },
]

/**
 * Bolinha ambar que voa de um lado ao outro em arco: a banca VE a informacao saindo do painel e chegando
 * no celular (ou o contrario). Puramente visual; nao existe com reduced-motion.
 */
function voar(de: Element | null, para: Element | null) {
  if (!de || !para || reduzirMovimento()) return
  const a = de.getBoundingClientRect()
  const b = para.getBoundingClientRect()
  const bola = document.createElement('div')
  bola.setAttribute('aria-hidden', 'true')
  Object.assign(bola.style, {
    position: 'fixed', left: '0', top: '0', width: '20px', height: '20px', borderRadius: '9999px', zIndex: '80',
    background: '#f2b84b', boxShadow: '0 0 0 6px rgb(242 184 75 / 0.3), 0 0 24px 6px rgb(242 184 75 / 0.6)', pointerEvents: 'none',
  })
  document.body.appendChild(bola)
  const x0 = a.left + a.width / 2 - 10, y0 = a.top + a.height / 3
  const x1 = b.left + b.width / 2 - 10, y1 = b.top + b.height / 3
  gsap.set(bola, { x: x0, y: y0 })
  // x linear e y com "salto" para cima: um arco simples, legivel de longe
  gsap.timeline({ onComplete: () => bola.remove() })
    .to(bola, { x: x1, duration: 0.9, ease: 'power1.inOut' }, 0)
    .to(bola, { y: Math.min(y0, y1) - 120, duration: 0.45, ease: 'power2.out' }, 0)
    .to(bola, { y: y1, duration: 0.45, ease: 'power2.in' }, 0.45)
    .to(bola, { scale: 2.2, opacity: 0, duration: 0.3 }, 0.9)
}

/** Tela da gravacao do pitch: roteiro a esquerda, celular da Dona Cida e painel da UBS lado a lado. */
export default function Demo() {
  const cfg = usePolling(configuracao, 60_000, 'cfg')
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [atual, setAtual] = useState(0)
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)
  const [fase, setFase] = useState<FaseEnchente>('parado')
  const [mm, setMm] = useState(0)
  const areas = usePolling(listarAreasRisco, 300_000, 'areas')
  // a area simulada e a que CONTEM a casa da Dona Cida (paciente 1): e ela que precisa receber o alerta
  const locaisCida = usePolling(() => listarLocais(1), 300_000, 'locais-cida')
  const casa = locaisCida.dados?.[0]
  const area = (casa && areasQueContem(casa.lat, casa.lng, areas.dados ?? [])[0]) ?? areas.dados?.find((a) => a.id === 1)
  const sensor = useRef<HTMLDivElement>(null)
  const celular = useRef<HTMLElement>(null)
  const painel = useRef<HTMLElement>(null)

  const voo = useCallback((d: Direcao) => {
    if (d === 'painel-celular') voar(painel.current, celular.current)
    else voar(celular.current, painel.current)
  }, [])

  // a Dona Cida aceitou (botao ou voz, la no celular): a informacao viaja ate o painel e o roteiro avanca
  useEffect(() => {
    const aceitou = () => {
      voo('celular-painel')
      setAtual(2)
    }
    window.addEventListener(VAGA_ACEITA, aceitou)
    return () => window.removeEventListener(VAGA_ACEITA, aceitou)
  }, [voo])

  // "estou seguro" (botao do alerta ou voz): a confirmacao viaja do celular ao painel e o passo fecha
  const faseAtual = useRef(fase)
  faseAtual.current = fase
  useEffect(() => {
    const seguro = () => {
      if (faseAtual.current !== 'alerta') return
      setFase('seguro')
      voo('celular-painel')
      setAtual(3)
      setAviso({ texto: 'A Dona Cida está segura. "Moradores alertados" já conta o aviso no painel.', erro: false })
    }
    window.addEventListener(ESTOU_SEGURO, seguro)
    return () => window.removeEventListener(ESTOU_SEGURO, seguro)
  }, [voo])

  /** Sequencia visivel: a chuva sobe, passa do limite (area pulsa) e o alerta chega ao celular. */
  async function simularEnchente(): Promise<string> {
    const limite = area?.limiarMmHora ?? 15
    const alvo = limite * 2 // o mesmo valor que o backend usa em /demo/chuva
    setFase('chovendo')
    setMm(0)
    if (reduzirMovimento()) {
      setMm(alvo)
    } else {
      await new Promise<void>((pronto) => {
        const e = { v: 0 }
        gsap.to(e, {
          v: alvo,
          duration: 3.2,
          ease: 'power1.in',
          onUpdate: () => {
            setMm(e.v)
            if (e.v >= limite) setFase((f) => (f === 'chovendo' ? 'area' : f))
          },
          onComplete: () => pronto(),
        })
      })
      await new Promise((r) => setTimeout(r, 900)) // tempo para ver a area pulsar antes do alerta
    }
    setFase('area')
    const r = await demoChuva(area?.id ?? 1)
    voar(sensor.current, celular.current)
    setFase('alerta')
    return r.alertasCriados > 0
      ? 'Alerta enviado. Agora a Dona Cida diz "estou seguro", no botão ou por voz.'
      : 'Esta área já foi alertada nesta hora. Use "Resetar a simulação" para repetir.'
  }

  async function resetarEnchente() {
    setOcupado(2)
    try {
      await demoResetar()
      setFase('parado')
      setMm(0)
      setAtual(2)
      setAviso({ texto: 'Dados recarregados. Pode simular a enchente de novo.', erro: false })
    } catch (e) {
      setAviso({ texto: e instanceof ApiError ? e.message : 'Algo deu errado.', erro: true })
    } finally {
      setOcupado(null)
    }
  }

  async function rodar(i: number) {
    const p = PASSOS[i]
    setOcupado(i)
    setAviso(null)
    try {
      setAviso({ texto: p.enchente ? await simularEnchente() : await p.executar(), erro: false })
      if (p.voo) voo(p.voo)
      if (p.secundario) {
        setFase('parado')
        setMm(0)
      }
      // a enchente so avanca o roteiro quando a Dona Cida confirmar que esta segura
      if (!p.enchente) setAtual(p.secundario ? 0 : Math.min(i + 1, PASSOS.length - 2))
    } catch (e) {
      setAviso({ texto: e instanceof ApiError ? e.message : 'Algo deu errado.', erro: true })
    } finally {
      setOcupado(null)
    }
  }

  let conteudo
  if (cfg.carregando) conteudo = <div className="pt-10"><Carregando texto="Verificando o modo demonstração…" /></div>
  else if (cfg.erro && !cfg.dados) conteudo = <div className="p-6 pt-10"><Erro mensagem={cfg.erro} aoTentar={cfg.atualizar} /></div>
  else if (!cfg.dados?.demoMode)
    conteudo = (
      <div className="mx-auto max-w-xl p-8 pt-10">
        <h1 className="font-display text-display-md font-semibold">Modo demonstração desligado</h1>
        <p className="mt-2 text-lg">Esta tela só funciona com <strong>ZELO_DEMO_MODE=true</strong> no servidor. Ela permite recomeçar os dados, por isso fica desligada no dia a dia.</p>
      </div>
    )
  else
    conteudo = (
      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 pb-10 pt-6 [&>*]:min-w-0 xl:grid-cols-[19rem_auto_1fr]">
        <aside aria-labelledby="roteiro" className="space-y-3">
          <h1 id="roteiro" className="font-display text-display-md font-semibold">Roteiro da demonstração</h1>
          <p className="text-base text-tinta/80">Siga os passos na ordem. O celular da Dona Cida e o painel da UBS reagem sozinhos.</p>
          <ol className="space-y-2">
            {PASSOS.map((p, i) => {
              const ehAtual = i === atual && !p.secundario
              return (
                <li
                  key={p.rotulo}
                  aria-current={ehAtual ? 'step' : undefined}
                  className={`rounded-2xl p-3 transition-all duration-300 ${
                    p.secundario ? 'ring-1 ring-petroleo/20' : ehAtual ? 'bg-white shadow-lg ring-2 ring-ambar' : 'bg-white/60 ring-1 ring-petroleo/10'
                  }`}
                >
                  <button
                    type="button"
                    disabled={ocupado !== null}
                    onClick={() => void rodar(i)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-bold disabled:opacity-50 ${
                      p.secundario ? 'border-2 border-petroleo text-petroleo' : ehAtual ? 'bg-ambar text-tinta' : 'bg-fundo text-tinta hover:bg-ambar/40'
                    }`}
                  >
                    {!p.secundario && <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tinta text-sm text-white">{i + 1}</span>}
                    {ocupado === i ? 'Aguarde…' : p.rotulo}
                    {ehAtual && <span className="ml-auto rounded-full bg-tinta px-2 py-0.5 text-xs font-bold text-white">agora</span>}
                  </button>
                  <p className="mt-2 px-1 text-sm text-tinta/80">{p.observe}</p>
                  {p.enchente && fase !== 'parado' && (
                    <div ref={sensor}>
                      <SensorChuva fase={fase} mm={mm} limite={area?.limiarMmHora ?? 15} areaNome={area?.nome ?? 'do córrego'} />
                      <button
                        type="button"
                        disabled={ocupado !== null}
                        onClick={() => void resetarEnchente()}
                        className="mt-2 min-h-11 w-full rounded-xl border-2 border-petroleo px-3 text-base font-bold text-petroleo disabled:opacity-50"
                      >
                        Resetar a simulação
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          <p role="status" aria-live="polite" className={`min-h-12 rounded-xl p-3 text-base font-semibold ${aviso ? (aviso.erro ? 'bg-alerta text-white' : 'bg-petroleo text-white') : ''}`}>
            {aviso?.texto}
          </p>
        </aside>

        <section ref={celular} aria-label="Celular da Dona Cida" className="mx-auto w-full max-w-[390px]">
          <MolduraCelular sempre>
            <Cidadao embutido />
          </MolduraCelular>
          <p className="mt-2 text-center text-sm font-semibold text-tinta/70">Celular da Dona Cida, 64 anos</p>
        </section>

        <section ref={painel} aria-label="Painel da UBS" className="relative h-[820px] min-w-0 overflow-hidden rounded-2xl bg-fundo ring-1 ring-petroleo/15">
          <Ubs embutido />
        </section>
      </div>
    )

  // /demo e tela de PRODUTO (celular + painel): sem Lenis, a roda do mouse rola cada painel normalmente
  return <Apresentacao largo suave={false}>{conteudo}</Apresentacao>
}
