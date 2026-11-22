import { test, expect, type Page } from '@playwright/test'

const SIM = 'dblock-trends-lab'

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
  test(`Trends Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: the default, melting point, all three rows. V is the 3d peak (1910 °C from 2183 K).
    await expect(sim.locator('[aria-live="polite"]')).toContainText('V (3d): melting point 1910 °C')
    await sim.screenshot({ path: `test-results/screens/c12u4-2-sim-default-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 2: enthalpy of atomisation; pick Mn to read the 3d dip (281 kJ mol⁻¹, Table 4.2), then W (≈ 845, Fig. 4.2).
    await sim.getByRole('radio', { name: /Δ.*H/ }).click()
    await sim.getByRole('combobox', { name: 'Element' }).selectOption('3d:Mn')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Mn (3d): enthalpy of atomisation 281 kJ mol⁻¹')
    await sim.getByRole('combobox', { name: 'Element' }).selectOption('5d:W')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('≈ 845 kJ mol⁻¹')
    await sim.screenshot({ path: `test-results/screens/c12u4-2-sim-atomisation-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 3: metallic radius with only the 4d and 5d rows; Zr 160 pm and Hf 159 pm sit together.
    await sim.getByRole('radio', { name: 'Metallic radius' }).click()
    await sim.getByRole('switch', { name: '3d series' }).click()
    await sim.getByRole('combobox', { name: 'Element' }).selectOption('4d:Zr')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Zr (4d): metallic radius 160 pm')
    await sim.screenshot({ path: `test-results/screens/c12u4-2-sim-radius-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 4: density, 3d only (V to Zn); Sc and Ti are not offered.
    await sim.getByRole('radio', { name: 'Density' }).click()
    await expect(sim.getByRole('combobox', { name: 'Element' }).locator('option', { hasText: /^Sc$/ })).toHaveCount(0)
    await sim.getByRole('combobox', { name: 'Element' }).selectOption('3d:Ni')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Ni (3d): density 8.90 g cm⁻³')
    await sim.screenshot({ path: `test-results/screens/c12u4-2-sim-density-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Trends Lab does not scroll sideways at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
