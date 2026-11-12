import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Carregando } from './components/Estados'
// Inicio e a porta de entrada: importada direto, para o LCP nao esperar um segundo download
import Inicio from './pages/Inicio'

const ComoFunciona = lazy(() => import('./pages/ComoFunciona'))
const Cidadao = lazy(() => import('./pages/Cidadao'))
const Ubs = lazy(() => import('./pages/Ubs'))
const Demo = lazy(() => import('./pages/Demo'))
const Experimente = lazy(() => import('./pages/Experimente'))

/** Produto (cidadao, painel) troca de tela rapido (≤ 300 ms); apresentacao tem entrada mais calma. */
const PRODUTO = ['/cidadao', '/ubs']

function Rotas() {
  const local = useLocation()
  const produto = PRODUTO.some((p) => local.pathname.startsWith(p))
  return (
    // key = rota: cada troca remonta o wrapper e reexecuta a animacao de entrada (fade + leve subida)
    <div key={local.pathname} className={produto ? 'animate-entrar-rapido' : 'animate-entrar'}>
      <Suspense fallback={<Carregando texto="Abrindo o Zelo…" />}>
        <Routes location={local}>
          <Route path="/" element={<Inicio />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/cidadao" element={<Cidadao />} />
          <Route path="/ubs" element={<Ubs />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/experimente" element={<Experimente />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Rotas />
    </BrowserRouter>
  )
}
