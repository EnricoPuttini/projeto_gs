import { useEffect, useRef, useState } from 'react'

/**
 * Ids que CHEGARAM depois da primeira carga (ex.: mensagem nova no chat, encaixe novo na agenda).
 * A primeira lista e considerada "ja vista": so o que muda depois merece animacao.
 * Cada id fica marcado como novo por `duracaoMs` (tempo do destaque visual).
 */
export function useNovos(ids: number[] | undefined, duracaoMs = 2000): Set<number> {
  const vistos = useRef<Set<number> | null>(null)
  const [novos, setNovos] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!ids) return
    if (vistos.current === null) {
      vistos.current = new Set(ids)
      return
    }
    const chegaram = ids.filter((id) => !vistos.current!.has(id))
    if (chegaram.length === 0) return
    chegaram.forEach((id) => vistos.current!.add(id))
    setNovos((atual) => new Set([...atual, ...chegaram]))
    const t = setTimeout(() => setNovos((atual) => new Set([...atual].filter((id) => !chegaram.includes(id)))), duracaoMs)
    return () => clearTimeout(t)
  }, [ids, duracaoMs])

  return novos
}
