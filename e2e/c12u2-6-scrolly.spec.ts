import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-2-4-2-variation-of-conductivity-with-concentration'
const ANIMATION = 'dilution-conductivity'
const STEP_COUNT = 6

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

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Class 12 Unit 2, Section 2.4.2 Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme })

    test(`renders ${STEP_COUNT} Steps with no console errors, KaTeX rendered, and step screenshots`, async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-2/${SLUG}`)

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toHaveCount(1)
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)
      await expect(page.locator('.katex-error')).toHaveCount(0)

      const svg = scrolly.locator('svg').first()
      await expect(svg).toBeVisible()

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(1400)
        await svg.screenshot({ path: `test-results/screens/c12u2-6-step${k + 1}-${scheme}.png` })
      }

      expect(errors).toEqual([])
    })
  })
}
