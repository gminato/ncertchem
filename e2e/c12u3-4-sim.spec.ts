import { test, expect, type Page } from '@playwright/test'

const SIM = 'rate-determining-step-lab'

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

/** Text leaves in the Simulation that RENDER below 14 px (KaTeX internals and the SR-only line excluded).
 * SVG text is scaled by the drawing's rendered width over its viewBox width, as the rendered size is what students see. */
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
          const [, , vbW] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          size *= svg.getBoundingClientRect().width / vbW
        }
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
  test(`Rate-Determining Step Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: the default, step 1 slow (k1 = 0.10 s⁻¹, k2 = 1.00 s⁻¹) at t = 10 s.
    const live = sim.locator('[aria-live="polite"]')
    await expect(live).toContainText('Step 1 is the slower step')
    await expect(live).toContainText('[A] = 0.368')
    await sim.screenshot({ path: `test-results/screens/c12u3-sim-default-${scheme}.png` })

    // State 2: preset step 2 slow (k1 = 1.00, k2 = 0.10): the intermediate piles up.
    await sim.getByRole('button', { name: 'Preset: step 2 slow' }).click()
    await expect(live).toContainText('Step 2 is the slower step')
    await sim.screenshot({ path: `test-results/screens/c12u3-sim-step2-slow-${scheme}.png` })

    // State 3: back to step 1 slow, time moved to 2.56 s (the intermediate peak).
    await sim.getByRole('button', { name: 'Preset: step 1 slow' }).click()
    await sim.getByRole('slider', { name: /^Time/ }).fill('2.6')
    await expect(live).toContainText('Step 1 is the slower step')
    await sim.screenshot({ path: `test-results/screens/c12u3-sim-peak-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Rate-Determining Step Lab does not scroll sideways at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  expect(await svgOutOfBounds(page)).toEqual([])
})
