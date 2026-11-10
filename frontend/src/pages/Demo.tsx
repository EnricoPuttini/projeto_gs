import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/cliente'
import { configuracao, demoAvancarRelogio, demoCancelarConsulta, demoChuva, demoResetar } from '../api/endpoints'
import { formatarHora } from '../api/formato'
import { Apresentacao } from '../components/Apresentacao'
import { Carregando, Erro } from '../components/Estados'
import { gsap, reduzirMovimento } from '../components/motion/gsap'
import { VAGA_ACEITA } from '../eventos'
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
    rotulo: 'Simular chuva forte no bairro',
    observe: 'A previsão passa do limite da área do córrego. O celular toca a sirene em tela cheia, com o abrigo mais perto e a rota.',
    voo: 'painel-celular',
    executar: async () => {
      const r = await demoChuva(1)
      return r.alertasCriados > 0 ? `${r.alertasCriados} moradores alertados na área de risco.` : 'Esta área já foi alertada nesta hora. Use "Recomeçar" para repetir.'
    },
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

  async function rodar(i: number) {
    const p = PASSOS[i]
    setOcupado(i)
    setAviso(null)
    try {
      setAviso({ texto: await p.executar(), erro: false })
      if (p.voo) voo(p.voo)
      setAtual(p.secundario ? 0 : Math.min(i + 1, PASSOS.length - 2))
    } catch (e) {
      setAviso({ texto: e instanceof ApiError ? e.message : 'Algo deu errado.', erro: true })
    } finally {
      setOcupado(null)
    }
  }

  let conteudo
  if (cfg.carregando) conteudo = <div className="pt-28"><Carregando texto="Verificando o modo demonstração…" /></div>
  else if (cfg.erro && !cfg.dados) conteudo = <div className="p-6 pt-28"><Erro mensagem={cfg.erro} aoTentar={cfg.atualizar} /></div>
  else if (!cfg.dados?.demoMode)
    conteudo = (
      <div className="mx-auto max-w-xl p-8 pt-28">
        <h1 className="font-display text-display-md font-semibold">Modo demonstração desligado</h1>
        <p className="mt-2 text-lg">Esta tela só funciona com <strong>ZELO_DEMO_MODE=true</strong> no servidor. Ela permite recomeçar os dados, por isso fica desligada no dia a dia.</p>
      </div>
    )
  else
    conteudo = (
      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 pb-10 pt-24 [&>*]:min-w-0 xl:grid-cols-[19rem_auto_1fr]">
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
                </li>
              )
            })}
          </ol>
          <p role="status" aria-live="polite" className={`min-h-12 rounded-xl p-3 text-base font-semibold ${aviso ? (aviso.erro ? 'bg-alerta text-white' : 'bg-petroleo text-white') : ''}`}>
            {aviso?.texto}
          </p>
        </aside>

        <section ref={celular} aria-label="Celular da Dona Cida" className="mx-auto w-full max-w-[390px]">
          <div className="relative h-[780px] w-full overflow-hidden rounded-[2.75rem] border-[10px] border-tinta bg-white shadow-2xl">
            <Cidadao embutido />
          </div>
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
