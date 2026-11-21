import { test, expect, type Page } from '@playwright/test'

// The run is timed by requestAnimationFrame, so the pages must not compete for frames.
test.describe.configure({ mode: 'serial' })

const SIM = '/dev/sim/electroplating-lab'
const SCREEN_DIR = 'test-results/screens'

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

/** The Simulation root: the element that holds the aria-live readout. */
function simRoot(page: Page) {
  return page.locator('[aria-live="polite"]').locator('xpath=..')
}

async function expectGeometryRules(page: Page) {
  const svg = simRoot(page).locator('svg').first()
  await expect(svg).toBeVisible()
  // Every text element renders at 14 px or more (computed size, user units of the viewBox).
  const smallText = await simRoot(page).evaluate((root) => {
    const bad: string[] = []
    root.querySelectorAll('*').forEach((el) => {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '')
      if (!own) return
      if (el.closest('.katex')) return
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size < 14) bad.push(`${el.tagName}:${(el.textContent ?? '').trim().slice(0, 30)}:${size}`)
    })
    return bad
  })
  expect(smallText).toEqual([])
  // No drawn element leaves the SVG bounds (checked on rendered boxes, 1.5 px tolerance).
  const clipped = await svg.evaluate((s) => {
    const box = s.getBoundingClientRect()
    const out: string[] = []
    s.querySelectorAll('text, path, rect, circle, ellipse, line, polyline, polygon').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      if (r.left < box.left - 1.5 || r.top < box.top - 1.5 || r.right > box.right + 1.5 || r.bottom > box.bottom + 1.5) {
        out.push(`${el.tagName}:${(el.textContent ?? '').trim().slice(0, 20)}@${Math.round(r.left - box.left)},${Math.round(r.top - box.top)},${Math.round(r.right - box.left)},${Math.round(r.bottom - box.top)}`)
      }
    })
    return out
  })
  expect(clipped).toEqual([])
}

for (const scheme of ['light', 'dark'] as const) {
  test(`electroplating lab renders, responds and stays in bounds in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(SIM)
    const root = simRoot(page)
    await expect(root.locator('svg').first()).toBeVisible()

    // Default state: a completed 10 min run at 0.50 A with silver.
    await expect(root.locator('[aria-live="polite"]')).toContainText('Q = 300 C')
    await expect(root.locator('[aria-live="polite"]')).toContainText('0.335 g')
    await expectGeometryRules(page)
    await root.screenshot({ path: `${SCREEN_DIR}/c12u2-7-sim-default-${scheme}.png` })

    // Changed state 1: copper, 2 A for 30 min, half way through the run.
    await page.getByRole('radio', { name: 'Cu²⁺' }).click()
    await page.getByLabel('Current', { exact: true }).fill('2')
    await page.getByLabel('Time', { exact: true }).fill('30')
    await page.getByLabel('Run progress', { exact: true }).fill('50')
    // Run at 50%: 15 min elapsed, Q = 2 A × 900 s = 1800 C; m = (1800/96487) × (63.55/2) ≈ 0.593 g
    await expect(root.locator('[aria-live="polite"]')).toContainText('Q = 1,800 C')
    await expect(root.locator('[aria-live="polite"]')).toContainText('0.593 g')
    await expectGeometryRules(page)
    await root.screenshot({ path: `${SCREEN_DIR}/c12u2-7-sim-copper-half-${scheme}.png` })

    // Changed state 2: two cells in series, Ag⁺ and Cu²⁺ share one charge.
    await page.getByRole('radio', { name: 'Two cells in series' }).click()
    await expect(root.locator('[aria-live="polite"]')).toContainText('Same charge through both cells')
    await expectGeometryRules(page)
    await root.screenshot({ path: `${SCREEN_DIR}/c12u2-7-sim-series-${scheme}.png` })

    // Play runs the cell to the end.
    await page.getByRole('button', { name: 'Reset' }).click()
    await page.getByRole('button', { name: 'Play' }).click()
    // The run advances: the charge readout leaves zero and the button offers Pause.
    await expect(root.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect(root.locator('[aria-live="polite"]')).not.toContainText('Q = 0 C', { timeout: 15_000 })

    expect(errors).toEqual([])
  })
}

test('electroplating lab does not scroll sideways on a phone', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const errors = watchErrors(page)
  await page.goto(SIM)
  await expect(simRoot(page).locator('svg').first()).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
})
