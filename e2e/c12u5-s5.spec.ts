import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-5-5-1-valence-bond-theory'
const ANIMATION = 'vbt-hybridisation'
const SIM = 'vbt-orbital-lab'
const STEP_COUNT = 5

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  return errors
}

/** Text leaves inside a root whose rendered size is below `minPx`. */
async function smallTextLeaves(page: Page, selector: string, minPx = 14): Promise<string[]> {
  return page.locator(selector).evaluate((root, min) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (
        text &&
        el &&
        !el.closest('.katex') &&
        !el.closest('[class*="srOnly"]') &&
        !el.closest('[class*="eyebrow"]')
      ) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        const svg = el.closest('svg')
        if (svg) {
          const viewBoxWidth = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          if (viewBoxWidth > 0) {
            size *= svg.getBoundingClientRect().width / viewBoxWidth
          }
        }
        if (size < min) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  }, minPx)
}

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(page: Page, selector: string): Promise<string[]> {
  return page.locator(`${selector} svg[role="img"]`).evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (frame.width === 0 || frame.height === 0) return
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
          out.push(
            `${el.tagName} ${el.textContent?.trim().slice(0, 30) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`
          )
        }
      })
    })
    return out
  })
}

test.describe('Section 5.5.1-5.5.3 Scrolly Animation and VBT Lab (Desktop 1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('renders every Scrolly Step and Simulation state cleanly with screenshots', async ({ page }) => {
    test.setTimeout(180_000)
    const errors = watchErrors(page)

    await page.goto(`/class-12/unit-5/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await expect(scrolly).toBeVisible()
    const steps = scrolly.locator('[data-scrolly-step]')
    await expect(steps).toHaveCount(STEP_COUNT)

    for (let k = 0; k < STEP_COUNT; k++) {
      await steps.nth(k).scrollIntoViewIfNeeded()
      await page.waitForTimeout(700)
      const panel = scrolly.locator('svg[role="img"]').first()
      await expect(panel).toBeVisible()
      await panel.screenshot({ path: `test-results/screens/c12u5-s5-step${k}-desktop.png` })
      expect(await svgOutOfBounds(page, `[data-animation="${ANIMATION}"]`)).toEqual([])
      expect(await smallTextLeaves(page, `[data-animation="${ANIMATION}"] svg[role="img"]`, 14)).toEqual([])
    }

    // Now test the embedded Simulation on the Section page
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()

    // Default state: [Co(NH3)6]3+
    await expect(sim.locator('[aria-live="polite"]')).toContainText('[Co(NH₃)₆]³⁺')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('0.00 BM')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-default-desktop.png' })
    expect(await smallTextLeaves(page, `[data-simulation="${SIM}"]`, 14)).toEqual([])
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])

    // Switch preset to [CoF6]3-
    await sim.getByRole('combobox', { name: 'NCERT complex preset' }).selectOption('co-f-6')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('sp³d²')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('4.90 BM')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-cof6-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])

    // Switch preset to [Ni(CN)4]2- (square planar)
    await sim.getByRole('combobox', { name: 'NCERT complex preset' }).selectOption('ni-cn-4')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('dsp²')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Square planar')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-nicn4-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])

    // Toggle to tetrahedral sp3 via Segmented control
    await sim.getByRole('radio', { name: 'sp³ (Tetrahedral)' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('2 unpaired electrons')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('2.83 BM')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-custom-tet-desktop.png' })

    // Switch preset to [Ni(CO)4] (3d10, diamagnetic, locked spin path)
    await sim.getByRole('combobox', { name: 'NCERT complex preset' }).selectOption('ni-co-4')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Diamagnetic')
    await expect(sim.locator('[aria-disabled="true"]')).toHaveCount(1)
    await expect(sim).not.toContainText('high spin')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-nico4-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])
    expect(await smallTextLeaves(page, `[data-simulation="${SIM}"]`, 14)).toEqual([])

    // Verify KaTeX and zero console errors
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('Section 5.5.1-5.5.3 Dark Mode & Mobile (390x844)', () => {
  test('renders VBT Lab cleanly in dark mode at 1280x800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ colorScheme: 'dark' })
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.getByRole('combobox', { name: 'NCERT complex preset' }).selectOption('fe-f-6')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('5.92 BM')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-fef6-dark.png' })
    expect(await smallTextLeaves(page, `[data-simulation="${SIM}"]`, 14)).toEqual([])
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])
    expect(errors).toEqual([])
  })

  test('does not scroll sideways at 390x844 and captures mobile screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: 'light' })
    const errors = watchErrors(page)

    // Verify standalone Simulation does not overflow at 390px
    await page.goto(`/dev/sim/${SIM}`)
    const devSim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(devSim).toBeVisible()
    const devScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(devScrollWidth).toBeLessThanOrEqual(390)

    await page.goto(`/class-12/unit-5/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await scrolly.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await scrolly.locator('svg[role="img"]').first().screenshot({
      path: 'test-results/screens/c12u5-s5-scrolly-mobile.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()
    await sim.screenshot({ path: 'test-results/screens/c12u5-s5-sim-mobile.png' })

    // Verify neither Scrolly nor Simulation overflows 390px
    const overflowers = await page.evaluate(() => {
      const bad: string[] = []
      for (const sel of ['[data-animation="vbt-hybridisation"]', '[data-simulation="vbt-orbital-lab"]']) {
        const el = document.querySelector(sel)
        if (el && el.getBoundingClientRect().right > 391) {
          bad.push(`${sel}: right=${el.getBoundingClientRect().right.toFixed(1)}`)
        }
      }
      return bad
    })
    expect(overflowers).toEqual([])
    expect(errors).toEqual([])
  })
})
