import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const SCREEN_DIR = path.join(process.cwd(), 'test-results', 'screens')
const SLUG = '12-2-1-electrochemical-cells'
const ANIMATION = 'daniell-opposing-voltage'
const STEPS = 5
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
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(
    page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Class 12 Unit 2, Section 2.1 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test(`Scrolly steps render and screenshot (${scheme})`, async ({ page }) => {
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-2/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electrochemical Cells')

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(STEPS)

      for (let i = 0; i < STEPS; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1600)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `c12u2-1-step${i + 1}-${scheme}.png`) })
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}
