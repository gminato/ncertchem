import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-2-4-2-variation-of-conductivity-with-concentration'
const ANIMATION = 'dilution-conductivity'
const STEP_COUNT = 6

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

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Class 12 Unit 2, Section 2.4.2 Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme })

    test(`renders ${STEP_COUNT} Steps with no console errors, KaTeX rendered, and step screenshots`, async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-2/${SLUG}`)

      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      await expect(scrolly).toHaveCount(1)
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)
      await expect(page.locator('.katex-error')).toHaveCount(0)

      const svg = scrolly.locator('svg').first()
      await expect(svg).toBeVisible()

      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(1400)
        await svg.screenshot({ path: `test-results/screens/c12u2-6-step${k + 1}-${scheme}.png` })
      }

      expect(errors).toEqual([])
    })
  })
}

test('Section 2.4.2 page has display maths and does not scroll sideways at 390 × 844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/class-12/unit-2/${SLUG}`)
  await expect(page.locator('.katex-display').first()).toBeVisible()
  expect(await page.locator('.katex-display').count()).toBeGreaterThanOrEqual(1)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})

test('Scrolly SVG labels render at least 14 px on a 390 px phone, in every visible Step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/class-12/unit-2/${SLUG}`)
  const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
  const steps = scrolly.locator('[data-scrolly-step]')
  await expect(steps).toHaveCount(STEP_COUNT)
  const svg = scrolly.locator('svg').first()
  for (let k = 0; k < STEP_COUNT; k++) {
    await steps.nth(k).scrollIntoViewIfNeeded()
    await page.waitForTimeout(1400)
    const smallest = await svg.evaluate((el) => {
      const svgEl = el as SVGSVGElement
      const scale = svgEl.getBoundingClientRect().width / svgEl.viewBox.baseVal.width
      let min = Number.POSITIVE_INFINITY
      for (const node of Array.from(svgEl.querySelectorAll('text'))) {
        // Skip text inside a hidden scene (its group fades to opacity 0).
        let hidden = false
        for (let p: Element | null = node; p && p !== svgEl; p = p.parentElement) {
          const op = p.getAttribute('opacity')
          if (op !== null && Number(op) < 0.05) hidden = true
        }
        if (hidden || !node.textContent?.trim()) continue
        min = Math.min(min, parseFloat(getComputedStyle(node).fontSize) * scale)
      }
      return min
    })
    expect(smallest, `Step ${k + 1} smallest label in CSS px`).toBeGreaterThanOrEqual(14)
  }
})
