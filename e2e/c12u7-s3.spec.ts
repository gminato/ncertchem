import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-7/12-7-3-structures-of-functional-groups'
const ANIM = 'functional-group-structures'
const SIM = 'functional-group-geometry-lab'

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

/**
 * Text leaves inside a container whose RENDERED size is below 14 px at this viewport.
 * For SVG text, computed font-size is in viewBox units, so scale by rendered SVG dimensions.
 */
async function smallTextLeaves(container: Locator): Promise<string[]> {
  return container.evaluate((root) => {
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
          const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          const rect = svg.getBoundingClientRect()
          if (vbW > 0 && vbH > 0) {
            const scale = Math.min(rect.width / vbW, rect.height / vbH)
            size *= scale
          }
        }
        if (size < 13.9) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(container: Locator): Promise<string[]> {
  return container.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (!vbW || !vbH || !frame.width || !frame.height) return
      const scale = Math.min(frame.width / vbW, frame.height / vbH)
      const renderedW = vbW * scale
      const renderedH = vbH * scale
      const offsetX = frame.left + (frame.width - renderedW) / 2
      const offsetY = frame.top + (frame.height - renderedH) / 2
      const leaves = svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline')
      leaves.forEach((el) => {
        if (el.closest('defs, clipPath, mask, pattern, symbol, marker')) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const x0 = (r.left - offsetX) / scale
        const y0 = (r.top - offsetY) / scale
        const x1 = (r.right - offsetX) / scale
        const y1 = (r.bottom - offsetY) / scale
        if (x0 < -1 || y0 < -1 || x1 > vbW + 1 || y1 > vbH + 1) {
          out.push(
            `${el.tagName} ${el.textContent?.trim().slice(0, 30) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`,
          )
        }
      })
    })
    return out
  })
}

test('Section 7.3 Scrolly (5 steps) and Geometry Lab on desktop 1280x800', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const scrolly = page.locator(`[data-animation="${ANIM}"]`)
  const visual = scrolly.getByTestId('scrolly-visual')
  const steps = scrolly.locator('[data-scrolly-step]')
  await expect(scrolly).toBeVisible()
  await expect(steps).toHaveCount(5)

  for (let i = 0; i < 5; i++) {
    await steps.nth(i).evaluate((el) => {
      const r = el.getBoundingClientRect()
      window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.35)
    })
    await expect(steps.nth(i)).toHaveAttribute('data-active', 'true', { timeout: 5000 })
    await page.waitForTimeout(150)
    expect(await smallTextLeaves(visual), `step ${i + 1} small text`).toEqual([])
    expect(await svgOutOfBounds(visual), `step ${i + 1} out of bounds`).toEqual([])
    await visual.screenshot({ path: `test-results/screens/c12u7-s3-step-${i + 1}-desktop.png` })
  }

  // Simulation checks
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()

  // Default: Methanol
  await expect(sim.getByTestId('readout-hybridisation')).toHaveText('sp³')
  await expect(sim.getByTestId('readout-co-length')).toHaveText('142 pm')
  await expect(sim.getByTestId('readout-oh-length')).toHaveText('96 pm')
  await expect(sim.getByTestId('readout-bond-angle')).toHaveText('108.9°')
  await expect(sim.getByTestId('readout-angle-delta')).toHaveText('−0.57° vs 109°28′')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-methanol-desktop.png' })

  // Phenol
  await sim.getByRole('radio', { name: /Phenol/ }).click()
  await expect(sim.getByTestId('readout-hybridisation')).toHaveText('sp²')
  await expect(sim.getByTestId('readout-co-length')).toHaveText('136 pm')
  await expect(sim.getByTestId('readout-oh-length')).toHaveText('Not printed in Fig. 7.1')
  await expect(sim.getByTestId('readout-bond-angle')).toHaveText('109°')
  await expect(sim.getByTestId('readout-angle-delta')).toHaveText('−0.47° vs 109°28′')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-phenol-desktop.png' })

  // Methoxymethane
  await sim.getByRole('radio', { name: /Methoxymethane/ }).click()
  await expect(sim.getByTestId('readout-hybridisation')).toHaveText('sp³')
  await expect(sim.getByTestId('readout-co-length')).toHaveText('141 pm')
  await expect(sim.getByTestId('readout-oh-length')).toHaveText('N/A')
  await expect(sim.getByTestId('readout-bond-angle')).toHaveText('111.7°')
  await expect(sim.getByTestId('readout-angle-delta')).toHaveText('+2.23° vs 109°28′')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-methoxymethane-desktop.png' })

  // Compare all 3 toggle
  await sim.getByRole('switch', { name: 'Compare all 3' }).click()
  await expect(sim.getByRole('button', { name: /Phenol/ })).toBeVisible()
  await sim.getByRole('button', { name: /Phenol/ }).click()
  await expect(sim.getByTestId('readout-co-length')).toHaveText('136 pm')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-compare-desktop.png' })

  // Return to single view and toggle overlays off cleanly
  await sim.getByRole('switch', { name: 'Compare all 3' }).click()
  await sim.getByRole('switch', { name: 'Show electronic/steric mechanism' }).click()
  await expect(sim.getByTestId('mechanism-badge')).toHaveCount(0)
  await sim.getByRole('switch', { name: 'Show lone pairs' }).click()
  await sim.getByRole('switch', { name: /Show tetrahedral/ }).click()
  expect(await svgOutOfBounds(sim)).toEqual([])

  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(errors).toEqual([])
})

test('Section 7.3 renders cleanly in dark mode on desktop 1280x800', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  const scrolly = page.locator(`[data-animation="${ANIM}"]`)
  const visual = scrolly.getByTestId('scrolly-visual')
  const steps = scrolly.locator('[data-scrolly-step]')

  await steps.nth(2).evaluate((el) => {
    const r = el.getBoundingClientRect()
    window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.35)
  })
  await expect(steps.nth(2)).toHaveAttribute('data-active', 'true', { timeout: 5000 })
  await page.waitForTimeout(150)
  await visual.screenshot({ path: 'test-results/screens/c12u7-s3-step-3-dark.png' })

  await steps.nth(4).evaluate((el) => {
    const r = el.getBoundingClientRect()
    window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.35)
  })
  await expect(steps.nth(4)).toHaveAttribute('data-active', 'true', { timeout: 5000 })
  await page.waitForTimeout(150)
  await visual.screenshot({ path: 'test-results/screens/c12u7-s3-step-5-dark.png' })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  await sim.getByRole('radio', { name: /Phenol/ }).click()
  await expect(sim.getByTestId('readout-co-length')).toHaveText('136 pm')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-phenol-dark.png' })

  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(errors).toEqual([])
})

test('Section 7.3 has no sideways scroll or out-of-bounds SVGs on mobile 390x844', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  const scrolly = page.locator(`[data-animation="${ANIM}"]`)
  const steps = scrolly.locator('[data-scrolly-step]')
  await steps.nth(0).evaluate((el) => {
    const r = el.getBoundingClientRect()
    window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.65)
  })
  await expect(steps.nth(0)).toHaveAttribute('data-active', 'true', { timeout: 5000 })
  await page.waitForTimeout(150)
  const visual = scrolly.getByTestId('scrolly-visual')
  expect(await svgOutOfBounds(visual)).toEqual([])
  await visual.screenshot({ path: 'test-results/screens/c12u7-s3-step-1-mobile.png' })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-mobile.png' })

  await sim.getByRole('switch', { name: 'Compare all 3' }).click()
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u7-s3-sim-compare-mobile.png' })

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
})
