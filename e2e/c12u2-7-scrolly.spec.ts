import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-2-5-electrolytic-cells-and-electrolysis'
const ANIMATION = 'faraday-electrolysis'
const STEPS = 5
const PHONE_MIN_PX = 14

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

/** Rendered px size of every visible label the Scrolly draws itself (`.faraday-label`). */
async function renderedLabelSizes(page: Page, step: number): Promise<number[]> {
  return page.evaluate((k) => {
    const scrolly = document.querySelector('[data-animation="faraday-electrolysis"]')
    const svg = scrolly?.querySelector('svg')
    if (!svg) return []
    const viewBoxW = svg.viewBox.baseVal.width
    const scale = svg.getBoundingClientRect().width / viewBoxW
    const sizes: number[] = []
    for (const el of Array.from(svg.querySelectorAll<SVGTextElement>('text.faraday-label'))) {
      let opacity = 1
      for (let n: Element | null = el; n && n !== svg; n = n.parentElement) {
        opacity *= Number(getComputedStyle(n).opacity)
      }
      if (opacity < 0.5) continue
      sizes.push(Number(el.getAttribute('font-size')) * scale)
    }
    return sizes.length ? sizes : [-k]
  }, step)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Class 12 Unit 2 Section 7 Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

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
        // Reduced motion snaps the value tweens; two frames let the GSAP scroll trigger apply the Step.
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
        await expect(panel.locator('svg').first()).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/c12u2-7-step${k + 1}-${scheme}.png` })
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Class 12 Unit 2 Section 7 Scrolly at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test(`${ANIMATION} labels render at >= ${PHONE_MIN_PX} px and the page does not scroll sideways`, async ({ page }) => {
    await page.goto(`/class-12/unit-2/${SLUG}`)
    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await expect(scrolly).toBeVisible()
    const steps = scrolly.locator('[data-scrolly-step]')

    // Step 1 (single cell) and Step 4 (series) carry the labels.
    for (const k of [0, 3]) {
      await steps.nth(k).scrollIntoViewIfNeeded()
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const sizes = await renderedLabelSizes(page, k + 1)
      expect(sizes.length).toBeGreaterThan(0)
      for (const px of sizes) expect(px).toBeGreaterThanOrEqual(PHONE_MIN_PX)
    }

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
