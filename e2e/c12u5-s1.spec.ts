import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '12-5-1-werners-theory'
const URL = `/class-12/unit-5/${SLUG}`
const ANIMATION = 'werner-cobalt-ammine'
const SIM = 'werner-precipitation-lab'
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

/** Text leaves inside a root whose rendered font size is below 14 px. */
async function smallTextLeaves(root: Locator): Promise<string[]> {
  return root.evaluate((elRoot) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(elRoot, NodeFilter.SHOW_TEXT)
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
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(root: Locator): Promise<string[]> {
  return root.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (frame.width === 0 || vbW === 0) return
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

for (const scheme of ['light', 'dark'] as const) {
  test(`Section 5.1 Scrolly and Simulation work cleanly in ${scheme} (desktop 1280x800)`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const errors = watchErrors(page)

    await page.goto(URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // 1. Scrolly animation: step through all 5 steps
    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await expect(scrolly).toBeVisible()
    const steps = scrolly.locator('[data-scrolly-step]')
    await expect(steps).toHaveCount(STEP_COUNT)

    for (let k = 0; k < STEP_COUNT; k++) {
      await steps.nth(k).scrollIntoViewIfNeeded()
      await page.waitForTimeout(450)
      const visualPanel = scrolly.getByTestId('scrolly-visual')
      const svg = visualPanel.locator('svg[role="img"]').first()
      await expect(svg).toBeVisible()
      await visualPanel.screenshot({ path: `test-results/screens/c12u5-s1-step${k + 1}-${scheme}.png` })
      expect(await smallTextLeaves(visualPanel)).toEqual([])
      expect(await svgOutOfBounds(visualPanel)).toEqual([])
    }

    // 2. Simulation: werner-precipitation-lab
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // Default state: Yellow, before AgNO3
    await expect(sim.getByTestId('entity-formula')).toHaveText('[Co(NH₃)₆]³⁺')
    await expect(sim.getByTestId('verdict-readout')).toHaveText('secondary valence 6 satisfied')
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Add AgNO3 on Yellow -> 3 mol AgCl
    await sim.getByRole('button', { name: 'Add AgNO₃ (excess, cold)' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('3 mol AgCl precipitated')
    await sim.screenshot({ path: `test-results/screens/c12u5-s1-sim-yellow-agcl-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Switch to Violet preset -> isomer note + 1 mol AgCl
    await sim.getByRole('button', { name: 'Violet' }).click()
    await expect(sim.getByTestId('isomer-note')).toContainText('Violet isomer')
    await sim.getByRole('button', { name: 'Add AgNO₃ (excess, cold)' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('1 mol AgCl precipitated')
    await sim.screenshot({ path: `test-results/screens/c12u5-s1-sim-violet-agcl-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Test stepper: increase NH3 to 5 -> 5 + 2 = 7 -> too many groups
    await sim.getByRole('button', { name: 'Increase NH3 on cobalt' }).click()
    await expect(sim.getByTestId('verdict-readout')).toHaveText('too many groups')
    await sim.screenshot({ path: `test-results/screens/c12u5-s1-sim-overflow-${scheme}.png` })
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Test stepper: decrease NH3 twice to 3 -> 3 + 2 = 5 -> positions empty
    await sim.getByRole('button', { name: 'Decrease NH3 on cobalt' }).click()
    await sim.getByRole('button', { name: 'Decrease NH3 on cobalt' }).click()
    await expect(sim.getByTestId('verdict-readout')).toHaveText('positions empty')
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Test neutral complex: increase bound Cl to 3 -> 3 + 3 = 6 -> none (neutral)
    await sim.getByRole('button', { name: 'Increase bound Cl on cobalt' }).click()
    await expect(sim.getByTestId('electrolyte-readout')).toHaveText('none (neutral)')
    await expect(sim.getByTestId('verdict-readout')).toHaveText('secondary valence 6 satisfied')
    expect(await svgOutOfBounds(sim)).toEqual([])

    // KaTeX and console errors
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('Section 5.1 renders cleanly at mobile 390x844 with zero horizontal scroll', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(URL)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)

  const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
  const steps = scrolly.locator('[data-scrolly-step]')
  await steps.nth(0).scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  await scrolly.getByTestId('scrolly-visual').screenshot({ path: 'test-results/screens/c12u5-s1-step1-mobile.png' })

  await steps.nth(3).scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  await scrolly.getByTestId('scrolly-visual').screenshot({ path: 'test-results/screens/c12u5-s1-step4-mobile.png' })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await sim.getByRole('button', { name: 'Green' }).click()
  await sim.getByRole('button', { name: 'Add AgNO₃ (excess, cold)' }).click()
  await sim.screenshot({ path: 'test-results/screens/c12u5-s1-sim-mobile.png' })

  expect(await svgOutOfBounds(sim)).toEqual([])
  expect(errors).toEqual([])
})
