import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { usePreferencia } from '../hooks/usePreferencia'
import { IconeAlfinete, IconeCasa, IconeCelular, IconeInfo, IconeMic, IconePainel, IconePlay } from './Icones'
import { LetraGrande } from './LetraGrande'

const PAGINAS = [
  { para: '/', rotulo: 'Início', curto: 'Início', icone: IconeCasa },
  { para: '/experimente', rotulo: 'Experimente', curto: 'Testar', icone: IconeMic },
  { para: '/como-funciona', rotulo: 'Como funciona', curto: 'Como', icone: IconeInfo },
  { para: '/demo', rotulo: 'Demonstração', curto: 'Demo', icone: IconePlay },
  { para: '/cidadao', rotulo: 'App do cidadão', curto: 'App', icone: IconeCelular },
  { para: '/ubs', rotulo: 'Painel da UBS', curto: 'Painel', icone: IconePainel },
]

/**
 * Navegacao principal: barra lateral recolhivel (>= md) e menu inferior fixo no celular.
 * Recolhida mostra so os icones (72px); abre com o mouse E com o foco do teclado (:focus-within),
 * porque hover sozinho excluiria quem navega por teclado. O botao de fixar guarda a escolha.
 * `aPartirDeLg`: no app do cidadao a barra so aparece >= 1024px (entre 768 e 1023 o app ocupa a tela).
 * `semMenuInferior`: no app do cidadao o rodape do celular e da conversa (campo e microfone).
 */
export function MenuLateral({ children, aPartirDeLg = false, semMenuInferior = false }: { children: ReactNode; aPartirDeLg?: boolean; semMenuInferior?: boolean }) {
  const [fixo, setFixo] = usePreferencia('menu-fixo', false)

  // classes literais (o Tailwind so gera o que encontra escrito por extenso)
  const mostrarBarra = aPartirDeLg ? 'hidden lg:flex' : 'hidden md:flex'
  const recuo = aPartirDeLg ? (fixo ? 'lg:pl-60' : 'lg:pl-[72px]') : fixo ? 'md:pl-60' : 'md:pl-[72px]'
  const rotuloVisivel = fixo ? 'opacity-100' : 'opacity-0 group-hover/menu:opacity-100 group-focus-within/menu:opacity-100'

  return (
    <>
      <aside className={`group/menu fixed inset-y-0 left-0 z-50 ${mostrarBarra}`}>
        <nav
          aria-label="Principal"
          className={`flex h-full flex-col overflow-hidden bg-noite py-3 text-papel shadow-xl transition-[width] duration-200 ease-out ${
            fixo ? 'w-60' : 'w-[72px] group-hover/menu:w-60 group-focus-within/menu:w-60'
          }`}
        >
          <Link to="/" aria-label="Zelo, página inicial" className="mx-3 mb-4 flex min-h-12 items-center gap-3 rounded-xl px-1.5">
            <svg viewBox="0 0 64 64" className="size-9 shrink-0 animate-respirar" aria-hidden="true">
              <rect width="64" height="64" rx="16" fill="#f2b84b" />
              <path d="M20 22h24L22 42h22" fill="none" stroke="#0b2422" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span aria-hidden className={`font-display text-2xl font-bold transition-opacity duration-200 ${rotuloVisivel}`}>Zelo</span>
          </Link>
          <ul className="flex flex-1 flex-col gap-1 px-3">
            {PAGINAS.map(({ para, rotulo, icone: Icone }) => (
              <li key={para}>
                <NavLink
                  to={para}
                  end={para === '/'}
                  // title: dica de ferramenta quando a barra esta recolhida
                  title={rotulo}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors ${
                      isActive ? 'bg-ambar text-tinta' : 'text-papel/90 hover:bg-white/10'
                    }`
                  }
                >
                  <Icone className="size-6 shrink-0" />
                  {/* o texto fica no DOM mesmo recolhido: e o nome acessivel do link */}
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${rotuloVisivel}`}>{rotulo}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 px-3">
            <div className={`transition-opacity duration-200 ${rotuloVisivel}`}>
              <LetraGrande claro />
            </div>
            <button
              type="button"
              aria-expanded={fixo}
              title={fixo ? 'Recolher o menu' : 'Manter o menu aberto'}
              onClick={() => setFixo(!fixo)}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold hover:bg-white/10 ${fixo ? 'text-ambar' : 'text-papel/80'}`}
            >
              <IconeAlfinete className="size-6 shrink-0" />
              {/* o texto visivel E o nome do botao (fica no DOM mesmo com a barra recolhida) */}
              <span className={`whitespace-nowrap transition-opacity duration-200 ${rotuloVisivel}`}>{fixo ? 'Recolher o menu' : 'Manter o menu aberto'}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* coluna da altura da tela: o rodape fica sempre no fim, mesmo em pagina curta */}
      <div className={`flex min-h-dvh flex-col ${recuo} ${semMenuInferior ? '' : 'pb-[4.5rem] md:pb-0'} transition-[padding] duration-200`}>{children}</div>

      {!semMenuInferior && (
        // celular: menu inferior fixo — sempre visivel e ao alcance do polegar (ver docs/decisoes.md)
        <nav aria-label="Principal (celular)" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-noite pb-[env(safe-area-inset-bottom)] md:hidden">
          <ul className="grid grid-cols-6">
            {PAGINAS.map(({ para, rotulo, curto, icone: Icone }) => (
              <li key={para}>
                <NavLink
                  to={para}
                  end={para === '/'}
                  className={({ isActive }) =>
                    `flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold ${isActive ? 'text-ambar' : 'text-papel/85'}`
                  }
                >
                  <Icone className="size-6" />
                  {/* nome acessivel = texto visivel + nome completo: quem usa comando de voz diz o que ve ("Demo") */}
                  <span>
                    {curto}
                    {curto !== rotulo && <span className="sr-only"> ({rotulo})</span>}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}
