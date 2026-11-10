// Mesma formula do backend (br.com.zelo.bo.Geo): distancia em linha reta (Haversine), em metros.
const RAIO_TERRA_M = 6_371_008.8

export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(a))
}

/** Areas de risco que contem o ponto (mesma regra do alerta: distancia ate o centro <= raio). */
export function areasQueContem<T extends { lat: number; lng: number; raioMetros: number }>(lat: number, lng: number, areas: T[]): T[] {
  return areas.filter((a) => distanciaMetros(lat, lng, a.lat, a.lng) <= a.raioMetros)
}
