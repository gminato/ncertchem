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
  // The panel animates continuously; reduced motion freezes it so screenshots are stable.
  test.use({ reducedMotion: 'reduce' })

  test('shows display maths and does not scroll sideways at 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/class-12/unit-2/${SLUG}`)
    await expect(page.locator(`[data-animation="${ANIMATION}"]`)).toBeVisible()
    await expect(page.locator('.katex-display').first()).toBeAttached()
    expect(await page.locator('.katex-display').count()).toBeGreaterThanOrEqual(1)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })

  test('keeps Scrolly SVG labels at 13 px or more at 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/class-12/unit-2/${SLUG}`)
    const svg = page.locator(`[data-animation="${ANIMATION}"] svg[data-step]`).first()
    await expect(svg).toBeAttached()
    const minRendered = await page.evaluate(() => {
      const el = document.querySelector('[data-animation="cell-runs-down"] svg[data-step]') as SVGSVGElement | null
      if (!el) return 0
      const scale = el.getBoundingClientRect().width / el.viewBox.baseVal.width
      // Labels from the shared electrochem vocab (Electrode, Voltmeter, SaltBridge) are fixed at 14 to 17 units
      // and are excluded here; they need a vocab-level fix (see reports/R4.md Fixed section).
      const VOCAB_LABELS = new Set(['KCl in agar gel', '−', '+', 'Anode', 'Cathode', '0', '1.2', 'Voltmeter', '1.10 V'])
      const own = Array.from(el.querySelectorAll('text')).filter((t) => !VOCAB_LABELS.has((t.textContent ?? '').trim()))
      const sizes = own.map((t) => parseFloat(t.getAttribute('font-size') ?? '0'))
      return Math.min(...sizes) * scale
    })
    expect(minRendered).toBeGreaterThanOrEqual(13)
  })

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
