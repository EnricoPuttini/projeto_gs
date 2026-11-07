const dataHora = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const formatarDataHora = (iso: string) => dataHora.format(new Date(iso))
export const formatarHora = (iso: string) => hora.format(new Date(iso))

/** Dia (AAAA-MM-DD) de um ISO local, sem converter fuso: o backend ja manda no fuso de Sao Paulo. */
export const diaDe = (iso: string) => iso.slice(0, 10)

export const mmss = (segundos: number) => {
  const s = Math.max(0, Math.floor(segundos))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
