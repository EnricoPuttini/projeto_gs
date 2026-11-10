import { expect, test } from '@playwright/test'

// Regressao do bug "o scroll do painel na /demo nao funciona": o Lenis capturava a roda do mouse.
test('roda do mouse rola o painel da UBS dentro da /demo (e nao a pagina)', async ({ page }) => {
  await page.goto('/demo')
  const painel = page.getByRole('region', { name: 'Painel da UBS' })
  await expect(painel.getByText('Agenda de hoje e amanhã')).toBeVisible({ timeout: 30_000 })
  const rolavel = painel.locator('[data-lenis-prevent]').first()

  const antes = await rolavel.evaluate((el) => el.scrollTop)
  await rolavel.hover()
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 300)

  await expect.poll(() => rolavel.evaluate((el) => el.scrollTop)).toBeGreaterThan(antes + 300)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('roda do mouse rola a lista da fila no painel da UBS', async ({ page }) => {
  await page.goto('/ubs')
  const fila = page.getByRole('region', { name: 'Lista da fila de espera' })
  await expect(fila).toBeVisible({ timeout: 30_000 })
  await fila.hover()
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 300)
  await expect.poll(() => fila.evaluate((el) => el.scrollTop)).toBeGreaterThan(100)
})
