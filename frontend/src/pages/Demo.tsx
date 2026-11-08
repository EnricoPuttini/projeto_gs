import { useState } from 'react'
import { ApiError } from '../api/cliente'
import {
  configuracao,
  demoAvancarRelogio,
  demoCancelarConsulta,
  demoChuva,
  demoResetar,
} from '../api/endpoints'
import { formatarHora } from '../api/formato'
import { Carregando, Erro } from '../components/Estados'
import { usePolling } from '../hooks/usePolling'
import Cidadao from './Cidadao'
import Ubs from './Ubs'

interface Botao {
  rotulo: string
  executar: () => Promise<string>
  perigoso?: boolean
}

const BOTOES: Botao[] = [
  { rotulo: 'Paciente cancela consulta', executar: async () => (await demoCancelarConsulta(), 'Consulta cancelada: a vaga foi oferecida ao próximo da fila.') },
  {
    rotulo: 'Simular chuva forte no bairro',
    executar: async () => {
      const r = await demoChuva(1)
      return r.alertasCriados > 0 ? `${r.alertasCriados} alerta(s) enviados.` : 'Nenhum alerta novo (já alertado nesta hora ou sem locais na área).'
    },
  },
  {
    rotulo: 'Avançar relógio 15 min',
    executar: async () => `Agora são ${formatarHora((await demoAvancarRelogio(15)).agora)} no relógio da demo.`,
  },
  { rotulo: 'Resetar dados', perigoso: true, executar: async () => (await demoResetar(), 'Dados recarregados do começo.') },
]

/** Tela dividida da gravacao do pitch: celular da Dona Cida a esquerda, painel da UBS a direita. */
export default function Demo() {
  const cfg = usePolling(configuracao, 60_000, 'cfg')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)

  async function rodar(b: Botao) {
    setOcupado(b.rotulo)
    setAviso(null)
    try {
      setAviso({ texto: await b.executar(), erro: false })
    } catch (e) {
      setAviso({ texto: e instanceof ApiError ? e.message : 'Algo deu errado.', erro: true })
    } finally {
      setOcupado(null)
    }
  }

  if (cfg.carregando) return <Carregando texto="Verificando o modo demo…" />
  if (cfg.erro && !cfg.dados) return <div className="p-6"><Erro mensagem={cfg.erro} aoTentar={cfg.atualizar} /></div>
  if (!cfg.dados?.demoMode) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-extrabold text-petroleo">Modo demo desligado</h1>
        <p className="mt-2 text-lg">Esta tela só funciona com <strong>ZELO_DEMO_MODE=true</strong> no backend.</p>
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-tinta px-4 py-3 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
          <h1 className="mr-2 text-xl font-extrabold">Zelo · Demo</h1>
          {BOTOES.map((b) => (
            <button
              key={b.rotulo}
              type="button"
              disabled={ocupado !== null}
              onClick={() => void rodar(b)}
              className={`min-h-12 rounded-xl px-4 text-base font-bold disabled:opacity-50 ${
                b.perigoso ? 'border-2 border-white text-white' : 'bg-ambar text-tinta'
              }`}
            >
              {ocupado === b.rotulo ? 'Aguarde…' : b.rotulo}
            </button>
          ))}
          <p role="status" aria-live="polite" className={`ml-auto text-base font-semibold ${aviso?.erro ? 'text-ambar' : 'text-white'}`}>
            {aviso?.texto}
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col items-start gap-6 p-4 lg:flex-row">
        <section aria-label="Celular da Dona Cida" className="mx-auto shrink-0">
          <div className="relative h-[780px] w-[390px] overflow-hidden rounded-[2.5rem] border-8 border-tinta bg-white shadow-xl">
            <Cidadao embutido />
          </div>
        </section>
        <section aria-label="Painel da UBS" className="h-[780px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-petroleo/20 bg-fundo">
          <Ubs embutido />
        </section>
      </main>
    </div>
  )
}
