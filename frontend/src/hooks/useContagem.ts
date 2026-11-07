import { useEffect, useState } from 'react'

/**
 * Contagem regressiva a partir de `segundosIniciais` (vindos do servidor). Usa o relogio do
 * servidor como verdade: o celular pode estar com a hora errada. Reinicia quando o servidor manda valor novo.
 */
export function useContagem(segundosIniciais: number, chave: unknown): number {
  const [restantes, setRestantes] = useState(segundosIniciais)

  useEffect(() => {
    const fim = Date.now() + segundosIniciais * 1000
    setRestantes(segundosIniciais)
    const id = setInterval(() => setRestantes(Math.max(0, Math.round((fim - Date.now()) / 1000))), 500)
    return () => clearInterval(id)
  }, [segundosIniciais, chave])

  return restantes
}
