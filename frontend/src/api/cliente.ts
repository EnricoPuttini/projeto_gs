const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** Erro de API ja com mensagem pronta para mostrar a uma pessoa (nada de stack trace). */
export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Chamada JSON com timeout. Entende o ProblemDetail (RFC 7807) do backend: usa o campo `detail`,
 * que ja vem em portugues. Falha de rede e timeout viram mensagens amigaveis.
 */
export async function api<T>(caminho: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<T> {
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), timeoutMs)
  try {
    const resp = await fetch(`${BASE}/api/v1${caminho}`, {
      ...init,
      signal: controle.signal,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
    if (!resp.ok) {
      let detalhe = 'Algo deu errado. Tente de novo.'
      try {
        const problema = (await resp.json()) as { detail?: string }
        if (problema.detail) detalhe = problema.detail
      } catch {
        /* corpo sem JSON: mantem a mensagem padrao */
      }
      throw new ApiError(detalhe, resp.status)
    }
    return resp.status === 204 ? (undefined as T) : ((await resp.json()) as T)
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('O servidor está demorando para responder. Vamos tentar de novo.', 0)
    }
    throw new ApiError('Não consegui falar com o servidor. Confira a internet.', 0)
  } finally {
    clearTimeout(timer)
  }
}

export const post = <T>(caminho: string, corpo?: unknown) =>
  api<T>(caminho, { method: 'POST', body: corpo === undefined ? undefined : JSON.stringify(corpo) })
