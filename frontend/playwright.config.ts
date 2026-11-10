import { defineConfig } from '@playwright/test'

// Testes de ponta a ponta no navegador. Precisam do site e da API no ar (localmente: `npm run dev` + backend
// com ZELO_DEMO_MODE=true). E2E_URL aponta para outro ambiente, ex.: a URL publica do Render.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:5173',
    channel: 'chrome', // usa o Chrome instalado: nao precisa baixar navegador
    viewport: { width: 1600, height: 1000 },
  },
})
