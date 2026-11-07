import { useEffect, useState } from 'react'

/** Booleano guardado no navegador. localStorage pode estar bloqueado (aba anonima): nesse caso so nao persiste. */
export function usePreferencia(nome: string, padrao: boolean): [boolean, (v: boolean) => void] {
  const [valor, setValor] = useState<boolean>(() => {
    try {
      const salvo = localStorage.getItem(`zelo.${nome}`)
      return salvo === null ? padrao : salvo === '1'
    } catch {
      return padrao
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(`zelo.${nome}`, valor ? '1' : '0')
    } catch {
      /* sem persistencia */
    }
  }, [nome, valor])

  return [valor, setValor]
}
