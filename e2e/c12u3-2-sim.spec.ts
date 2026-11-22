import { test, expect, type Page } from '@playwright/test'

const SIM = 'initial-rates-lab'

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

/** Drawn shapes of the Simulation's SVG drawing that fall outside its viewBox (getBBox, in user units). */
async function drawingOutsideViewBox(page: Page): Promise<string[]> {
  return page.locator('svg[data-drawing="initial-rates"]').evaluate((svg) => {
    const vb = (svg as SVGSVGElement).viewBox.baseVal
    const tol = 0.5
    const bad: string[] = []
    svg.querySelectorAll('text, rect, circle, path, line').forEach((el) => {
      if (el.closest('defs, clipPath')) return
      const box = (el as SVGGraphicsElement).getBBox()
      const inside =
        box.x >= vb.x - tol &&
        box.y >= vb.y - tol &&
        box.x + box.width <= vb.x + vb.width + tol &&
        box.y + box.height <= vb.y + vb.height + tol
      if (!inside) bad.push(`${el.tagName} "${(el.textContent ?? '').slice(0, 30)}" at ${box.x.toFixed(1)},${box.y.toFixed(1)}`)
    })
    return bad
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test(`Initial-rates Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.getByRole('button', { name: 'Run', exact: true })).toBeVisible()

    // State 1: default, NO + O₂ at 0.30 and 0.30 mol L⁻¹, empty table.
    await sim.screenshot({ path: `test-results/screens/c12u3-2-sim-default-${scheme}.png` })

    // State 2: Table 3.2 experiments 1 and 2 (double [NO]) plus experiment 3 (double [O₂]).
    await sim.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('0.0960')
    await sim.getByRole('slider', { name: 'Starting [NO]' }).fill('0.6')
    await sim.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('0.384')
    await sim.getByRole('slider', { name: 'Starting [NO]' }).fill('0.3')
    await sim.getByRole('slider', { name: 'Starting [O₂]' }).fill('0.6')
    await sim.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('0.192')
    const finder = sim.getByRole('region', { name: 'Find the orders' })
    await finder.scrollIntoViewIfNeeded()
    await finder.getByRole('radiogroup', { name: 'Second run' }).getByRole('radio', { name: 'Run 3' }).click()
    await expect(finder.getByText(/order in O₂ is 1\.00/)).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u3-2-sim-compare-${scheme}.png` })

    // State 3: all four Table 3.2 runs and the revealed rate law with k = 3.56.
    await sim.getByRole('slider', { name: 'Starting [NO]' }).fill('0.6')
    await sim.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('0.768')
    await sim.getByRole('button', { name: 'Reveal the rate law and k' }).click()
    await expect(sim.getByText(/k = 3\.56 mol⁻² L² s⁻¹/)).toBeVisible()
    await expect(sim.locator('.katex-display').first()).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u3-2-sim-revealed-${scheme}.png` })

    await expect(sim.locator('.katex-error')).toHaveCount(0)
    const drawing = sim.locator('svg[data-drawing="initial-rates"]')
    await expect(drawing).toBeVisible()
    expect(await drawing.locator('rect, circle').count(), 'drawn spheres and bars').toBeGreaterThan(0)
    expect(await drawingOutsideViewBox(page), 'drawing outside its viewBox').toEqual([])
    expect(await smallTextLeaves(page), 'text below 14 px').toEqual([])
    expect(errors, 'console errors').toEqual([])
  })
}

test('Initial-rates Lab has no sideways scroll at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
