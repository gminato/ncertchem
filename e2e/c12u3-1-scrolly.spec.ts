import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-3-1-rate-of-a-chemical-reaction'
const ANIMATION = 'rate-tangent'
const STEP_COUNT = 5

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Local servers do not serve Vercel's hosted analytics script.
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  return errors
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Rate of a reaction Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with KaTeX and no console errors', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-3/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rate of a Chemical Reaction')

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        // Reduced motion cuts the chord tween, but let the scroll state settle first.
        await page.waitForTimeout(600)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/c12u3-1-step${k + 1}-${scheme}.png` })
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      await expect(page.locator('.katex-display').first()).toBeVisible()
      expect(errors).toEqual([])
    })
  })
}

test.describe('Rate of a reaction Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-3/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rate of a Chemical Reaction')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
