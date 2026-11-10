/**
 * "Sensor" visual do passo da enchente na /demo: a chuva prevista sobe ate passar o limite da area,
 * e a area de risco do mini mapa pulsa em laranja. Os numeros vem da API (limite real da area) e do
 * mesmo valor que o backend usa na simulacao (2x o limite). Nada aqui altera dado: e so a visualizacao.
 */
export type FaseEnchente = 'parado' | 'chovendo' | 'area' | 'alerta' | 'seguro'

const ROTULO: Record<FaseEnchente, string> = {
  parado: 'Sem chuva forte prevista',
  chovendo: 'Chuva prevista subindo…',
  area: 'Passou do limite: área de risco em alerta',
  alerta: 'Alerta enviado ao celular da Dona Cida',
  seguro: 'Dona Cida confirmou: está segura',
}

export function SensorChuva({ fase, mm, limite, areaNome }: { fase: FaseEnchente; mm: number; limite: number; areaNome: string }) {
  const max = limite * 2
  const passou = mm >= limite
  const areaAtiva = fase === 'area' || fase === 'alerta'
  return (
    <div className="mt-3 rounded-xl bg-noite p-3 text-papel" role="group" aria-label="Simulação da chuva">
      {/* mini mapa: corrego, area de risco (pulsa ao passar do limite), casa da Dona Cida e o abrigo */}
      <svg viewBox="0 0 300 150" className="h-auto w-full rounded-lg" role="img" aria-label={`Mapa: área de risco ${areaNome} ${areaAtiva ? 'em alerta' : 'sem alerta'}; casa da Dona Cida dentro dela; abrigo a 465 metros.`}>
        <rect width="300" height="150" fill="#0f2f2c" />
        <path d="M-5 105 C 60 80, 100 125, 160 100 S 260 70, 305 85" fill="none" stroke="#3f9fae" strokeWidth="9" strokeLinecap="round" />
        {areaAtiva && <circle cx="125" cy="102" r="44" fill="#c2410c" opacity="0.25" className="animate-ping [animation-duration:1.6s] [transform-box:fill-box] [transform-origin:center]" />}
        <circle cx="125" cy="102" r="44" fill={areaAtiva ? '#c2410c' : 'transparent'} fillOpacity={areaAtiva ? 0.3 : 0} stroke={areaAtiva ? '#fb923c' : '#4b6b67'} strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="118" cy="92" r="7" fill="#ffffff" />
        <rect x="205" y="28" width="22" height="16" rx="3" fill="#f2b84b" />
        {fase === 'seguro' && <path d="M118 92 V 50 H 216 V 44" fill="none" stroke="#f2b84b" strokeWidth="3" strokeLinecap="round" />}
      </svg>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">Chuva prevista (3 h)</span>
        <span className={`font-display text-2xl font-semibold tabular-nums ${passou ? 'text-orange-300' : ''}`}>{Math.round(mm)} mm</span>
      </div>
      {/* barra com a marca do limite da area */}
      <div aria-hidden className="relative mt-1 h-2.5 overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full ${passou ? 'bg-alerta' : 'bg-[#3f9fae]'}`} style={{ width: `${Math.min(100, (mm / max) * 100)}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: '50%' }} />
      </div>
      <p className="mt-1 text-xs text-papel/80">Limite da área: {limite} mm (marca branca)</p>
      <p role="status" className="mt-2 text-sm font-bold">{ROTULO[fase]}</p>
    </div>
  )
}
