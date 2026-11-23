import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-6-7-1-nucleophilic-substitution'
const ANIMATION = 'nucleophile-swap'
const STEP_COUNT = 6

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
  test.describe(`Nucleophilic substitution Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with KaTeX and no console errors', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-6/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(1000)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/c12u6-7-step${k + 1}-${scheme}.png` })
      }

      // R4 for Scrolly text: rendered size = font-size x (svg rendered width / viewBox width), minimum 13 px.
      const small = await scrolly.locator('svg').first().evaluate((svg) => {
        const vb = (svg as SVGSVGElement).viewBox.baseVal
        const scale = svg.getBoundingClientRect().width / vb.width
        const found: string[] = []
        svg.querySelectorAll('text').forEach((t) => {
          const label = t.textContent?.trim() ?? ''
          if (!label) return
          const rendered = parseFloat(getComputedStyle(t).fontSize) * scale
          if (rendered < 13) found.push(`${rendered.toFixed(1)} px: ${label}`)
        })
        return found
      })
      expect(small).toEqual([])

      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Nucleophilic substitution Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-6/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
