import { test, expect, type Page } from '@playwright/test'

const SIM = 'catalyst-lab'

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

/** Rendered text leaves below 14 px. SVG text uses font-size × rendered SVG width / viewBox width. */
async function smallTextLeaves(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"]`).evaluate((root) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el && !el.closest('.katex') && !el.closest('[class*="srOnly"]') && !el.closest('[class*="eyebrow"]')) {
        const svg = el.closest('svg')
        let size = parseFloat(getComputedStyle(el).fontSize)
        if (svg) {
          const [, , vbW] = (svg.getAttribute('viewBox') ?? '0 0 1 1').split(/\s+/).map(Number)
          const attr = parseFloat(el.getAttribute('font-size') ?? '') || size
          size = attr * (svg.getBoundingClientRect().width / vbW)
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
      svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline').forEach((el) => {
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
  test(`Catalyst Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: default, Eₐ 60 falls to 50 kJ mol⁻¹ with the catalyst; factor 56.6; K unchanged.
    const live = sim.locator('[aria-live="polite"]')
    await expect(live).toContainText('56.6')
    await expect(live).toContainText('K is unchanged')
    await sim.screenshot({ path: `test-results/screens/c12u3-9-sim-default-${scheme}.png` })

    // State 2: catalyst off; the factor reads 1 and the catalysed route is hidden.
    await sim.getByRole('switch', { name: 'Catalyst on' }).click()
    await expect(live).toContainText('catalyst off')
    await sim.screenshot({ path: `test-results/screens/c12u3-9-sim-off-${scheme}.png` })

    // State 3: catalyst back on, endothermic reaction at 350 K with a 20 kJ mol⁻¹ catalyst.
    await sim.getByRole('switch', { name: 'Catalyst on' }).click()
    await sim.getByRole('slider', { name: /ΔrH/ }).fill('30')
    await sim.getByRole('slider', { name: /Catalyst lowers/ }).fill('20')
    await sim.getByRole('slider', { name: /Temperature/ }).fill('350')
    await expect(live).toContainText('350')
    await expect(live).toContainText('K is unchanged')
    await sim.screenshot({ path: `test-results/screens/c12u3-9-sim-endo-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Catalyst Lab does not scroll sideways at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
