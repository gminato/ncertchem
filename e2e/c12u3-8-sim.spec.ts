import { test, expect, type Page } from '@playwright/test'

const SIM = 'arrhenius-lab'

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

/** HTML text leaves in the Simulation that render below 14 px (KaTeX and the SR-only line excluded). */
async function smallHtmlText(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"]`).evaluate((root) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el && !el.closest('svg') && !el.closest('.katex') && !el.closest('[class*="srOnly"]') && !el.closest('[class*="eyebrow"]')) {
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 14) bad.push(`${size}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** SVG text rendered below 14 px: font-size × (rendered SVG width / viewBox width), per R4. */
async function smallSvgText(page: Page): Promise<string[]> {
  return page.locator(`[data-simulation="${SIM}"] svg[role="img"]`).evaluateAll((svgs) => {
    const bad: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const scale = svg.getBoundingClientRect().width / vbW
      svg.querySelectorAll('text').forEach((el) => {
        if (!el.textContent?.trim()) return
        const size = parseFloat(getComputedStyle(el).fontSize) * scale
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${el.textContent.trim().slice(0, 40)}`)
      })
    })
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
  test(`Arrhenius Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // State 1: the default, 298 K and Eₐ 50.0 kJ mol⁻¹ (k = 3.00 × 10⁻⁴ s⁻¹, ratio 1.93).
    await expect(sim.locator('[aria-live="polite"]')).toContainText('k = 3.00 × 10⁻⁴ s⁻¹')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('multiplies it by 1.93')
    await sim.screenshot({ path: `test-results/screens/c12u3-8-sim-default-${scheme}.png` })

    // State 2: raised by 10 K with the button, so the readout tracks 308 K.
    await sim.getByRole('button', { name: '+10 K' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('At 308 K')
    await sim.screenshot({ path: `test-results/screens/c12u3-8-sim-warm-${scheme}.png` })

    // State 3: a higher barrier, Eₐ 80.0 kJ mol⁻¹, at 320 K.
    await sim.getByRole('slider', { name: /Activation energy/ }).fill('80')
    await sim.getByRole('slider', { name: /Temperature/ }).fill('320')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Eₐ 80.0 kJ mol⁻¹')
    await sim.screenshot({ path: `test-results/screens/c12u3-8-sim-high-barrier-${scheme}.png` })

    expect(await smallHtmlText(page)).toEqual([])
    expect(await smallSvgText(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Arrhenius Lab does not scroll sideways at phone width', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
