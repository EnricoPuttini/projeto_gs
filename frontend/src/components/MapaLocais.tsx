import { useMemo, useState } from 'react'
import { ApiError } from '../api/cliente'
import { criarLocal, listarAbrigos, listarAreasRisco, listarUbs } from '../api/endpoints'
import type { Abrigo, AreaRisco, Intensidade, LocalSalvo, TipoLocal, Ubs } from '../api/tipos'
import { areasQueContem, distanciaMetros } from '../dados/geo'
import { usePolling } from '../hooks/usePolling'

// Centro do bairro do seed (perto da casa da Dona Cida); o recorte depois se ajusta para caber todos os pontos.
const CENTRO = { lat: -23.5645, lng: -46.6445 }
const W = 400
const H = 280
const M_POR_GRAU_LAT = 110_540
const M_POR_GRAU_LNG = 111_320 * Math.cos((CENTRO.lat * Math.PI) / 180)
const MARGEM_M = 180 // folga ao redor dos pontos
const RAIO_RECORTE_M = 1100 // o recorte mostra a vizinhanca da casa, nao a cidade inteira

type Ponto = { lat: number; lng: number }

/** Projecao simples (metros -> pixels), sem distorcer: a escala e a mesma nos dois eixos. */
function usarProjecao(pontos: Ponto[]) {
  return useMemo(() => {
    const todos = pontos.length ? pontos : [CENTRO]
    const lats = todos.map((p) => p.lat)
    const lngs = todos.map((p) => p.lng)
    const c = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 }
    const largM = (Math.max(...lngs) - Math.min(...lngs)) * M_POR_GRAU_LNG + 2 * MARGEM_M
    const altM = (Math.max(...lats) - Math.min(...lats)) * M_POR_GRAU_LAT + 2 * MARGEM_M
    const mPorPx = Math.max(largM / W, altM / H, 2)
    return {
      mPorPx,
      x: (lng: number) => W / 2 + ((lng - c.lng) * M_POR_GRAU_LNG) / mPorPx,
      y: (lat: number) => H / 2 - ((lat - c.lat) * M_POR_GRAU_LAT) / mPorPx,
      ponto: (px: number, py: number): Ponto => ({ lng: c.lng + ((px - W / 2) * mPorPx) / M_POR_GRAU_LNG, lat: c.lat - ((py - H / 2) * mPorPx) / M_POR_GRAU_LAT }),
    }
  }, [pontos])
}

/** Curva suave (Catmull-Rom -> Bezier) passando pelos pontos: usada no desenho do corrego. */
function curva(p: [number, number][]) {
  if (p.length < 2) return ''
  let d = `M${p[0][0]},${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b, c2, e] = [p[i - 1] ?? p[i], p[i], p[i + 1], p[i + 2] ?? p[i + 1]]
    d += ` C${b[0] + (c2[0] - a[0]) / 6},${b[1] + (c2[1] - a[1]) / 6} ${c2[0] - (e[0] - b[0]) / 6},${c2[1] - (e[1] - b[1]) / 6} ${c2[0]},${c2[1]}`
  }
  return d
}

// sem o "(PLACEHOLDER)" dos dados de exemplo e sem nome comprido cobrindo o mapa
const curto = (s: string, n = 22) => {
  const t = s.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

/** Rotulo com contorno branco (legivel sobre ruas e quadras). */
function Rotulo({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#17211f" stroke="#fff" strokeWidth="3" paintOrder="stroke" style={{ pointerEvents: 'none' }}>
      {children}
    </text>
  )
}

function MarcadorLocal({ x, y, tipo }: { x: number; y: number; tipo: TipoLocal }) {
  return (
    <g transform={`translate(${x - 12} ${y - 12}) scale(0.7)`}>
      <circle cx="17" cy="17" r="15" fill="#0f5c57" stroke="#fff" strokeWidth="3" />
      {tipo === 'CASA' ? <path d="M10 17l7-6 7 6v7H10z" fill="#fff" /> : <circle cx="17" cy="17" r="4.5" fill="#fff" />}
    </g>
  )
}

/**
 * "Meus locais" num MAPA ILUSTRADO do bairro (recorte simulado em SVG): ruas, avenidas, o corrego passando pelas
 * areas de alagamento, UBS e abrigos nas coordenadas reais do sistema. Nao depende de servico de mapas externo
 * (o OpenStreetMap bloqueava os tiles no site publicado), funciona sem internet e e leve.
 * Tocar no mapa marca um novo local; o formulario abaixo continua sendo o caminho por teclado e leitor de tela.
 */
function MapaBairro({ locais, areas, abrigos, ubs, novo, aoTocar }: { locais: LocalSalvo[]; areas: AreaRisco[]; abrigos: Abrigo[]; ubs: Ubs[]; novo: Ponto | null; aoTocar: (p: Ponto) => void }) {
  // recorte: a vizinhanca da casa (ou do primeiro local); o que fica longe nao entra no enquadramento
  const casa = locais.find((l) => l.tipo === 'CASA') ?? locais[0] ?? CENTRO
  const perto = useMemo(() => {
    const dentro = (p: Ponto) => distanciaMetros(casa.lat, casa.lng, p.lat, p.lng) <= RAIO_RECORTE_M
    return [casa, ...locais.filter(dentro), ...abrigos.filter(dentro), ...ubs.filter(dentro), ...areas.filter(dentro)].map((p) => ({ lat: p.lat, lng: p.lng }))
  }, [casa, locais, abrigos, ubs, areas])
  const { x, y, ponto, mPorPx } = usarProjecao(perto)
  // quadras proporcionais ao zoom: nunca menos de ~30 px entre ruas
  const passo = ([100, 150, 200, 300, 400, 600].find((m) => m / mPorPx >= 30) ?? 800) / mPorPx

  // ruas: grade fixa no espaco (alinhada a um ponto de referencia, para nao "andar" quando um local e salvo)
  const x0 = x(CENTRO.lng) % passo
  const y0 = y(CENTRO.lat) % passo
  const verticais = Array.from({ length: Math.ceil(W / passo) + 2 }, (_, i) => x0 + (i - 1) * passo)
  const horizontais = Array.from({ length: Math.ceil(H / passo) + 2 }, (_, i) => y0 + (i - 1) * passo)
  const avenidaH = horizontais.reduce((m, v) => (Math.abs(v - H * 0.3) < Math.abs(m - H * 0.3) ? v : m), horizontais[0])
  const avenidaV = verticais.reduce((m, v) => (Math.abs(v - W * 0.68) < Math.abs(m - W * 0.68) ? v : m), verticais[0])

  // corrego: entra pela esquerda, passa pelo centro de cada area de alagamento e sai pela direita
  const centros = [...areas].sort((a, b) => a.lng - b.lng).map((a) => [x(a.lng), y(a.lat)] as [number, number])
  const rio: [number, number][] = centros.length
    ? [[-20, centros[0][1] + 30], ...centros, [W + 20, centros[centros.length - 1][1] - 25]]
    : [[-20, H * 0.75], [W / 2, H * 0.68], [W + 20, H * 0.8]]

  // praca: uma quadra inteira longe do corrego
  const praca = { x: verticais[1] ?? 0, y: horizontais[1] ?? 0 }
  const escala200 = 200 / mPorPx

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full cursor-crosshair touch-manipulation rounded-xl"
      role="img"
      aria-label={`Mapa ilustrado do bairro: ${locais.length} local(is) seu(s), ${areas.length} área(s) de alagamento, ${abrigos.length} abrigo(s) e ${ubs.length} UBS.`}
      onClick={(e) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
        aoTocar(ponto(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H))
      }}
    >
      <defs>
        <clipPath id="recorte-bairro"><rect width={W} height={H} rx="12" /></clipPath>
      </defs>
      <g clipPath="url(#recorte-bairro)">
      <rect width={W} height={H} fill="#e7ece2" />
      <rect x={praca.x + 4} y={praca.y + 4} width={passo - 8} height={passo - 8} rx="6" fill="#bfd8b0" />
      {verticais.map((v) => <line key={`v${v}`} x1={v} x2={v} y1={0} y2={H} stroke="#fff" strokeWidth="5" />)}
      {horizontais.map((h) => <line key={`h${h}`} x1={0} x2={W} y1={h} y2={h} stroke="#fff" strokeWidth="5" />)}
      <line x1={0} x2={W} y1={avenidaH} y2={avenidaH} stroke="#f6dfa6" strokeWidth="11" />
      <line x1={avenidaV} x2={avenidaV} y1={0} y2={H} stroke="#f6dfa6" strokeWidth="11" />

      {areas.map((a) => (
        <circle key={`a${a.id}`} cx={x(a.lng)} cy={y(a.lat)} r={a.raioMetros / mPorPx} fill="#c2410c" fillOpacity="0.22" stroke="#c2410c" strokeWidth="1.5" strokeDasharray="5 4">
          <title>Área de alagamento: {a.nome}</title>
        </circle>
      ))}
      <path d={curva(rio)} fill="none" stroke="#7fb6d6" strokeWidth="7" strokeLinecap="round" />
      <path d={curva(rio)} fill="none" stroke="#a9d1e6" strokeWidth="3" strokeLinecap="round" />

      <Rotulo x={58} y={avenidaH - 8}>Avenida Central</Rotulo>
      <Rotulo x={praca.x + passo / 2} y={praca.y + passo / 2 + 3}>Praça</Rotulo>
      {rio.length > 2 && <Rotulo x={(rio[0][0] + rio[1][0]) / 2 + 30} y={(rio[0][1] + rio[1][1]) / 2 + 16}>Córrego</Rotulo>}

      {ubs.map((u) => (
        <g key={`u${u.id}`}>
          <title>UBS: {u.nome}</title>
          <circle cx={x(u.lng)} cy={y(u.lat)} r="10" fill="#fff" stroke="#c2410c" strokeWidth="2.5" />
          <path d={`M${x(u.lng) - 5} ${y(u.lat)}h10M${x(u.lng)} ${y(u.lat) - 5}v10`} stroke="#c2410c" strokeWidth="3" />
          <Rotulo x={x(u.lng)} y={y(u.lat) + 21}>{curto(u.nome)}</Rotulo>
        </g>
      ))}
      {abrigos.map((a) => (
        <g key={`b${a.id}`}>
          <title>Abrigo: {a.nome}</title>
          <path d={`M${x(a.lng)} ${y(a.lat) - 11}l9 5v6c0 5-4 8-9 9-5-1-9-4-9-9v-6z`} fill="#f2b84b" stroke="#17211f" strokeWidth="1.5" />
          <Rotulo x={x(a.lng)} y={y(a.lat) + 20}>{curto(a.nome)}</Rotulo>
        </g>
      ))}
      {locais.map((l) => (
        <g key={`l${l.id}`}>
          <title>Seu local: {l.apelido}</title>
          <MarcadorLocal x={x(l.lng)} y={y(l.lat)} tipo={l.tipo} />
          <Rotulo x={x(l.lng)} y={y(l.lat) - 15}>{curto(l.apelido, 18)}</Rotulo>
        </g>
      ))}
      {novo && (
        <g>
          <circle cx={x(novo.lng)} cy={y(novo.lat)} r="11" fill="#c2410c" stroke="#fff" strokeWidth="3" />
          <path d={`M${x(novo.lng) - 5} ${y(novo.lat)}h10M${x(novo.lng)} ${y(novo.lat) - 5}v10`} stroke="#fff" strokeWidth="3" />
        </g>
      )}

      </g>
      {/* escala e norte */}
      <g transform={`translate(10 ${H - 14})`}>
        <rect x="-4" y="-13" width={escala200 + 40} height="22" rx="4" fill="#fff" fillOpacity="0.85" />
        <line x1="0" x2={escala200} y1="0" y2="0" stroke="#17211f" strokeWidth="2.5" />
        <text x={escala200 + 6} y="4" fontSize="10" fill="#17211f">200 m</text>
      </g>
      <g transform={`translate(${W - 20} 22)`}>
        <circle r="13" fill="#fff" fillOpacity="0.85" />
        <path d="M0 -9l5 11h-10z" fill="#17211f" />
        <text y="10" textAnchor="middle" fontSize="8" fontWeight="700" fill="#17211f">N</text>
      </g>
    </svg>
  )
}

function Legenda() {
  const item = 'flex items-center gap-1.5'
  return (
    <ul aria-hidden className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta/85">
      <li className={item}><span className="inline-block size-3.5 rounded-full bg-petroleo" /> Seus locais</li>
      <li className={item}><span className="inline-block size-3.5 rounded-full border-2 border-dashed border-alerta bg-alerta/20" /> Área de alagamento</li>
      <li className={item}><span className="inline-block size-3.5 rounded bg-ambar" /> Abrigo</li>
      <li className={item}><span className="inline-block size-3.5 rounded-full border-2 border-alerta bg-white" /> UBS</li>
      <li className={item}><span className="inline-block h-1.5 w-4 rounded bg-[#7fb6d6]" /> Córrego</li>
    </ul>
  )
}

const INTENSIDADES: { valor: Intensidade; rotulo: string }[] = [
  { valor: 'SILENCIOSO', rotulo: 'Silencioso' },
  { valor: 'VIBRAR', rotulo: 'Vibrar' },
  { valor: 'ALARME', rotulo: 'Alarme' },
]

/**
 * Mapa de "Meus locais". Carregado sob demanda (React.lazy).
 * Nao e o unico jeito de cadastrar: a lista e o formulario continuam, inclusive para leitor de tela.
 */
export default function MapaLocais({ pacienteId, locais, aoSalvar }: { pacienteId: number; locais: LocalSalvo[]; aoSalvar: () => void }) {
  const areas = usePolling(listarAreasRisco, 300_000, 'mapa-areas')
  const abrigos = usePolling(listarAbrigos, 300_000, 'mapa-abrigos')
  const unidades = usePolling(listarUbs, 300_000, 'mapa-ubs')
  const [novo, setNovo] = useState<Ponto | null>(null)
  const [apelido, setApelido] = useState('')
  const [tipo, setTipo] = useState<TipoLocal>('CASA')
  const [intensidade, setIntensidade] = useState<Intensidade>('VIBRAR')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const listaAreas = useMemo(() => areas.dados ?? [], [areas.dados])
  const emRisco = novo ? areasQueContem(novo.lat, novo.lng, listaAreas) : []

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!novo) return
    if (!apelido.trim()) {
      setErro('Dê um nome ao local, como "Casa da minha filha".')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await criarLocal(pacienteId, { apelido: apelido.trim(), lat: novo.lat, lng: novo.lng, tipo, intensidade, ativo: true })
      setNovo(null)
      setApelido('')
      aoSalvar()
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não consegui salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const campo = 'min-h-11 w-full rounded-lg border-2 border-petroleo/40 bg-white px-2 text-base'
  return (
    <section aria-label="Mapa dos seus locais" className="rounded-2xl bg-white p-3 shadow-sm">
      <h2 className="text-lg font-extrabold">Mapa do bairro</h2>
      <p className="mb-2 text-sm text-tinta/85">
        Toque no mapa para marcar um novo local. Laranja = área de alagamento. Também dá para cadastrar pelo formulário mais abaixo.
      </p>

      <MapaBairro locais={locais} areas={listaAreas} abrigos={abrigos.dados ?? []} ubs={unidades.dados ?? []} novo={novo} aoTocar={setNovo} />
      <Legenda />
      <p className="mt-1 text-xs text-tinta/70">Mapa ilustrativo (simulação): ruas desenhadas; UBS, abrigos e áreas nas posições cadastradas no Zelo.</p>

      {novo && (
        <form onSubmit={(e) => void salvar(e)} className="mt-3 space-y-2 rounded-xl bg-fundo p-3">
          <p className="text-base font-bold">Novo local no mapa</p>
          {emRisco.length > 0 ? (
            <p role="alert" className="rounded-lg bg-alerta/10 p-2 text-sm font-bold text-alerta-escuro">
              Este local fica em área de alagamento ({emRisco[0].nome}). Você vai receber alerta de chuva forte aqui.
            </p>
          ) : (
            <p role="status" className="text-sm text-tinta/80">Fora das áreas de alagamento conhecidas.</p>
          )}
          <label className="block text-sm font-bold">
            Nome do local
            <input value={apelido} onChange={(e) => setApelido(e.target.value)} maxLength={60} placeholder="Ex.: Casa da minha filha" className={campo} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-bold">
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoLocal)} className={campo}>
                <option value="CASA">Casa</option>
                <option value="TRABALHO">Trabalho</option>
                <option value="FAMILIA">Família</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            <label className="block text-sm font-bold">
              Como avisar
              <select value={intensidade} onChange={(e) => setIntensidade(e.target.value as Intensidade)} className={campo}>
                {INTENSIDADES.map((i) => <option key={i.valor} value={i.valor}>{i.rotulo}</option>)}
              </select>
            </label>
          </div>
          {erro && <p role="alert" className="text-sm font-semibold text-alerta-escuro">{erro}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setNovo(null)} className="min-h-11 rounded-lg border-2 border-petroleo font-bold text-petroleo">Cancelar</button>
            <button type="submit" disabled={salvando} className="min-h-11 rounded-lg bg-petroleo font-bold text-white disabled:opacity-60">{salvando ? 'Salvando…' : 'Salvar local'}</button>
          </div>
        </form>
      )}
    </section>
  )
}
