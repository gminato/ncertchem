import { test, expect, type Page } from '@playwright/test'

const SIM = 'stereo-outcomes'

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
  test(`Stereo Outcomes renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: the default, 2-chloropentane with SN2: one inverted product, pentan-2-ol.
    await expect(sim.locator('[aria-live="polite"]')).toContainText('pentan-2-ol')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Polarimeter: rotates')
    await sim.screenshot({ path: `test-results/screens/c12u6-9-sim-default-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 2: the mirror image of 2-chloropentane is shown; its verdict says the molecule is chiral.
    await sim.getByRole('switch', { name: 'Show the mirror image' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('pentan-2-ol')
    await expect(sim.getByText(/No turn of the mirror image/)).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u6-9-sim-mirror-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 3: 2-bromobutane by SN1: the two mirror-image products in a 50 : 50 mixture, polarimeter zero.
    await sim.getByRole('radio', { name: '2-bromobutane' }).click()
    await sim.getByRole('radio', { name: 'SN1' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('50 : 50')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Polarimeter: zero')
    await sim.screenshot({ path: `test-results/screens/c12u6-9-sim-sn1-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 4: 3-chloropentane has no stereocentre: no mechanism control, and the mirror image superimposes.
    await sim.getByRole('radio', { name: '3-chloropentane' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('no stereocentre')
    await expect(sim.getByRole('radio', { name: 'SN1' })).toHaveCount(0)
    await sim.screenshot({ path: `test-results/screens/c12u6-9-sim-achiral-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 5: 1-bromo-1-phenylethane has only SN1 offered: the benzylic carbocation is planar and stabilised.
    await sim.getByRole('radio', { name: '1-bromo-1-phenylethane' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('50 : 50')
    await expect(sim.getByRole('radio', { name: 'SN2' })).toHaveCount(0)
    await expect(sim.getByText(/Only SN1 is shown/)).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u6-9-sim-benzylic-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Stereo Outcomes does not scroll sideways at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
