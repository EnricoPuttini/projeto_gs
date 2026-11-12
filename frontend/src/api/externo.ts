// Servicos publicos e gratuitos usados SO no modo "Experimente" (nada e gravado no Zelo):
// - Nominatim (OpenStreetMap): endereco -> coordenada;
// (UBS e escola mais perto vem do backend: /experimente/lugares, com User-Agent, cache e limite de 1 req/s.)
// Tudo com tempo-limite e fallback: se falhar, a simulacao segue com textos genericos.
export interface Lugar {
  nome: string
  lat: number
  lng: number
  metros: number
}

async function comLimite<T>(url: string, init: RequestInit, ms: number): Promise<T> {
  const controle = new AbortController()
  const t = setTimeout(() => controle.abort(), ms)
  try {
    const r = await fetch(url, { ...init, signal: controle.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return (await r.json()) as T
  } finally {
    clearTimeout(t)
  }
}

/** Endereco ou CEP -> ponto no mapa (so no Brasil). Vazio se nao achar. */
export async function geocodificar(endereco: string): Promise<{ lat: number; lng: number; descricao: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(endereco)}`
  const r = await comLimite<{ lat: string; lon: string; display_name: string }[]>(url, {}, 10_000)
  if (!r.length) return null
  // descricao curta: rua/bairro/cidade (os 3 primeiros pedacos do endereco completo)
  return { lat: Number(r[0].lat), lng: Number(r[0].lon), descricao: r[0].display_name.split(',').slice(0, 3).join(',') }
}

/** Plano B da previsao: se o servidor nao alcancar a Open-Meteo, o proprio navegador consulta (API aberta, com CORS). */
export async function chuvaProximas3h(lat: number, lng: number): Promise<number | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&hourly=precipitation&forecast_days=2&timezone=America%2FSao_Paulo`
  const r = await comLimite<{ hourly?: { time: string[]; precipitation: number[] } }>(url, {}, 10_000)
  if (!r.hourly) return null
  // mesma soma do backend: da hora atual (horario de Brasilia, como a API devolve) ate 3 h a frente
  const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  agora.setMinutes(0, 0, 0)
  const ini = agora.getTime(), fim = ini + 3 * 3600_000
  let total = 0
  r.hourly.time.forEach((t, i) => {
    const ms = new Date(t).getTime()
    if (ms >= ini && ms < fim) total += r.hourly!.precipitation[i] ?? 0
  })
  return Math.round(total * 10) / 10
}

/** Rota a pe no Google Maps (mesmo formato que o backend usa no alerta real). */
export const rotaAPe = (de: { lat: number; lng: number }, ate: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&origin=${de.lat.toFixed(6)},${de.lng.toFixed(6)}&destination=${ate.lat.toFixed(6)},${ate.lng.toFixed(6)}&travelmode=walking`
