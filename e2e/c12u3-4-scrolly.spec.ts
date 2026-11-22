import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-3-2-4-molecularity'
const ANIMATION = 'mechanism-steps'
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
  test.describe(`Molecularity Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with KaTeX and no console errors', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-3/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Molecularity of a Reaction')

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        // Let the GSAP tween between step targets finish.
        await page.waitForTimeout(1500)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        // Rendered size (R4): computed font-size scaled by the SVG's on-screen width over its viewBox width.
        const labels = await panel.evaluate((svg) => {
          const el = svg as SVGSVGElement
          const scale = el.getBoundingClientRect().width / el.viewBox.baseVal.width
          return Array.from(el.querySelectorAll('text')).map((t) => ({
            text: t.textContent ?? '',
            px: parseFloat(getComputedStyle(t).fontSize) * scale,
          }))
        })
        expect(labels.length).toBeGreaterThan(0)
        for (const label of labels) expect(label.px, `Step ${k + 1} label "${label.text}"`).toBeGreaterThanOrEqual(13)
        await panel.screenshot({ path: `test-results/screens/c12u3-4-step${k + 1}-${scheme}.png` })
      }

      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Molecularity Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-3/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Molecularity of a Reaction')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
