import { test, expect, type Page } from '@playwright/test'

const SIM = 'rate-slope-explorer'

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
  test(`Rate Slope Explorer renders and is accessible in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.locator('.katex').first()).toBeVisible()

    // State 1: the default, A -> B, chord 0 to 500 s and tangent at 250 s (the Prose values).
    const live = sim.locator('[aria-live="polite"]')
    await expect(live).toContainText('average rate of reaction 1.26 × 10⁻⁴ mol L⁻¹ s⁻¹')
    await expect(live).toContainText('instantaneous rate of reaction 1.21 × 10⁻⁴ mol L⁻¹ s⁻¹')
    await sim.screenshot({ path: `test-results/screens/c12u3-1-sim-default-${scheme}.png` })

    // State 2: chord 200 to 300 s with 2A -> B; the rate of reaction halves the disappearance of A.
    await sim.getByRole('slider', { name: /Chord start/ }).fill('200')
    await sim.getByRole('slider', { name: /Chord end/ }).fill('300')
    await sim.getByRole('radio', { name: '2A → B' }).click()
    await expect(live).toContainText('average rate of reaction 6.08 × 10⁻⁵')
    await sim.screenshot({ path: `test-results/screens/c12u3-1-sim-chord-2a-${scheme}.png` })

    // State 3: tangent at 500 s with 3A -> 2B.
    await sim.getByRole('slider', { name: /Tangent time/ }).fill('500')
    await sim.getByRole('radio', { name: '3A → 2B' }).click()
    await expect(live).toContainText('Tangent at 500 s')
    await sim.screenshot({ path: `test-results/screens/c12u3-1-sim-tangent-500-${scheme}.png` })

    expect(await smallTextLeaves(page)).toEqual([])
    expect(await svgOutOfBounds(page)).toEqual([])
    expect(await page.locator(`[data-simulation="${SIM}"] .katex-error`).count()).toBe(0)
    expect(errors).toEqual([])
  })
}

test('Rate Slope Explorer: 3A → 2B at the 250 s tangent shows the Prose values', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  await sim.getByRole('radio', { name: '3A → 2B' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('instantaneous rate of reaction 4.04 × 10⁻⁵ mol L⁻¹ s⁻¹')
  const card = sim.locator('section[aria-label="Instantaneous rate at the tangent"]')
  await expect(card).toContainText('1.21 × 10⁻⁴ mol L⁻¹ s⁻¹')
  await expect(card).toContainText('8.09 × 10⁻⁵ mol L⁻¹ s⁻¹')
})

test('Rate Slope Explorer: dragging the tangent point moves the tangent time', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  await sim.scrollIntoViewIfNeeded()
  const live = sim.locator('[aria-live="polite"]')
  await expect(live).toContainText('Tangent at 250 s')
  // Handles are drawn in order: chord start, chord end, tangent point.
  const handle = sim.locator('svg[role="img"] circle[r="16"]').nth(2)
  const box = await handle.boundingBox()
  if (box === null) throw new Error('tangent handle is not visible')
  const x0 = box.x + box.width / 2
  const y0 = box.y + box.height / 2
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  await page.mouse.move(x0 + 40, y0, { steps: 8 })
  await page.mouse.up()
  await expect(live).not.toContainText('Tangent at 250 s')
  const moved = Number(await sim.getByRole('slider', { name: /Tangent time/ }).inputValue())
  expect(moved).toBeGreaterThan(250)
})

test('Rate Slope Explorer has no sideways scroll at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await expect(sim).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
  await sim.screenshot({ path: 'test-results/screens/c12u3-1-sim-phone.png' })
})
