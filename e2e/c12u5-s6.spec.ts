import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-5/12-5-5-4-crystal-field-theory'
const SIM_NAME = 'crystal-field-splitting-lab'

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

/** Check that every visible text leaf inside `scope` renders at >= 14 px. */
async function smallTextLeaves(scope: Locator): Promise<string[]> {
  return scope.evaluate((root) => {
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
          const vbParts = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          const viewBoxWidth = vbParts[2] || 1
          const rect = svg.getBoundingClientRect()
          if (rect.width > 0) size *= rect.width / viewBoxWidth
        }
        if (size < 13.9) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Check that every drawn SVG leaf stays strictly within its viewBox. */
async function svgOutOfBounds(scope: Locator): Promise<string[]> {
  return scope.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (frame.width === 0 || frame.height === 0) return
      const scale = vbW / frame.width
      const leaves = svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline')
      leaves.forEach((el) => {
        if (el.closest('defs, clipPath, mask, pattern, symbol, marker')) return
        if (parseFloat(getComputedStyle(el).opacity) === 0) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const x0 = (r.left - frame.left) * scale
        const y0 = (r.top - frame.top) * scale
        const x1 = (r.right - frame.left) * scale
        const y1 = (r.bottom - frame.top) * scale
        if (x0 < -1 || y0 < -1 || x1 > vbW + 1 || y1 > vbH + 1) {
          out.push(
            `${el.tagName} ${el.textContent?.trim().slice(0, 30) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`
          )
        }
      })
    })
    return out
  })
}

/** Scroll a Scrolly step so its top sits above the desktop trigger line (50vh). */
async function activateScrollyStep(page: Page, stepLocator: Locator) {
  await stepLocator.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const targetY = window.scrollY + rect.top - window.innerHeight * 0.32
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' as ScrollBehavior })
  })
  await page.waitForTimeout(350)
}

test('Section 5.5.4 Scrolly animations and Simulation pass desktop checks and capture screenshots', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Crystal Field Theory')
  expect(await page.locator('.katex-error').count()).toBe(0)

  const scrollies: Array<{ name: string; steps: number }> = [
    { name: 'cft-octahedral-splitting', steps: 4 },
    { name: 'cft-high-low-spin', steps: 5 },
    { name: 'cft-tetrahedral-splitting', steps: 3 },
  ]

  for (const sc of scrollies) {
    const root = page.locator(`[data-animation="${sc.name}"]`)
    await expect(root).toBeVisible()
    const visual = root.locator('[data-testid="scrolly-visual"]')
    const stepNodes = root.locator('[data-scrolly-step]')
    expect(await stepNodes.count()).toBe(sc.steps)

    for (let i = 0; i < sc.steps; i++) {
      await activateScrollyStep(page, stepNodes.nth(i))
      await expect(stepNodes.nth(i)).toHaveAttribute('data-active', 'true')
      await visual.screenshot({ path: `test-results/screens/c12u5-s6-${sc.name}-step${i + 1}-desktop.png` })
      expect(await smallTextLeaves(visual), `${sc.name} step ${i + 1} small text`).toEqual([])
      expect(await svgOutOfBounds(visual), `${sc.name} step ${i + 1} svg bounds`).toEqual([])
    }
  }

  // Flagship Simulation interactions
  const sim = page.locator(`[data-simulation="${SIM_NAME}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()

  // State 1: default (d4, Octahedral, H2O, weak field high spin)
  await expect(sim.locator('[aria-live="polite"]')).toContainText('d4 octahedral')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('4 unpaired electrons')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s6-sim-oct-weak-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim default small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim default svg bounds').toEqual([])

  // State 2: switch ligand to CN- (index 13) -> strong field low spin
  await sim.getByRole('combobox', { name: 'Ligand from spectrochemical series' }).selectOption('13')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('2 unpaired electrons')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Strong field · Low spin')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s6-sim-oct-strong-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim strong small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim strong svg bounds').toEqual([])

  // State 3: increase d count to d6 (click '+' twice) -> 0 unpaired electrons
  const incBtn = sim.getByRole('button', { name: 'Increase d electrons' })
  await incBtn.click()
  await incBtn.click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('d6 octahedral')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('0 unpaired electrons')

  // State 4: switch to Tetrahedral geometry -> inverted e/t2, high spin
  await sim.getByRole('button', { name: 'Tetrahedral' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('d6 tetrahedral')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('4 unpaired electrons')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('low spin rarely observed')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s6-sim-tetrahedral-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim tetrahedral small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim tetrahedral svg bounds').toEqual([])

  expect(errors).toEqual([])
})

test('Section 5.5.4 renders cleanly in dark mode and mobile 390px without overflow', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = watchErrors(page)

  // Dark mode desktop check on Simulation
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto(SECTION_URL, { waitUntil: 'networkidle' })
  const sim = page.locator(`[data-simulation="${SIM_NAME}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  await sim.screenshot({ path: 'test-results/screens/c12u5-s6-sim-dark-desktop.png' })

  // Mobile 390x844 check
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto(SECTION_URL, { waitUntil: 'networkidle' })
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)

  const octVisual = page.locator('[data-animation="cft-octahedral-splitting"] [data-testid="scrolly-visual"]')
  await octVisual.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await octVisual.screenshot({ path: 'test-results/screens/c12u5-s6-scrolly-mobile.png' })

  const simMobile = page.locator(`[data-simulation="${SIM_NAME}"]`)
  await simMobile.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await simMobile.screenshot({ path: 'test-results/screens/c12u5-s6-sim-mobile.png' })

  expect(errors).toEqual([])
})
