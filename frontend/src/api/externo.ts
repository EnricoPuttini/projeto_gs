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

/** Rota a pe no Google Maps (mesmo formato que o backend usa no alerta real). */
export const rotaAPe = (de: { lat: number; lng: number }, ate: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&origin=${de.lat.toFixed(6)},${de.lng.toFixed(6)}&destination=${ate.lat.toFixed(6)},${ate.lng.toFixed(6)}&travelmode=walking`
