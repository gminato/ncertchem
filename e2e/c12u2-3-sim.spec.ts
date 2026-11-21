import { test, expect, type Page } from '@playwright/test'

const SIM = 'nernst-lab'
const VIEWBOX = { w: 600, h: 400 }

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

/** Drawn SVG leaves whose on-screen boxes fall outside the drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"] svg[role="img"]`).evaluate((svg, vb) => {
    const out: string[] = []
    const frame = svg.getBoundingClientRect()
    const scale = vb.w / frame.width
    const leaves = svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline')
    leaves.forEach((el) => {
      if (el.closest('defs, clipPath, mask, pattern, symbol, marker')) return
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      const x0 = (r.left - frame.left) * scale
      const y0 = (r.top - frame.top) * scale
      const x1 = (r.right - frame.left) * scale
      const y1 = (r.bottom - frame.top) * scale
      if (x0 < -0.5 || y0 < -0.5 || x1 > vb.w + 0.5 || y1 > vb.h + 0.5) {
        out.push(`${el.tagName} ${el.textContent?.trim().slice(0, 30) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`)
      }
    })
    return out
  }, VIEWBOX)
}

for (const scheme of ['light', 'dark'] as const) {
  test(`Nernst Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.locator('.katex').first()).toBeVisible()

    // State 1: the default, Daniell cell at unit concentrations (Ecell = E°cell = 1.10 V).
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Ecell = 1.100 V')
    await sim.screenshot({ path: `test-results/screens/c12u2-3-sim-default-${scheme}.png` })

    // State 2: the Daniell cell with [Cu²⁺] lowered to 0.01 mol L⁻¹, so Q = 100 and Ecell falls to 1.041 V.
    await sim.getByRole('slider', { name: /Zn²⁺ concentration/ }).fill('0')
    await sim.getByRole('slider', { name: /Cu²⁺ concentration/ }).fill('-2')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Ecell = 1.041')
    await sim.screenshot({ path: `test-results/screens/c12u2-3-sim-dilute-copper-${scheme}.png` })

    // State 3: the zinc–hydrogen electrode cell at pH 3 and [Zn²⁺] = 0.1 mol L⁻¹, at 330 K.
    await sim.getByRole('radio', { name: 'Zinc against the hydrogen electrode' }).click()
    await sim.getByRole('slider', { name: /pH of the acid/ }).fill('3')
    await sim.getByRole('slider', { name: /Zn²⁺ concentration/ }).fill('-1')
    await sim.getByRole('slider', { name: /Temperature/ }).fill('330')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('330 K')
    await sim.screenshot({ path: `test-results/screens/c12u2-3-sim-zn-she-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}
