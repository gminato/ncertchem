import { test, expect, type Page } from '@playwright/test'

const SIM = 'half-life-compare'

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

/**
 * Text that renders below 14 px. HTML text uses its computed size. SVG text uses the RENDERED size:
 * font-size × (svg width on screen / viewBox width), so a scaled-down drawing is caught.
 */
async function smallTextLeaves(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"]`).evaluate((root) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el && !el.closest('.katex') && !el.closest('[class*="eyebrow"]')) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        const svg = el.closest('svg')
        if (svg) {
          const [, , vbW] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          size = size * (svg.getBoundingClientRect().width / vbW)
        }
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
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
  test(`Half-life comparison renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.locator('svg[role="img"]')).toHaveCount(2)

    // State 1: the default, k = 0.0500 and [R]₀ = 1.00 mol L⁻¹. Zero t½ = 10.0 s, first t½ = 13.9 s.
    const summary = sim.locator('[aria-live="polite"]')
    await expect(summary).toContainText('t½ = 10.0 s')
    await expect(summary).toContainText('t½ = 13.9 s')
    await sim.screenshot({ path: `test-results/screens/c12u3-7-sim-default-${scheme}.png` })

    // State 2: [R]₀ = 2.00 mol L⁻¹. Zero t½ doubles to 20.0 s; first-order t½ stays 13.9 s.
    await sim.getByRole('slider', { name: /Starting concentration/ }).fill('2')
    await expect(summary).toContainText('t½ = 20.0 s')
    await expect(summary).toContainText('t½ = 13.9 s for any [R]₀')
    await sim.screenshot({ path: `test-results/screens/c12u3-7-sim-r0-double-${scheme}.png` })

    // State 3: after two half-lives (stepper at 2). Zero order has 0 mol L⁻¹ left; first order 0.250.
    await sim.getByRole('button', { name: 'More half-lives' }).click()
    await sim.getByRole('button', { name: 'More half-lives' }).click()
    await expect(sim.getByText('Half-lives counted')).toBeVisible()
    await expect(summary).toContainText('After 2 half-lives')
    await expect(summary).toContainText('0.250 of its start left')
    await sim.screenshot({ path: `test-results/screens/c12u3-7-sim-two-half-lives-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(errors).toEqual([])
  })
}

test('Half-life comparison does not scroll sideways at phone width', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const errors = watchErrors(page)
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  await expect(sim.locator('svg[role="img"]')).toHaveCount(2)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
})
