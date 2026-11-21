import { test, expect, type Page, type Browser } from '@playwright/test'
import path from 'node:path'

const SLUG = '12-2-2-galvanic-cells'
const ANIMATION = 'she-measurement'
const STEPS = 6
const SCREEN_DIR = path.join('test-results', 'screens')
const DEFAULT_FRACTION = 0.4

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Local `next start` does not serve Vercel's hosted `/_vercel/insights/script.js` endpoint.
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  return errors
}

async function gotoStep(page: Page, index: number) {
  const steps = page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
  await steps.nth(index).evaluate((el, f) => {
    const top = el.getBoundingClientRect().top
    window.scrollBy(0, top - f * window.innerHeight)
  }, DEFAULT_FRACTION)
  await expect(steps.nth(index)).toHaveAttribute('data-active', 'true')
}

async function shotSteps(browser: Browser, scheme: 'light' | 'dark') {
  const context = await browser.newContext({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = watchErrors(page)
  await page.goto(`/class-12/unit-2/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Galvanic Cells and Electrode Potential')
  const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(scrolly).toBeVisible()
  await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(STEPS)
  for (let i = 0; i < STEPS; i++) {
    await gotoStep(page, i)
    await page.waitForTimeout(700)
    await scrolly
      .locator('[data-testid="scrolly-visual"]')
      .screenshot({ path: path.join(SCREEN_DIR, `c12u2-2-step${i + 1}-${scheme}.png`) })
  }
  await expect(page.locator('.katex-error')).toHaveCount(0)
  expect(errors).toEqual([])
  await context.close()
}

test.describe('Class 12, Unit 2, Section 2.2: Galvanic cells and electrode potential', () => {
  test('renders the Hook, Scrolly Animation, Checks and KaTeX without errors', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(`/class-12/unit-2/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Galvanic Cells and Electrode Potential')
    await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(STEPS)
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('the Section page does not scroll sideways at a 390 px phone width', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await page.goto(`/class-12/unit-2/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Galvanic Cells and Electrode Potential')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth, 'document scrollWidth at 390 px').toBeLessThanOrEqual(390)
    await context.close()
  })

  test('the Scrolly steps draw in light mode', async ({ browser }) => {
    await shotSteps(browser, 'light')
  })

  test('the Scrolly steps draw in dark mode', async ({ browser }) => {
    await shotSteps(browser, 'dark')
  })
})
