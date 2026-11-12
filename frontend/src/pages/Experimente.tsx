import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/cliente'
import { experimenteConversa, experimenteLugares, experimentePrevisao } from '../api/endpoints'
import { geocodificar, rotaAPe } from '../api/externo'
import type { Lugar } from '../api/externo'
import type { Acao, AlertaDetalhe, ContextoTeste, PendenteTeste } from '../api/tipos'
import { AlertaTelaCheia } from '../components/AlertaTelaCheia'
import { Apresentacao } from '../components/Apresentacao'
import { Carregando } from '../components/Estados'
import { IconeEnviar, IconeMic, IconeSom } from '../components/Icones'
import { Ligacao } from '../components/Ligacao'
import { MolduraCelular } from '../components/MolduraCelular'
import { confete } from '../components/motion/Confetti'
import { useFala } from '../voice/useFala'
import { useReconhecimento } from '../voice/useReconhecimento'

type Ponto = { lat: number; lng: number; descricao: string }
type Msg = { id: number; de: 'zelo' | 'voce'; texto: string; marcada?: boolean }

const ESPECIALIDADE = 'Clínica Geral'
const QUANDO = 'amanhã às 8h'
// Simulacao: o mesmo valor que a /demo usa (2x um limite tipico de 15 mm em 3 h)
const CHUVA_SIMULADA_MM = 30

let proximoId = 1

/**
 * "Experimente o Zelo": qualquer visitante coloca onde mora e testa o produto.
 * - Dados reais de onde a pessoa mora: previsao de chuva (Open-Meteo, via backend) e a unidade de saude e
 *   a escola mais proximas (OpenStreetMap).
 * - A conversa usa o MESMO interpretador do assistente real, mas sem banco: nada do visitante e gravado.
 * - Para quem nao le mensagens (60+), a vaga chega como LIGACAO falada, com resposta por voz ou botao gigante.
 */
export default function Experimente() {
  // passo 1: onde mora
  const [endereco, setEndereco] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [casa, setCasa] = useState<Ponto | null>(null)
  const [chuvaReal, setChuvaReal] = useState<{ disponivel: boolean; mm: number | null } | null>(null)
  const [saude, setSaude] = useState<Lugar | null>(null)
  const [escola, setEscola] = useState<Lugar | null>(null)
  const [lugaresStatus, setLugaresStatus] = useState<'nada' | 'buscando' | 'ok' | 'falhou'>('nada')

  // passo 2: quem usa
  const [nome, setNome] = useState('')
  const [idoso, setIdoso] = useState(true)
  const [modoLigacao, setModoLigacao] = useState(true)

  // celular simulado
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [pendente, setPendente] = useState<PendenteTeste>('NENHUM')
  const [ligando, setLigando] = useState(false)
  const [alerta, setAlerta] = useState<AlertaDetalhe | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [consultasMarcadas, setConsultasMarcadas] = useState(0)
  const fala = useFala()
  const [lerEmVozAlta, setLerEmVozAlta] = useState(true)
  const fim = useRef<HTMLDivElement>(null)
  // ultimo efeito da conversa: decide como a ligacao termina (aceitou, recusou ou so desligou)
  const ultimoEfeito = useRef<string>('NENHUM')

  // quem marca 60+ recebe a vaga por ligacao (pode desligar a opcao)
  useEffect(() => {
    setModoLigacao(idoso)
  }, [idoso])
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [msgs.length])

  const unidade = saude?.nome ?? 'unidade de saúde mais perto de você'
  const abrigoTexto = escola ? `${escola.nome}, a ${escola.metros} metros` : 'a escola pública mais perto'
  const contexto = (p: PendenteTeste): ContextoTeste => ({ pendente: p, nome: nome.trim(), especialidade: ESPECIALIDADE, unidade, quando: QUANDO, abrigo: abrigoTexto })

  function zeloDiz(t: string, extra?: Partial<Msg>) {
    setMsgs((m) => [...m, { id: proximoId++, de: 'zelo', texto: t, ...extra }])
    if (lerEmVozAlta) fala.falar(t)
  }

  async function localizar(ponto: Ponto) {
    setCasa(ponto)
    setChuvaReal(null)
    setLugaresStatus('buscando')
    experimentePrevisao(ponto.lat, ponto.lng)
      .then((p) => setChuvaReal({ disponivel: p.disponivel, mm: p.milimetrosProximas3h }))
      .catch(() => setChuvaReal({ disponivel: false, mm: null }))
    try {
      const l = await experimenteLugares(ponto.lat, ponto.lng)
      if (!l.saude && !l.escola) throw new Error('sem lugares')
      setSaude(l.saude)
      setEscola(l.escola)
      setLugaresStatus('ok')
    } catch {
      setLugaresStatus('falhou')
    }
  }

  async function buscarEndereco(e: React.FormEvent) {
    e.preventDefault()
    if (endereco.trim().length < 4) {
      setErroLocal('Escreva a rua e o bairro, ou o CEP.')
      return
    }
    setBuscando(true)
    setErroLocal(null)
    try {
      const r = await geocodificar(endereco.trim())
      if (!r) setErroLocal('Não achei esse endereço. Tente com rua, bairro e cidade.')
      else await localizar(r)
    } catch {
      setErroLocal('O serviço de mapas não respondeu. Tente de novo ou use a sua localização.')
    } finally {
      setBuscando(false)
    }
  }

  function usarLocalizacao() {
    setErroLocal(null)
    if (!('geolocation' in navigator)) {
      setErroLocal('Este aparelho não informa a localização. Digite o endereço.')
      return
    }
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBuscando(false)
        void localizar({ lat: p.coords.latitude, lng: p.coords.longitude, descricao: 'onde você está agora' })
      },
      () => {
        setBuscando(false)
        setErroLocal('Não consegui sua localização. Libere a localização ou digite o endereço.')
      },
      { timeout: 10_000 },
    )
  }

  /** Toda resposta (digitada, falada ou do botao) passa pelo backend: mesmo interpretador do assistente real. */
  async function conversar(t: string, p: PendenteTeste) {
    const r = await experimenteConversa(t, contexto(p))
    ultimoEfeito.current = r.efeito
    setPendente(r.pendente)
    setAcoes(r.acoes)
    if (r.efeito === 'ACEITOU_VAGA') {
      setConsultasMarcadas((n) => n + 1)
      confete(fim.current)
    }
    if (r.efeito === 'SEGURO') setAlerta(null)
    return r
  }

  async function enviar(t: string) {
    const limpo = t.trim()
    if (!limpo || enviando) return
    setTexto('')
    setAcoes([])
    setMsgs((m) => [...m, { id: proximoId++, de: 'voce', texto: limpo }])
    setEnviando(true)
    try {
      const r = await conversar(limpo, pendente)
      zeloDiz(r.resposta, r.efeito === 'ACEITOU_VAGA' ? { marcada: true } : undefined)
    } catch (e) {
      zeloDiz(e instanceof ApiError ? e.message : 'Não consegui responder agora. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const voz = useReconhecimento((t) => void enviar(t))

  function simularVaga() {
    setAlerta(null)
    if (modoLigacao) {
      ultimoEfeito.current = 'NENHUM'
      setPendente('OFERTA')
      setLigando(true)
      return
    }
    setPendente('OFERTA')
    setAcoes([{ rotulo: 'Sim, eu quero', texto: 'sim, eu quero' }, { rotulo: 'Não posso', texto: 'não posso' }])
    zeloDiz(`Abriu uma vaga de ${ESPECIALIDADE} ${QUANDO}. Local: ${unidade}. Você quer? Tem 15 minutos para responder.`)
  }

  function simularChuva() {
    if (!casa) return
    setLigando(false)
    setPendente('ALERTA')
    setAlerta({
      id: 0,
      localApelido: 'sua casa',
      intensidade: idoso ? 'ALARME' : 'VIBRAR',
      areaNome: 'sua rua',
      chuvaMm: CHUVA_SIMULADA_MM,
      nivel: 'CRITICO',
      abrigoNome: escola?.nome ?? null,
      abrigoEndereco: escola ? 'escola pública mais perto de você' : null,
      abrigoDistanciaMetros: escola?.metros ?? null,
      rotaUrl: escola ? rotaAPe(casa, escola) : null,
      mensagem: '',
    })
    zeloDiz(`ATENÇÃO: chuva forte prevista perto de sua casa. ${escola ? `Abrigo mais perto: ${escola.nome}, a ${escola.metros} metros.` : ''} Quando estiver seguro, diga "estou seguro".`)
  }

  function recomecar() {
    window.speechSynthesis?.cancel()
    setMsgs([])
    setAcoes([])
    setPendente('NENHUM')
    setLigando(false)
    setAlerta(null)
    setConsultasMarcadas(0)
  }

  const campo = 'min-h-12 w-full rounded-xl border-2 border-petroleo/40 bg-white px-3 text-lg'
  const passo = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-tinta/10'
  return (
    <Apresentacao largo suave={false}>
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-16 pt-8 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-petroleo">Experimente o Zelo</p>
            <h1 className="mt-2 font-display text-display-lg font-semibold text-tinta">Teste com o lugar onde você mora.</h1>
            <p className="mt-3 max-w-2xl text-lg text-tinta/85">
              Coloque o seu endereço e veja o Zelo funcionando: a previsão de chuva de verdade na sua rua, a unidade de saúde e a escola mais perto,
              e como ele te avisa de uma vaga — por mensagem ou por <strong>ligação falada</strong>, para quem não lê mensagens.
            </p>
            <p className="mt-2 text-sm text-tinta/75">
              Nada é gravado. O endereço vai só para o OpenStreetMap (achar o ponto e os lugares) e a Open-Meteo (previsão). A conversa usa as regras de
              linguagem do assistente do Zelo — sem inteligência artificial generativa, para responder sempre do mesmo jeito.
            </p>
          </div>

          <section aria-labelledby="p1" className={passo}>
            <h2 id="p1" className="text-xl font-extrabold"><span className="mr-2 rounded-full bg-tinta px-2.5 py-0.5 text-papel">1</span>Onde você mora?</h2>
            <form onSubmit={(e) => void buscarEndereco(e)} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="flex-1">
                <span className="sr-only">Endereço ou CEP</span>
                <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Ex.: Rua das Flores, 100, Jardim Ângela, São Paulo" className={campo} maxLength={160} />
              </label>
              <button type="submit" disabled={buscando} className="min-h-12 rounded-xl bg-petroleo px-5 text-lg font-bold text-white disabled:opacity-60">{buscando ? 'Buscando…' : 'Buscar'}</button>
            </form>
            <button type="button" onClick={usarLocalizacao} disabled={buscando} className="mt-2 min-h-11 rounded-xl border-2 border-petroleo px-4 text-base font-bold text-petroleo disabled:opacity-60">
              Usar onde estou agora
            </button>
            {erroLocal && <p role="alert" className="mt-2 text-base font-semibold text-alerta-escuro">{erroLocal}</p>}

            {casa && (
              <div className="mt-4 space-y-2 rounded-2xl bg-fundo p-4" aria-live="polite">
                <p className="text-base"><strong>Achei:</strong> {casa.descricao}</p>
                <p className="text-base">
                  <strong>Chuva prevista nas próximas 3 horas aí:</strong>{' '}
                  {chuvaReal === null ? 'consultando…' : chuvaReal.disponivel ? `${(chuvaReal.mm ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm (dado real, Open-Meteo)` : 'previsão indisponível agora'}
                </p>
                {lugaresStatus === 'buscando' && <p className="text-base">Procurando a unidade de saúde e a escola mais perto…</p>}
                {lugaresStatus === 'ok' && (
                  <>
                    <p className="text-base"><strong>Unidade de saúde mais perto:</strong> {saude ? `${saude.nome} (${saude.metros} m)` : 'nenhuma com nome no mapa num raio de 4 km'}</p>
                    <p className="text-base"><strong>Escola que pode servir de abrigo:</strong> {escola ? `${escola.nome} (${escola.metros} m)` : 'nenhuma com nome no mapa num raio de 2,5 km'}</p>
                  </>
                )}
                {lugaresStatus === 'falhou' && <p className="text-base">O mapa de lugares não respondeu agora; a simulação usa nomes genéricos.</p>}
                <p className="text-xs text-tinta/70">Lugares: © colaboradores do OpenStreetMap.</p>
              </div>
            )}
          </section>

          <section aria-labelledby="p2" className={passo}>
            <h2 id="p2" className="text-xl font-extrabold"><span className="mr-2 rounded-full bg-tinta px-2.5 py-0.5 text-papel">2</span>Quem vai usar?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-base font-bold">
                Primeiro nome (opcional)
                <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} placeholder="Ex.: Cida" className={campo} />
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-petroleo/30 px-3 text-base font-semibold">
                  <input type="checkbox" checked={idoso} onChange={(e) => setIdoso(e.target.checked)} className="size-5 accent-petroleo" />
                  Tenho 60 anos ou mais
                </label>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-petroleo/30 px-3 text-base font-semibold">
                  <input type="checkbox" checked={modoLigacao} onChange={(e) => setModoLigacao(e.target.checked)} className="size-5 accent-petroleo" />
                  Prefiro que o Zelo me ligue e fale (não preciso ler)
                </label>
              </div>
            </div>
          </section>

          <section aria-labelledby="p3" className={passo}>
            <h2 id="p3" className="text-xl font-extrabold"><span className="mr-2 rounded-full bg-tinta px-2.5 py-0.5 text-papel">3</span>Teste agora</h2>
            <p className="mt-1 text-base text-tinta/80">Use os botões e responda no celular ao lado — falando ou tocando.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={simularVaga} className="min-h-14 rounded-xl bg-ambar px-4 text-left text-base font-bold text-tinta">
                Simular: abriu uma vaga {modoLigacao ? '(o Zelo liga)' : '(mensagem)'}
              </button>
              <button type="button" onClick={simularChuva} disabled={!casa} className="min-h-14 rounded-xl bg-alerta px-4 text-left text-base font-bold text-white disabled:opacity-50">
                Simular: chuva forte na sua rua {casa ? '' : '(faça o passo 1)'}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={recomecar} className="min-h-11 rounded-xl border-2 border-petroleo px-4 text-base font-bold text-petroleo">Recomeçar</button>
              <p role="status" className="text-base font-semibold">Consultas marcadas nesta simulação: {consultasMarcadas}</p>
            </div>
          </section>
        </div>

        <section aria-label="Celular de teste" className="mx-auto w-full max-w-[390px] lg:sticky lg:top-6 lg:self-start">
          <MolduraCelular sempre>
            <div className="relative flex h-full flex-col bg-[#e6efe9]">
              <header className="flex items-center justify-between gap-2 bg-petroleo px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-ambar text-xl font-extrabold text-tinta">Z</span>
                  <div>
                    <p className="text-xl font-extrabold leading-tight">Zelo</p>
                    <p className="text-sm text-white/90">modo teste · nada é gravado</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={lerEmVozAlta}
                  aria-label="Ler as respostas em voz alta"
                  onClick={() => { if (lerEmVozAlta) fala.parar(); setLerEmVozAlta(!lerEmVozAlta) }}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-white ${lerEmVozAlta ? 'bg-white text-petroleo' : 'text-white'}`}
                >
                  <IconeSom />
                </button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-3" data-lenis-prevent aria-live="polite" aria-label="Conversa de teste">
                {msgs.length === 0 && (
                  <div className="rounded-2xl bg-white p-4 text-base shadow-sm">
                    <p className="text-lg font-bold">Oi! Eu sou o Zelo.</p>
                    <p className="mt-1">Faça os passos ao lado, ou fale comigo: “oi”, “minha consulta”, “tô seguro”.</p>
                  </div>
                )}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex animate-chegar ${m.de === 'voce' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-lg leading-snug shadow-sm ${m.de === 'voce' ? 'rounded-br-sm bg-[#d4efc9]' : m.marcada ? 'rounded-bl-sm border-2 border-petroleo bg-white' : 'rounded-bl-sm bg-white'}`}>
                      <span className="sr-only">{m.de === 'voce' ? 'Você disse: ' : 'Zelo disse: '}</span>
                      {m.marcada && <span className="mb-1 block text-sm font-extrabold uppercase text-petroleo">Consulta marcada</span>}
                      {m.texto}
                    </div>
                  </div>
                ))}
                {enviando && <Carregando texto="O Zelo está pensando…" />}
                <div ref={fim} />
              </div>

              {acoes.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {acoes.map((a) => (
                    <button key={a.rotulo} type="button" disabled={enviando} onClick={() => void enviar(a.texto)} className="min-h-12 rounded-full border-2 border-petroleo bg-white px-4 text-base font-bold text-petroleo disabled:opacity-50">
                      {a.rotulo}
                    </button>
                  ))}
                </div>
              )}

              <form aria-label="Enviar mensagem de teste" className="flex items-center gap-2 bg-fundo p-3" onSubmit={(e) => { e.preventDefault(); void enviar(texto) }}>
                {voz.suportado && (
                  <button type="button" aria-label={voz.ouvindo ? 'Parar de ouvir' : 'Falar com o Zelo'} aria-pressed={voz.ouvindo} onClick={voz.ouvindo ? voz.parar : voz.iniciar} className={`flex size-14 shrink-0 items-center justify-center rounded-full text-white ${voz.ouvindo ? 'animate-pulse bg-alerta' : 'bg-petroleo'}`}>
                    <IconeMic />
                  </button>
                )}
                <label className="flex-1">
                  <span className="sr-only">Escreva sua mensagem</span>
                  <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={voz.ouvindo ? 'Estou ouvindo…' : 'Escreva aqui'} maxLength={300} className="min-h-12 w-full rounded-full border-2 border-petroleo/40 bg-white px-4 text-lg" />
                </label>
                <button type="submit" aria-label="Enviar mensagem" disabled={enviando || !texto.trim()} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ambar text-tinta disabled:opacity-40">
                  <IconeEnviar />
                </button>
              </form>

              {ligando && (
                <Ligacao
                  nome={nome.trim()}
                  oferta={`Abriu uma vaga de ${ESPECIALIDADE} ${QUANDO}. Local: ${unidade}.`}
                  aoResponder={async (t) => {
                    const r = await conversar(t, 'OFERTA')
                    return { resposta: r.resposta, aceitou: r.efeito === 'ACEITOU_VAGA', terminou: r.pendente !== 'OFERTA' }
                  }}
                  aoEncerrar={() => {
                    setLigando(false)
                    // o historico do chat registra como a ligacao terminou (a pessoa pode voltar e conferir)
                    if (ultimoEfeito.current === 'ACEITOU_VAGA') {
                      setMsgs((m) => [...m, { id: proximoId++, de: 'zelo', texto: `${ESPECIALIDADE}, ${QUANDO}. Local: ${unidade}. Combinado pela ligação.`, marcada: true }])
                    } else if (ultimoEfeito.current === 'RECUSOU_VAGA') {
                      setMsgs((m) => [...m, { id: proximoId++, de: 'zelo', texto: 'Pela ligação você disse que não pode. A vaga foi para a próxima pessoa da fila.' }])
                    } else {
                      // nao atendeu ou desligou sem responder: a oferta continua valendo por mensagem
                      setPendente('OFERTA')
                      setAcoes([{ rotulo: 'Sim, eu quero', texto: 'sim, eu quero' }, { rotulo: 'Não posso', texto: 'não posso' }])
                      zeloDiz(`Liguei, mas não deu para conversar. Ainda tem uma vaga de ${ESPECIALIDADE} ${QUANDO} esperando você. Quer?`)
                    }
                  }}
                />
              )}
              {alerta && (
                <AlertaTelaCheia
                  alerta={alerta}
                  embutido
                  // sem banco: "estou seguro" no modo teste so passa pelo assistente
                  confirmar={async () => {
                    const r = await conversar('estou seguro', 'ALERTA')
                    zeloDiz(r.resposta)
                  }}
                  aoConfirmar={() => setAlerta(null)}
                />
              )}
            </div>
          </MolduraCelular>
        </section>
      </div>
    </Apresentacao>
  )
}
