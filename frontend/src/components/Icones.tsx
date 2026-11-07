// Icones decorativos (aria-hidden): o significado vem sempre do texto ou do aria-label do botao que os contem.
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const IconeMic = () => (
  <svg {...base}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
)
export const IconeEnviar = () => (
  <svg {...base}><path d="M4 12 20 4l-5 16-3-7-8-1Z" /></svg>
)
export const IconeSom = () => (
  <svg {...base}><path d="M4 9v6h4l5 4V5L8 9H4ZM17 8a5 5 0 0 1 0 8" /></svg>
)
export const IconeRelogio = () => (
  <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
