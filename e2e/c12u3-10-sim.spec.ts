import { test, expect, type Page } from '@playwright/test'

const SIM = 'collision-lab'

// Reduced motion freezes the box, so every count below comes from the seeded "Advance 60 s" button and is stable.
test.use({ reducedMotion: 'reduce' })

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
 * Text leaves in the Simulation that render below 14 px at the page size. SVG text is measured as its
 * font-size times the rendered SVG width over the viewBox width (R4). KaTeX internals and the SR-only text are excluded.
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
          const [, , vbW] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          size = size * (svg.getBoundingClientRect().width / vbW)
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
  test(`Collision Lab renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.locator('.katex').first()).toBeVisible()

    // State 1: the default, 300 K, Eₐ = 10 kJ mol⁻¹, P = 0.25, before any collisions are counted.
    await expect(sim.locator('[aria-live="polite"]')).toContainText('predicted effective fraction is 4.54 × 10⁻³')
    await sim.screenshot({ path: `test-results/screens/c12u3-10-sim-default-${scheme}.png` })

    // State 2: after 60 s of simulated collisions at the default settings.
    await sim.getByRole('button', { name: 'Advance 60 s' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('A–B collisions')
    await sim.screenshot({ path: `test-results/screens/c12u3-10-sim-advanced-${scheme}.png` })

    // State 3: hotter and with a lower barrier (350 K, 20 kJ mol⁻¹) and an orientation dial at P = 0.6.
    await sim.getByRole('slider', { name: /Temperature/ }).fill('350')
    await sim.getByRole('slider', { name: /Activation energy/ }).fill('20')
    await sim.getByRole('slider', { name: /Steric factor/ }).fill('0.6')
    await sim.getByRole('button', { name: 'Reset counts' }).click()
    await sim.getByRole('button', { name: 'Advance 60 s' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('350 K')
    await sim.screenshot({ path: `test-results/screens/c12u3-10-sim-hot-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Collision Lab does not scroll sideways at phone width', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
