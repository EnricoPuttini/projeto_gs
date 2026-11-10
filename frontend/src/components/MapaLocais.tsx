import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { ApiError } from '../api/cliente'
import { criarLocal, listarAbrigos, listarAreasRisco, listarUbs } from '../api/endpoints'
import type { Abrigo, AreaRisco, Intensidade, LocalSalvo, TipoLocal, Ubs } from '../api/tipos'
import { areasQueContem } from '../dados/geo'
import { usePolling } from '../hooks/usePolling'

// Centro do bairro do seed (perto da casa da Dona Cida); o mapa depois se ajusta para caber todos os pontos.
const CENTRO: [number, number] = [-23.5645, -46.6445]

type Ponto = { lat: number; lng: number }

/** Icones em SVG proprio (divIcon): nada de imagem externa, nem o PNG padrao do Leaflet que quebra no bundler. */
function icone(cor: string, desenho: string, tamanho = 34) {
  return L.divIcon({
    className: 'zelo-marcador',
    html: `<svg viewBox="0 0 34 34" width="${tamanho}" height="${tamanho}" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="${cor}" stroke="#fff" stroke-width="3"/>${desenho}</svg>`,
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2],
  })
}
const DESENHO_TIPO: Record<TipoLocal, string> = {
  CASA: '<path d="M10 17l7-6 7 6v7H10z" fill="#fff"/>',
  TRABALHO: '<rect x="10" y="13" width="14" height="10" rx="1.5" fill="#fff"/><rect x="14" y="10" width="6" height="4" fill="none" stroke="#fff" stroke-width="2"/>',
  FAMILIA: '<circle cx="13.5" cy="14" r="3" fill="#fff"/><circle cx="20.5" cy="14" r="3" fill="#fff"/><path d="M9 24c0-4 9-4 9 0M16 24c0-4 9-4 9 0" fill="#fff"/>',
  OUTRO: '<circle cx="17" cy="17" r="4.5" fill="#fff"/>',
}
const ICONE_LOCAL = Object.fromEntries(Object.entries(DESENHO_TIPO).map(([t, d]) => [t, icone('#0f5c57', d)])) as Record<TipoLocal, L.DivIcon>
const ICONE_ABRIGO = icone('#f2b84b', '<path d="M17 9l7 4v5c0 4-3 6-7 7-4-1-7-3-7-7v-5z" fill="#17211f"/>')
const ICONE_UBS = icone('#ffffff', '<path d="M14 10h6v4h4v6h-4v4h-6v-4h-4v-6h4z" fill="#c2410c"/>')
const ICONE_NOVO = icone('#c2410c', '<path d="M17 10v14M10 17h14" stroke="#fff" stroke-width="3"/>', 40)

/** Ajusta o zoom para mostrar todos os pontos (uma vez, quando os dados chegam). */
function Enquadrar({ pontos }: { pontos: Ponto[] }) {
  const mapa = useMap()
  const chave = pontos.length
  useEffect(() => {
    if (pontos.length > 1) mapa.fitBounds(L.latLngBounds(pontos.map((p) => [p.lat, p.lng])), { padding: [24, 24] })
    // reenquadra so quando a quantidade de pontos muda (nao a cada polling)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, mapa])
  return null
}

function AoTocar({ aoTocar }: { aoTocar: (p: Ponto) => void }) {
  useMapEvents({ click: (e) => aoTocar({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/**
 * Mapa simplificado em SVG, usado quando os tiles do OpenStreetMap nao carregam (sem internet).
 * Mesmos pontos, mesma regra; tocar tambem marca um local.
 */
function MapaSvg({ locais, areas, abrigos, ubs, novo, aoTocar }: { locais: LocalSalvo[]; areas: AreaRisco[]; abrigos: Abrigo[]; ubs: Ubs[]; novo: Ponto | null; aoTocar: (p: Ponto) => void }) {
  const todos: Ponto[] = [...locais, ...abrigos, ...ubs, ...areas]
  const lats = todos.map((p) => p.lat).concat(CENTRO[0])
  const lngs = todos.map((p) => p.lng).concat(CENTRO[1])
  const pad = 0.006
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats) - pad, Math.max(...lats) + pad, Math.min(...lngs) - pad, Math.max(...lngs) + pad]
  const W = 400, H = 260
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * W
  const y = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * H
  const pxPorMetro = W / ((maxLng - minLng) * 111_320 * Math.cos((CENTRO[0] * Math.PI) / 180))
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-64 w-full cursor-crosshair rounded-xl bg-[#e8efe9]"
      role="img"
      aria-label={`Mapa simplificado do bairro: ${locais.length} local(is) seu(s), ${areas.length} áreas de risco e ${abrigos.length} abrigos.`}
      onClick={(e) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
        const px = ((e.clientX - r.left) / r.width) * W
        const py = ((e.clientY - r.top) / r.height) * H
        aoTocar({ lng: minLng + (px / W) * (maxLng - minLng), lat: maxLat - (py / H) * (maxLat - minLat) })
      }}
    >
      {areas.map((a) => (
        <circle key={`a${a.id}`} cx={x(a.lng)} cy={y(a.lat)} r={a.raioMetros * pxPorMetro} fill="#c2410c" fillOpacity="0.2" stroke="#c2410c" strokeDasharray="5 4" />
      ))}
      {ubs.map((u) => <g key={`u${u.id}`}><circle cx={x(u.lng)} cy={y(u.lat)} r="8" fill="#fff" stroke="#c2410c" strokeWidth="2" /><path d={`M${x(u.lng) - 4} ${y(u.lat)}h8M${x(u.lng)} ${y(u.lat) - 4}v8`} stroke="#c2410c" strokeWidth="2.5" /></g>)}
      {abrigos.map((a) => <rect key={`b${a.id}`} x={x(a.lng) - 7} y={y(a.lat) - 7} width="14" height="14" rx="3" fill="#f2b84b" stroke="#17211f" />)}
      {locais.map((l) => <circle key={`l${l.id}`} cx={x(l.lng)} cy={y(l.lat)} r="8" fill="#0f5c57" stroke="#fff" strokeWidth="2.5" />)}
      {novo && <circle cx={x(novo.lng)} cy={y(novo.lat)} r="9" fill="#c2410c" stroke="#fff" strokeWidth="3" />}
    </svg>
  )
}

const INTENSIDADES: { valor: Intensidade; rotulo: string }[] = [
  { valor: 'SILENCIOSO', rotulo: 'Silencioso' },
  { valor: 'VIBRAR', rotulo: 'Vibrar' },
  { valor: 'ALARME', rotulo: 'Alarme' },
]

/**
 * Mapa de "Meus locais" (Leaflet + OpenStreetMap, sem chave de API). Carregado sob demanda (React.lazy).
 * Nao e o unico jeito de cadastrar: a lista e o formulario continuam, inclusive para leitor de tela.
 */
export default function MapaLocais({ pacienteId, locais, aoSalvar }: { pacienteId: number; locais: LocalSalvo[]; aoSalvar: () => void }) {
  const areas = usePolling(listarAreasRisco, 300_000, 'mapa-areas')
  const abrigos = usePolling(listarAbrigos, 300_000, 'mapa-abrigos')
  const unidades = usePolling(listarUbs, 300_000, 'mapa-ubs')
  const [semTiles, setSemTiles] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const [novo, setNovo] = useState<Ponto | null>(null)
  const [apelido, setApelido] = useState('')
  const [tipo, setTipo] = useState<TipoLocal>('CASA')
  const [intensidade, setIntensidade] = useState<Intensidade>('VIBRAR')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const listaAreas = useMemo(() => areas.dados ?? [], [areas.dados])
  const emRisco = novo ? areasQueContem(novo.lat, novo.lng, listaAreas) : []
  const pontos: Ponto[] = [...locais, ...(abrigos.dados ?? []), ...(unidades.dados ?? [])]

  // tiles que falham seguidos (sem internet, OSM fora): troca para o mapa SVG, sem quebrar a tela
  const [falhas, setFalhas] = useState(0)
  useEffect(() => {
    if (falhas >= 3) setSemTiles(true)
  }, [falhas])

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
      <h2 className="text-lg font-extrabold">Mapa</h2>
      <p className="mb-2 text-sm text-tinta/85">
        Toque no mapa para marcar um novo local. Laranja = área de alagamento. Também dá para cadastrar pelo formulário mais abaixo.
      </p>

      {semTiles ? (
        <>
          <p role="status" className="mb-2 rounded-lg bg-ambar/30 p-2 text-sm font-semibold">Sem internet para o mapa detalhado: mostrando o mapa simplificado.</p>
          <MapaSvg locais={locais} areas={listaAreas} abrigos={abrigos.dados ?? []} ubs={unidades.dados ?? []} novo={novo} aoTocar={setNovo} />
        </>
      ) : (
        <div className="h-64 overflow-hidden rounded-xl" data-lenis-prevent>
          <MapContainer center={CENTRO} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              eventHandlers={{ tileerror: () => setFalhas((n) => n + 1), tileload: () => setFalhas(0) }}
            />
            <Enquadrar pontos={pontos} />
            <AoTocar aoTocar={setNovo} />
            {listaAreas.map((a) => (
              <Circle key={a.id} center={[a.lat, a.lng]} radius={a.raioMetros} pathOptions={{ color: '#c2410c', fillColor: '#c2410c', fillOpacity: 0.2, weight: 2 }}>
                <Tooltip>Área de alagamento: {a.nome}</Tooltip>
              </Circle>
            ))}
            {(unidades.dados ?? []).map((u) => (
              <Marker key={`u${u.id}`} position={[u.lat, u.lng]} icon={ICONE_UBS} title={`UBS: ${u.nome}`} />
            ))}
            {(abrigos.dados ?? []).map((a) => (
              <Marker key={`b${a.id}`} position={[a.lat, a.lng]} icon={ICONE_ABRIGO} title={`Abrigo: ${a.nome}`} />
            ))}
            {locais.map((l) => (
              <Marker key={`l${l.id}`} position={[l.lat, l.lng]} icon={ICONE_LOCAL[l.tipo]} title={`Seu local: ${l.apelido}`} />
            ))}
            {novo && (
              <Marker
                position={[novo.lat, novo.lng]}
                icon={ICONE_NOVO}
                draggable
                title="Novo local (arraste para ajustar)"
                eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); setNovo({ lat: p.lat, lng: p.lng }) } }}
              />
            )}
          </MapContainer>
        </div>
      )}

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
