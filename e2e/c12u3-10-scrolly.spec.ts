import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-3-5-collision-theory'
const ANIMATION = 'collision-orientation'
const STEP_COUNT = 5
const MIN_RENDERED_PX = 13

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
  test.describe(`Collision Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with no console errors and readable SVG text', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-3/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Collision Theory of Chemical Reactions')

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()

        // Rendered size = font-size x (svg width / viewBox width), not the attribute.
        const smallest = await panel.evaluate((svg) => {
          const el = svg as SVGSVGElement
          const vb = el.viewBox.baseVal.width
          const scale = el.getBoundingClientRect().width / vb
          let min = Infinity
          el.querySelectorAll('text, tspan').forEach((t) => {
            if (!t.textContent?.trim()) return
            min = Math.min(min, parseFloat(getComputedStyle(t).fontSize) * scale)
          })
          return min
        })
        expect(smallest, `step ${k + 1} smallest rendered text`).toBeGreaterThanOrEqual(MIN_RENDERED_PX)

        await panel.screenshot({ path: `test-results/screens/c12u3-10-step${k + 1}-${scheme}.png` })
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Collision Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-3/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Collision Theory of Chemical Reactions')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
