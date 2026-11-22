import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-3-4-1-effect-of-catalyst'
const ANIMATION = 'catalyst-pathway'
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
  test.describe(`Catalyst Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with KaTeX, legible text and no console errors', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-3/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Effect of a Catalyst')

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/c12u3-9-step${k + 1}-${scheme}.png` })

        // Rendered font size = font-size × (svg width / viewBox width), for every visible text in the panel.
        const smallest = await panel.evaluate((node) => {
          const svg = node as unknown as SVGSVGElement
          const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
          const visible = (el: Element | null): boolean => {
            for (let node = el; node && node !== svg; node = node.parentElement) {
              if (Number(getComputedStyle(node).opacity) < 0.5) return false
            }
            return true
          }
          let min = Infinity
          for (const el of Array.from(svg.querySelectorAll('text'))) {
            if (!el.textContent?.trim() || !visible(el)) continue
            min = Math.min(min, parseFloat(getComputedStyle(el).fontSize) * scale)
          }
          return min
        })
        expect(smallest).toBeGreaterThanOrEqual(MIN_RENDERED_PX)
      }

      await expect(page.locator('.katex-display').first()).toBeVisible()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Catalyst Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-3/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Effect of a Catalyst')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
