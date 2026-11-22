import { test, expect, type Page } from '@playwright/test'

const SIM = 'configuration-explorer'

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
  return page.locator(`[data-simulation="${SIM}"] svg`).evaluateAll((svgs) => {
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
  test(`Configuration Explorer renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: the default, chromium, Cr (Z = 24): 3d⁵4s¹, the exception to the filling order.
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Cr: [Ar] 3d⁵4s¹')
    await sim.screenshot({ path: `test-results/screens/c12u4-1-sim-default-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 2: copper (Z = 29) as Cu²⁺: the 4s electron leaves first, then one 3d electron, so 3d⁹.
    await sim.getByRole('button', { name: /atomic number 29$/ }).click()
    await sim.getByRole('radio', { name: '+2' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Cu²⁺: [Ar] 3d⁹')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Cu²⁺ is a transition ion')
    await sim.screenshot({ path: `test-results/screens/c12u4-1-sim-cu2plus-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 3: platinum (Z = 78) in the 5d series: 5d⁹6s¹, group 10, with the 4f¹⁴ core written out.
    await sim.getByRole('radio', { name: '5d' }).click()
    await sim.getByRole('radio', { name: '0', exact: true }).click()
    await sim.getByRole('button', { name: /atomic number 78$/ }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Pt: [Xe] 4f¹⁴ 5d⁹6s¹')
    await expect(sim.getByText('d + s = 9 + 1 = 10, the group number 10')).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u4-1-sim-pt-5d-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 4: zinc (Z = 30) as Zn²⁺: a full d¹⁰ subshell, so not a transition ion.
    await sim.getByRole('radio', { name: '3d' }).click()
    await sim.getByRole('button', { name: /atomic number 30$/ }).click()
    await sim.getByRole('radio', { name: '+2' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Zn²⁺: [Ar] 3d¹⁰')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Zn²⁺ is not a transition ion')
    await sim.screenshot({ path: `test-results/screens/c12u4-1-sim-zn2plus-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Configuration Explorer does not scroll sideways at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
