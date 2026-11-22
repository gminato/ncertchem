import { test, expect, type Page } from '@playwright/test'

const SIM = 'halide-properties-lab'

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
 * Text leaves in the Simulation whose RENDERED size is below 14 px at this viewport (KaTeX internals and the
 * SR-only line excluded). For SVG text, computed font-size is the viewBox value, so scale it by the SVG's
 * on-screen width over its viewBox width.
 */
async function smallTextLeaves(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"]`).evaluate((root) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el && !el.closest('.katex') && !el.closest('[class*="srOnly"]') && !el.closest('[class*="eyebrow"]')) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        const svg = el.closest('svg')
        if (svg) {
          const viewBoxWidth = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          size *= svg.getBoundingClientRect().width / viewBoxWidth
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
  test(`Halide Properties Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: the default, CH₃CH₂CH₂Br: b.p. 344 K, liquid, density 1.335 g mL⁻¹, sinks.
    await expect(sim.locator('[aria-live="polite"]')).toContainText('CH₃CH₂CH₂Br boils at 344 K')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('so it sinks in water')
    await sim.screenshot({ path: `test-results/screens/c12u6-6-sim-propyl-bromide-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 2: CH₃CH₂Cl, a gas at 298 K (b.p. 285 K), with no Table 6.3 density.
    await sim.getByRole('radio', { name: /^ethyl/ }).click()
    await sim.getByRole('radio', { name: 'Cl', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('CH₃CH₂Cl boils at 285 K')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Table 6.3 has no density')
    await sim.screenshot({ path: `test-results/screens/c12u6-6-sim-ethyl-chloride-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 3: n-propyl chloride, which floats on water (density 0.89 g mL⁻¹).
    await sim.getByRole('radio', { name: /^n-propyl/ }).click()
    await sim.getByRole('radio', { name: 'Cl', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('so it floats in water')
    await sim.screenshot({ path: `test-results/screens/c12u6-6-sim-propyl-chloride-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 4: CHCl₃, a Table 6.3 liquid. It has a density (1.489, sinks) but no boiling point in this lab's data.
    await sim.getByRole('radio', { name: /^Liquid from Table 6.3/ }).click()
    await sim.getByRole('radio', { name: 'CHCl₃', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText("CHCl₃ has no boiling point in this lab's data")
    await expect(sim.locator('[aria-live="polite"]')).toContainText('so it sinks in water')
    await sim.screenshot({ path: `test-results/screens/c12u6-6-sim-chloroform-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(errors).toEqual([])
  })
}

test('Halide Properties Lab does not scroll sideways at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
