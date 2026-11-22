import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-5/12-5-3-nomenclature'
const ANIM = 'naming-assembler'
const SIM = 'complex-namer'

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
 * For SVG text, computed font-size is in viewBox units, so scale by rendered SVG width / viewBox width.
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

test('Section 5.3 Scrolly (6 steps) and Complex Namer on desktop 1280x800', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  const scrolly = page.locator(`[data-animation="${ANIM}"]`)
  const visual = scrolly.getByTestId('scrolly-visual')
  const steps = scrolly.locator('[data-scrolly-step]')
  await expect(scrolly).toBeVisible()
  await expect(steps).toHaveCount(6)

  for (let i = 0; i < 6; i++) {
    await steps.nth(i).evaluate((el) => {
      const r = el.getBoundingClientRect()
      const targetY = window.scrollY + r.top - window.innerHeight * 0.35
      window.scrollTo(0, targetY)
    })
    await expect(steps.nth(i)).toHaveAttribute('data-active', 'true', { timeout: 5000 })
    await page.waitForTimeout(150)
    expect(await smallTextLeaves(visual)).toEqual([])
    expect(await svgOutOfBounds(visual)).toEqual([])
    await visual.screenshot({ path: `test-results/screens/c12u5-s3-step-${i + 1}-desktop.png` })
  }

  // Simulation checks
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  await expect(sim.getByTestId('complex-formula')).toHaveText('[Co(NH₃)₄Cl₂]Cl')
  await expect(sim.getByTestId('complex-name')).toHaveText('tetraamminedichloridocobalt(III) chloride')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u5-s3-sim-default-desktop.png' })

  // Switch to anionic complex K4[Fe(CN)6]
  await sim.getByRole('combobox', { name: 'Central metal' }).selectOption('Fe')
  await sim.getByRole('combobox', { name: 'Oxidation state' }).selectOption('2')
  await sim.getByRole('combobox', { name: 'Ligand slot 1' }).selectOption('CN')
  await sim.getByRole('slider', { name: 'Ligand slot 1 count' }).fill('6')
  await sim.getByRole('slider', { name: 'Ligand slot 2 count' }).fill('0')
  await sim.getByRole('combobox', { name: 'Counter ion' }).selectOption('K')
  await expect(sim.getByTestId('complex-formula')).toHaveText('K₄[Fe(CN)₆]')
  await expect(sim.getByTestId('complex-name')).toHaveText('potassium hexacyanidoferrate(II)')
  await expect(sim.locator('[data-rule="anion-ate"]')).toHaveAttribute('data-active', 'true')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u5-s3-sim-anionic-desktop.png' })

  // Test impossible counter ion warning & recovery button
  await sim.getByRole('combobox', { name: 'Counter ion' }).selectOption('Cl')
  await expect(sim.getByRole('status')).toContainText('cannot be balanced')
  await sim.getByRole('button', { name: /Switch to K⁺/ }).click()
  await expect(sim.getByTestId('complex-formula')).toHaveText('K₄[Fe(CN)₆]')

  // Test entity multiplicity subscript when entityCount > 1: [Co(en)3]2(SO4)3
  await sim.getByRole('combobox', { name: 'Central metal' }).selectOption('Co')
  await sim.getByRole('combobox', { name: 'Oxidation state' }).selectOption('3')
  await sim.getByRole('combobox', { name: 'Ligand slot 1' }).selectOption('en')
  await sim.getByRole('slider', { name: 'Ligand slot 1 count' }).fill('3')
  await sim.getByRole('slider', { name: 'Ligand slot 2 count' }).fill('0')
  await sim.getByRole('combobox', { name: 'Counter ion' }).selectOption('SO4')
  await expect(sim.getByTestId('complex-formula')).toHaveText('[Co(en)₃]₂(SO₄)₃')
  await expect(sim.getByTestId('entity-count-subscript')).toHaveText('2')
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u5-s3-sim-sulphate-desktop.png' })

  // Toggle Name to formula mode
  await sim.getByRole('button', { name: 'Name to formula' }).click()
  await expect(sim).toContainText('tetraamminedichloridocobalt(III) chloride')
  await sim.getByRole('button', { name: 'Check formula' }).click()
  await expect(sim.getByTestId('reverse-feedback')).toContainText('Not quite yet')
  await sim.getByRole('button', { name: 'Reveal answer' }).click()
  await expect(sim.getByTestId('reverse-feedback')).toContainText('Answer loaded')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s3-sim-reverse-desktop.png' })

  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(errors).toEqual([])
})

test('Section 5.3 renders cleanly in dark mode on desktop 1280x800', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  const scrolly = page.locator(`[data-animation="${ANIM}"]`)
  const visual = scrolly.getByTestId('scrolly-visual')
  const steps = scrolly.locator('[data-scrolly-step]')

  await steps.nth(4).evaluate((el) => {
    const r = el.getBoundingClientRect()
    window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.35)
  })
  await expect(steps.nth(4)).toHaveAttribute('data-active', 'true', { timeout: 5000 })
  await page.waitForTimeout(150)
  await visual.screenshot({ path: 'test-results/screens/c12u5-s3-step-5-dark.png' })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  await sim.screenshot({ path: 'test-results/screens/c12u5-s3-sim-default-dark.png' })
  expect(errors).toEqual([])
})

test('Section 5.3 has no sideways scroll on mobile 390x844', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  const scrolly = page.locator(`[data-animation="${ANIM}"]`)
  await scrolly.scrollIntoViewIfNeeded()
  await expect(scrolly).toBeVisible()
  await scrolly.getByTestId('scrolly-visual').screenshot({
    path: 'test-results/screens/c12u5-s3-step-1-mobile.png',
  })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  expect(await svgOutOfBounds(sim)).toEqual([])
  await sim.screenshot({ path: 'test-results/screens/c12u5-s3-sim-mobile.png' })

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
})
