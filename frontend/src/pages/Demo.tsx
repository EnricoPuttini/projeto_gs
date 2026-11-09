import { useState } from 'react'
import { ApiError } from '../api/cliente'
import { configuracao, demoAvancarRelogio, demoCancelarConsulta, demoChuva, demoResetar } from '../api/endpoints'
import { formatarHora } from '../api/formato'
import { Carregando, Erro } from '../components/Estados'
import { Layout } from '../components/Layout'
import { usePolling } from '../hooks/usePolling'
import Cidadao from './Cidadao'
import Ubs from './Ubs'

interface Passo {
  rotulo: string
  observe: string
  executar: () => Promise<string>
  secundario?: boolean
}

/** O roteiro do pitch, na ordem. Cada botao chama o MESMO caminho do backend que o sistema usa de verdade. */
const PASSOS: Passo[] = [
  {
    rotulo: 'Paciente cancela a consulta',
    observe: 'O Seu José desmarca. Em segundos a vaga chega ao celular da Dona Cida, e o painel mostra a oferta com o relógio de 15 min.',
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

/** Tela da gravacao do pitch: roteiro a esquerda, celular da Dona Cida e painel da UBS lado a lado. */
export default function Demo() {
  const cfg = usePolling(configuracao, 60_000, 'cfg')
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)

  async function rodar(i: number) {
    setOcupado(i)
    setAviso(null)
    try {
      setAviso({ texto: await PASSOS[i].executar(), erro: false })
    } catch (e) {
      setAviso({ texto: e instanceof ApiError ? e.message : 'Algo deu errado.', erro: true })
    } finally {
      setOcupado(null)
    }
  }

  let conteudo
  if (cfg.carregando) conteudo = <Carregando texto="Verificando o modo demonstração…" />
  else if (cfg.erro && !cfg.dados) conteudo = <div className="p-6"><Erro mensagem={cfg.erro} aoTentar={cfg.atualizar} /></div>
  else if (!cfg.dados?.demoMode)
    conteudo = (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-3xl font-extrabold">Modo demonstração desligado</h1>
        <p className="mt-2 text-lg">Esta tela só funciona com <strong>ZELO_DEMO_MODE=true</strong> no servidor. Ela permite recomeçar os dados, por isso fica desligada no dia a dia.</p>
      </div>
    )
  else
    conteudo = (
      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-6 xl:grid-cols-[19rem_auto_1fr]">
        <aside aria-labelledby="roteiro" className="space-y-3">
          <h1 id="roteiro" className="text-2xl font-extrabold tracking-tight">Roteiro da demonstração</h1>
          <p className="text-base text-tinta/80">Siga os passos na ordem. À direita, o celular da Dona Cida e o painel da UBS reagem sozinhos.</p>
          <ol className="space-y-2">
            {PASSOS.map((p, i) => (
              <li key={p.rotulo} className={`rounded-2xl p-3 ring-1 ${p.secundario ? 'bg-transparent ring-petroleo/20' : 'bg-white ring-petroleo/10 shadow-sm'}`}>
                <button
                  type="button"
                  disabled={ocupado !== null}
                  onClick={() => void rodar(i)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-bold disabled:opacity-50 ${
                    p.secundario ? 'border-2 border-petroleo text-petroleo' : 'bg-ambar text-tinta hover:brightness-95'
                  }`}
                >
                  {!p.secundario && <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tinta text-sm text-white">{i + 1}</span>}
                  {ocupado === i ? 'Aguarde…' : p.rotulo}
                </button>
                <p className="mt-2 px-1 text-sm text-tinta/80">{p.observe}</p>
              </li>
            ))}
          </ol>
          <p role="status" aria-live="polite" className={`min-h-12 rounded-xl p-3 text-base font-semibold ${aviso ? (aviso.erro ? 'bg-alerta text-white' : 'bg-petroleo text-white') : ''}`}>
            {aviso?.texto}
          </p>
        </aside>

        <section aria-label="Celular da Dona Cida" className="mx-auto">
          <div className="relative h-[780px] w-[390px] overflow-hidden rounded-[2.75rem] border-[10px] border-tinta bg-white shadow-2xl">
            <Cidadao embutido />
          </div>
          <p className="mt-2 text-center text-sm font-semibold text-tinta/70">Celular da Dona Cida, 64 anos</p>
        </section>

        <section aria-label="Painel da UBS" className="h-[820px] min-w-0 overflow-hidden rounded-2xl bg-fundo ring-1 ring-petroleo/15">
          <Ubs embutido />
        </section>
      </div>
    )

  return <Layout largo>{conteudo}</Layout>
}
