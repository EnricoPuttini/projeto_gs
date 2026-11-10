import type { ReactNode } from 'react'

/**
 * Moldura de celular feita so de CSS (borda grossa + cantos): decorativa, sem elemento semantico,
 * entao o conteudo de dentro continua 100% acessivel. A "camera" e o unico detalhe extra (aria-hidden).
 * - sempre=true: moldura em qualquer largura (tela /demo);
 * - sempre=false: moldura so a partir de 1024px; no celular de verdade o app ocupa a tela inteira.
 * As classes ficam escritas por extenso (o Tailwind so gera classes que encontra literalmente no codigo).
 */
export function MolduraCelular({ children, sempre = false }: { children: ReactNode; sempre?: boolean }) {
  const classes = sempre
    ? 'relative mx-auto h-[780px] w-full max-w-[390px] overflow-hidden rounded-[2.75rem] border-[10px] border-tinta bg-white shadow-2xl'
    : 'relative h-dvh w-full lg:h-[780px] lg:w-[390px] lg:overflow-hidden lg:rounded-[2.75rem] lg:border-[10px] lg:border-tinta lg:bg-white lg:shadow-2xl'
  return (
    <div className={classes}>
      {children}
    </div>
  )
}
