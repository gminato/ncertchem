import { expect, test, type Page } from '@playwright/test'

const SLUG = '12-2-5-1-products-of-electrolysis'
const TITLE = 'Products of Electrolysis'
const ANIMATION = 'electrolysis-products'
const STEP_COUNT = 5

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // Local `next start` does not serve Vercel's hosted `/_vercel/insights/script.js` endpoint.
    if (text.includes('Failed to load resource: the server responded with a status of 404')) return
    errors.push(text)
  })
  return errors
}

for (const scheme of ['light', 'dark'] as const) {
  test(`Section ${SLUG} Scrolly screenshots every Step (${scheme})`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: scheme,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = watchErrors(page)

    await page.goto(`/class-12/unit-2/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)

    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await expect(scrolly).toBeVisible()
    const steps = scrolly.locator('[data-scrolly-step]')
    await expect(steps).toHaveCount(STEP_COUNT)

    for (let k = 0; k < STEP_COUNT; k++) {
      await steps.nth(k).evaluate((el) => el.scrollIntoView({ block: 'start' }))
      await expect(steps.nth(k)).toHaveAttribute('data-active', 'true')
      await expect(scrolly.locator('svg[data-testid="electrolysis-products"]')).toHaveAttribute('data-step', String(k))
      await scrolly.locator('svg[data-testid="electrolysis-products"]').screenshot({ path: `test-results/screens/c12u2-8-step${k + 1}-${scheme}.png` })
    }

    await expect(page.locator('.katex-error')).toHaveCount(0)
    await expect(page.locator('.katex').first()).toBeAttached()
    expect(errors).toEqual([])
    await context.close()
  })
}

test(`Section ${SLUG} has no sideways scroll at phone width`, async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = watchErrors(page)
  await page.goto(`/class-12/unit-2/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)
  await expect(page.locator(`[data-animation="${ANIMATION}"]`)).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
  await context.close()
})
