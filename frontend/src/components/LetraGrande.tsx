import { useEffect } from 'react'
import { usePreferencia } from '../hooks/usePreferencia'

/** Botao "letra grande": liga uma classe no <html> que aumenta a fonte-base e, com ela, toda a interface. */
export function LetraGrande({ claro = false, compacto = false }: { claro?: boolean; compacto?: boolean }) {
  const [ligada, setLigada] = usePreferencia('letra-grande', false)

  useEffect(() => {
    document.documentElement.classList.toggle('letra-grande', ligada)
  }, [ligada])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      onClick={() => setLigada(!ligada)}
      className={`min-h-11 rounded-lg border-2 px-3 text-base font-bold ${
        claro ? 'border-white text-white' : 'border-petroleo text-petroleo'
      } ${ligada ? (claro ? 'bg-white text-petroleo' : 'bg-petroleo text-white') : ''}`}
    >
      <span aria-hidden>A+</span> <span className="sr-only">Letra grande</span>
      {!compacto && <span className="ml-1 text-sm font-medium">{ligada ? 'Ligada' : 'Letra grande'}</span>}
    </button>
  )
}
