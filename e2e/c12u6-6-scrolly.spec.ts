import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-6-6-physical-properties'
const ANIMATION = 'halide-physical'
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
  test.describe(`Physical properties Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders every step with no console errors and rendered text at least 13 px', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-6/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)

      // R4 for Scrolly text, checked on every Step: rendered size = font-size x (svg rendered width / viewBox width),
      // minimum 13 px. Sub and Sup tspans (baseline-shift) are exempt (R12).
      const small: string[] = []
      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(1500)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/c12u6-6-step${k + 1}-${scheme}.png` })
        const found = await panel.evaluate((svg) => {
          const vb = (svg as SVGSVGElement).viewBox.baseVal
          const scale = svg.getBoundingClientRect().width / vb.width
          const out: string[] = []
          svg.querySelectorAll('text').forEach((t) => {
            const label = t.textContent?.trim() ?? ''
            if (!label) return
            const rendered = parseFloat(getComputedStyle(t).fontSize) * scale
            if (rendered < 13) out.push(`${rendered.toFixed(1)} px: ${label}`)
          })
          return out
        })
        found.forEach((f) => small.push(`Step ${k + 1}: ${f}`))
      }
      expect(small).toEqual([])

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Physical properties Section at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('does not scroll sideways at 390 px', async ({ page }) => {
    await page.goto(`/class-12/unit-6/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
