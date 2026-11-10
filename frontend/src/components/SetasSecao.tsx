import { useEffect, useState } from 'react'
import { IconeSeta, IconeSetaEsq } from './Icones'
import { rolarPara } from './motion/SmoothScroll'

const CAMPO = 'input, textarea, select, [contenteditable="true"]'

/**
 * Setas laterais para pular de secao em secao nas paginas de apresentacao (Inicio, Como funciona).
 * Le as secoes marcadas com data-secao (a lista muda: na Inicio elas montam aos poucos).
 * Teclas <- e -> fazem o mesmo, exceto quando o foco esta num campo de texto.
 * A rolagem usa o scroll suave existente; com reduced-motion, pula direto.
 */
export function SetasSecao() {
  const [secoes, setSecoes] = useState<HTMLElement[]>([])
  const [atual, setAtual] = useState(0)

  // lista de secoes: atualiza quando a pagina ganha conteudo novo (na Inicio as secoes montam aos poucos).
  // Performance: o DOM muda muito (chat do hero, contagens); a leitura e agrupada por quadro e so vira
  // estado novo se a lista de secoes mudou de fato (medido: sem isso o TBT subia ~250 ms no celular).
  useEffect(() => {
    let quadro = 0
    const ler = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => {
        const novas = [...document.querySelectorAll<HTMLElement>('[data-secao]')]
        setSecoes((antes) => (antes.length === novas.length && antes.every((el, i) => el === novas[i]) ? antes : novas))
      })
    }
    ler()
    const obs = new MutationObserver(ler)
    obs.observe(document.getElementById('conteudo') ?? document.body, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(quadro)
      obs.disconnect()
    }
  }, [])

  // secao atual = a que cruza o meio da tela
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setAtual(secoes.indexOf(e.target as HTMLElement))),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    secoes.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [secoes])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if ((document.activeElement as Element | null)?.closest(CAMPO)) return
      if (e.key === 'ArrowRight' && atual < secoes.length - 1) {
        e.preventDefault()
        rolarPara(secoes[atual + 1])
      } else if (e.key === 'ArrowLeft' && atual > 0) {
        e.preventDefault()
        rolarPara(secoes[atual - 1])
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [atual, secoes])

  if (secoes.length < 2) return null
  const nome = (i: number) => secoes[i]?.dataset.secao ?? ''
  const botao = 'group/seta pointer-events-auto relative flex size-12 items-center justify-center rounded-full bg-tinta text-papel shadow-lg ring-2 ring-papel/40 transition hover:bg-petroleo'

  return (
    // so a partir de md: no celular o dedo ja rola a pagina e as setas cobririam o texto
    <div className="pointer-events-none fixed inset-x-0 top-1/2 z-40 hidden -translate-y-1/2 md:block">
      <div className="flex items-center justify-between pl-[88px] pr-4">
        <div>
          {atual > 0 && (
            <button type="button" aria-label={`Seção anterior: ${nome(atual - 1)}`} onClick={() => rolarPara(secoes[atual - 1])} className={botao}>
              <IconeSetaEsq className="size-6" />
              <span aria-hidden className="absolute left-16 whitespace-nowrap rounded-lg bg-tinta px-3 py-1.5 text-sm font-semibold opacity-0 transition-opacity group-hover/seta:opacity-100 group-focus-visible/seta:opacity-100">
                {nome(atual - 1)}
              </span>
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {atual < secoes.length - 1 && (
            <button type="button" aria-label={`Próxima seção: ${nome(atual + 1)}`} onClick={() => rolarPara(secoes[atual + 1])} className={botao}>
              <IconeSeta className="size-6" />
              <span aria-hidden className="absolute right-16 whitespace-nowrap rounded-lg bg-tinta px-3 py-1.5 text-sm font-semibold opacity-0 transition-opacity group-hover/seta:opacity-100 group-focus-visible/seta:opacity-100">
                {nome(atual + 1)}
              </span>
            </button>
          )}
          {/* indicador discreto da posicao */}
          <span className="rounded-full bg-tinta/80 px-2.5 py-1 text-xs font-bold tabular-nums text-papel" aria-hidden>
            {atual + 1} / {secoes.length}
          </span>
        </div>
      </div>
    </div>
  )
}
