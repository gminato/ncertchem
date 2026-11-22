import { test, expect, type Page } from '@playwright/test'

const SIM = 'order-units-lab'

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

/** Text leaves in the Simulation that render below 14 px (KaTeX internals and the SR-only line excluded). */
async function smallTextLeaves(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"]`).evaluate((root) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el && !el.closest('.katex') && !el.closest('[class*="srOnly"]') && !el.closest('[class*="eyebrow"]')) {
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 14) bad.push(`${size}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"] svg[role="img"]`).evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      const scale = vbW / frame.width
      const leaves = svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline')
      leaves.forEach((el) => {
        if (el.closest('defs, clipPath, mask, pattern, symbol, marker')) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const x0 = (r.left - frame.left) * scale
        const y0 = (r.top - frame.top) * scale
        const x1 = (r.right - frame.left) * scale
        const y1 = (r.bottom - frame.top) * scale
        if (x0 < -0.5 || y0 < -0.5 || x1 > vbW + 0.5 || y1 > vbH + 0.5) {
          out.push(`${el.tagName} ${el.textContent?.trim().slice(0, 30) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`)
        }
      })
    })
    return out
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test(`Order and Units Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.locator('.katex').first()).toBeVisible()

    // State 1: the default, first order at [A] = 0.50 mol L⁻¹: rate = 0.100 mol L⁻¹ s⁻¹.
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Order 1.')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('0.100 mol L⁻¹ s⁻¹')
    await sim.screenshot({ path: `test-results/screens/c12u3-3-sim-default-${scheme}.png` })

    // State 2: second order, with the doubling shown: the rate grows by 4.00.
    await sim.getByRole('radio', { name: '2', exact: true }).click()
    await sim.getByRole('button', { name: 'Double [A]' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Order 2.')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('multiplies the rate by 4.00')
    await sim.screenshot({ path: `test-results/screens/c12u3-3-sim-second-doubled-${scheme}.png` })

    // State 3: half order, with the units of k in their simplified form and the factor 1.41.
    await sim.getByRole('radio', { name: '½', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('multiplies the rate by 1.41')
    await sim.screenshot({ path: `test-results/screens/c12u3-3-sim-half-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Order and Units Lab fits a phone without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  await expect(sim.locator('.katex').first()).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
