import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-3-4-temperature-and-arrhenius'
const ANIMATION = 'arrhenius-energy'
const STEP_COUNT = 5
const SCRATCH_SHOTS = 'test-results/screens'

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
  test.describe(`Arrhenius Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with KaTeX and no console errors', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-3/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Temperature Dependence and the Arrhenius Equation')

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: `${SCRATCH_SHOTS}/c12u3-8-step${k + 1}-${scheme}.png` })
        // Rendered size: computed font-size × (svg width / viewBox width), not the font-size attribute.
        const small = await panel.evaluate((el: SVGSVGElement) => {
          const scale = el.getBoundingClientRect().width / el.viewBox.baseVal.width
          return Array.from(el.querySelectorAll('text'))
            .filter((t) => (t.textContent ?? '').trim() !== '')
            .map((t) => ({ text: (t.textContent ?? '').trim(), px: parseFloat(getComputedStyle(t).fontSize) * scale }))
            .filter((r) => r.px < 13)
        })
        expect(small, `Step ${k + 1} text under 13 px`).toEqual([])
      }

      await expect(page.locator('.katex-display').first()).toBeVisible()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Arrhenius Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-3/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Temperature Dependence and the Arrhenius Equation')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
