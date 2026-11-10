// Icones decorativos (aria-hidden): o significado vem sempre do texto ou do aria-label do elemento que os contem.
type P = { className?: string }
const base = (className = 'size-6') =>
  ({ className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }) as const

export const IconeMic = ({ className }: P) => (
  <svg {...base(className)}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
)
export const IconeEnviar = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 12 20 4l-5 16-3-7-8-1Z" /></svg>
)
export const IconeSom = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 9v6h4l5 4V5L8 9H4ZM17 8a5 5 0 0 1 0 8" /></svg>
)
export const IconeRelogio = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const IconeCalendario = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" /></svg>
)
export const IconeAmpulheta = ({ className }: P) => (
  <svg {...base(className)}><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" /></svg>
)
export const IconePresenca = ({ className }: P) => (
  <svg {...base(className)}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 11l2 2 4-4" /></svg>
)
export const IconeChuva = ({ className }: P) => (
  <svg {...base(className)}><path d="M7 15a5 5 0 1 1 1.5-9.8A6 6 0 0 1 20 9a4 4 0 0 1-2 7H7ZM8 19l-1 2M12 19l-1 2M16 19l-1 2" /></svg>
)
export const IconeFila = ({ className }: P) => (
  <svg {...base(className)}><circle cx="6" cy="7" r="2.5" /><circle cx="12" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><path d="M2 20a4 4 0 0 1 8 0M8 20a4 4 0 0 1 8 0M14 20a4 4 0 0 1 8 0" /></svg>
)
export const IconeOferta = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 7h16v13H4zM4 7l8 6 8-6M9 3h6" /></svg>
)
export const IconeEscudo = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
)
export const IconeDados = ({ className }: P) => (
  <svg {...base(className)}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>
)
export const IconeInfo = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>
)
export const IconeSeta = ({ className }: P) => (
  <svg {...base(className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const IconeCasa = ({ className }: P) => (
  <svg {...base(className)}><path d="M3 11 12 4l9 7M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>
)
export const IconePlay = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5-6-3.5Z" /></svg>
)
export const IconeCelular = ({ className }: P) => (
  <svg {...base(className)}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
)
export const IconePainel = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 15v-3M11 15V9M15 15v-5M3 8h18" /></svg>
)
export const IconeAlfinete = ({ className }: P) => (
  <svg {...base(className)}><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6ZM12 14v7" /></svg>
)
export const IconeSetaEsq = ({ className }: P) => (
  <svg {...base(className)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
)
