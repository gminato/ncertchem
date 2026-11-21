import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-2-5-electrolytic-cells-and-electrolysis'
const ANIMATION = 'faraday-electrolysis'
const STEPS = 5

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
  test.describe(`Class 12 Unit 2 Section 7 Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme })

    test(`renders ${ANIMATION} for every Step with no errors`, async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-2/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Electrolytic Cells/)

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEPS)

      const panel = scrolly.getByTestId('scrolly-visual')
      for (let k = 0; k < STEPS; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        // Let the GSAP scroll trigger and the value tweens settle before the screenshot.
        await page.waitForTimeout(1400)
        await expect(panel.locator('svg').first()).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/c12u2-7-step${k + 1}-${scheme}.png` })
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}
