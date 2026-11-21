import { test, expect, type Page } from '@playwright/test'

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

const SLUG = '12-2-3-1-equilibrium-constant-and-gibbs-energy'
const ANIMATION = 'cell-runs-down'
const STEPS = 6

test.describe('Class 12 Unit 2 Section 2.3.1 Scrolly', () => {
  test('renders the Scrolly Animation, Checks and KaTeX without errors', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(`/class-12/unit-2/${SLUG}`)
    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await expect(scrolly).toBeVisible()
    await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(STEPS)
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`screenshots every Step in ${scheme} at 1440×900`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ colorScheme: scheme })
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-2/${SLUG}`)
      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      const panel = scrolly.locator('[data-testid="scrolly-visual"]')

      for (let k = 0; k < STEPS; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await expect(panel.locator(`svg[data-step="${k}"]`)).toBeVisible()
        // Let the Step's tween finish before the screenshot.
        await page.waitForTimeout(900)
        await panel.screenshot({ path: `test-results/screens/c12u2-4-step${k + 1}-${scheme}.png` })
      }
      expect(errors).toEqual([])
    })
  }
})
