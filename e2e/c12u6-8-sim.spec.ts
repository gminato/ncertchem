import { test, expect, type Page } from '@playwright/test'

const SIM = 'substitution-race'

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

/** Text leaves below 14 px RENDERED (SVG text scaled by its on-screen width over the viewBox width). */
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
          // Sub/Sup tspans (baseline-shift attribute) are exempt (ruling R12).
          if (el.closest('[baseline-shift]')) {
            node = walker.nextNode()
            continue
          }
          size *= svg.getBoundingClientRect().width / viewBoxWidth
        }
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (viewBox units). */
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
  test(`Substitution Race renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: default, tert-butyl bromide, SN2 view, ×1 and ×1.
    await expect(sim.locator('[aria-live="polite"]')).toContainText('rate = k[RX][Nu⁻]. [RX] × 1 and [Nu⁻] × 1 make the rate ×1.')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('2-methylpropan-2-ol')
    await sim.screenshot({ path: `test-results/screens/c12u6-8-sim-default-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 2: methyl bromide, both reactants doubled: rate ×4 under SN2.
    await sim.getByRole('radio', { name: 'Methyl' }).click()
    await sim.getByRole('radio', { name: '×2' }).nth(0).click()
    await sim.getByRole('radio', { name: '×2' }).nth(1).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Relative SN2 rate (Fig. 6.3): 30.')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('make the rate ×4.')
    await sim.screenshot({ path: `test-results/screens/c12u6-8-sim-methyl-sn2-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])

    // State 3: benzylic chloride, SN1 view, [Nu⁻] tripled: the SN1 rate ignores it.
    await sim.getByRole('radio', { name: 'Benzylic' }).click()
    await sim.getByRole('radio', { name: 'SN1 view' }).click()
    await sim.getByRole('radio', { name: '×1' }).nth(0).click()
    await sim.getByRole('radio', { name: '×3' }).nth(1).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('rate = k[RX]')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('the rate is ×1 whatever [Nu⁻] is.')
    await sim.screenshot({ path: `test-results/screens/c12u6-8-sim-benzylic-sn1-${scheme}.png` })
    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Substitution Race does not scroll sideways at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
