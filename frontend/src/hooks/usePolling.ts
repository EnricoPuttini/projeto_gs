import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/cliente'

interface Estado<T> {
  dados: T | null
  erro: string | null
  carregando: boolean
  atualizar: () => void
}

/**
 * Busca `buscar` agora e a cada `intervaloMs`. Regras para a tela nunca quebrar:
 * - mantem o ultimo dado bom se uma atualizacao falhar (so mostra o erro por cima);
 * - nunca dispara uma busca enquanto a anterior nao terminou (API lenta nao acumula fila);
 * - pausa com a aba escondida e retoma ao voltar.
 */
export function usePolling<T>(buscar: () => Promise<T>, intervaloMs: number, chave: unknown): Estado<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const emVoo = useRef(false)
  const buscarRef = useRef(buscar)
  buscarRef.current = buscar

  const atualizar = useCallback(async () => {
    if (emVoo.current) return
    emVoo.current = true
    try {
      setDados(await buscarRef.current())
      setErro(null)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo.')
    } finally {
      emVoo.current = false
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    setCarregando(true)
    setDados(null)
    void atualizar()
    const id = setInterval(() => {
      if (!document.hidden) void atualizar()
    }, intervaloMs)
    return () => clearInterval(id)
    // `chave` troca quando muda o paciente/UBS observado
  }, [atualizar, intervaloMs, chave])

  return { dados, erro, carregando, atualizar: () => void atualizar() }
}
