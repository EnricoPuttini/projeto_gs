import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Carregando } from './components/Estados'

const Cidadao = lazy(() => import('./pages/Cidadao'))
const Ubs = lazy(() => import('./pages/Ubs'))
const Demo = lazy(() => import('./pages/Demo'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Carregando texto="Abrindo o Zelo…" />}>
        <Routes>
          <Route path="/cidadao" element={<Cidadao />} />
          <Route path="/ubs" element={<Ubs />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="*" element={<Navigate to="/cidadao" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
