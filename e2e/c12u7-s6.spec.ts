import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-7/12-7-4-3-physical-properties'
const SIM_NAME = 'alcohol-properties-explorer'

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
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
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

/** Scroll a Scrolly step so its top sits above the desktop trigger line (50vh). */
async function activateScrollyStep(page: Page, stepLocator: Locator) {
  await stepLocator.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const targetY = window.scrollY + rect.top - window.innerHeight * 0.32
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' as ScrollBehavior })
  })
  await page.waitForTimeout(300)
}

test('Section 7.4.3 Scrolly animations and Simulation pass desktop checks and capture screenshots', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Physical Properties of Alcohols and Phenols')
  expect(await page.locator('.katex-error').count()).toBe(0)

  const scrollies: Array<{ name: string; steps: number }> = [
    { name: 'alcohol-hbond-boiling', steps: 4 },
    { name: 'alcohol-water-solubility', steps: 3 },
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
      await visual.screenshot({ path: `test-results/screens/c12u7-s6-${sc.name}-step${i + 1}-desktop.png` })
      expect(await smallTextLeaves(visual), `${sc.name} step ${i + 1} small text`).toEqual([])
      expect(await svgOutOfBounds(visual), `${sc.name} step ${i + 1} svg bounds`).toEqual([])
    }
  }

  // Flagship Simulation interactions
  const sim = page.locator(`[data-simulation="${SIM_NAME}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()

  // State 1: default (Comparable Mass -> Ethanol at 298 K -> Liquid, 351 K)
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Ethanol')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('351 K')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Liquid at 298 K')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-boiling-default-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim default small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim default svg bounds').toEqual([])

  // State 2: switch compound to Methoxymethane (248 K -> Gas at 298 K), adjust T to 220 K -> Liquid, reset to 298 K
  await sim.getByRole('radio', { name: 'Methoxymethane' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('248 K')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Gas (vapour) at 298 K')

  const slider = sim.getByRole('slider', { name: 'Temperature' })
  await slider.fill('220')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Liquid at 220 K')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-ether-liquid-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim ether liquid small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim ether liquid svg bounds').toEqual([])
  await sim.getByRole('button', { name: '298 K (Room T)' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Gas (vapour) at 298 K')

  // State 3: Chain Length set -> Butan-1-ol at 405 K (vapour above 390 K)
  await sim.getByRole('radio', { name: 'Chain Length' }).click()
  await sim.getByRole('radio', { name: 'Butan-1-ol' }).click()
  await slider.fill('405')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('390 K')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Gas (vapour) at 405 K')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-chain-vapour-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim chain vapour small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim chain vapour svg bounds').toEqual([])

  // State 4: Branching (C4 Isomers) -> 2-Methylpropan-2-ol at 298 K (qualitative trend)
  await sim.getByRole('button', { name: '298 K (Room T)' }).click()
  await sim.getByRole('radio', { name: /Branching/ }).click()
  await sim.getByRole('radio', { name: '2-Methylpropan-2-ol' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Qualitative trend')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-branching-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim branching small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim branching svg bounds').toEqual([])

  // State 5: Water Solubility mode -> Butan-1-ol, Phenol, n-Pentane
  await sim.getByRole('radio', { name: 'Water Solubility' }).click()
  await sim.getByRole('radio', { name: 'Butan-1-ol' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('9 g per 100 mL water')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-solubility-butanol-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim solubility butanol small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim solubility butanol svg bounds').toEqual([])

  await sim.getByRole('radio', { name: /Phenol/ }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Limited solubility')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-solubility-phenol-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim solubility phenol small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim solubility phenol svg bounds').toEqual([])

  await sim.getByRole('radio', { name: 'n-Pentane' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('essentially immiscible')
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-solubility-pentane-desktop.png' })
  expect(await smallTextLeaves(sim), 'sim solubility pentane small text').toEqual([])
  expect(await svgOutOfBounds(sim), 'sim solubility pentane svg bounds').toEqual([])

  expect(errors).toEqual([])
})

test('Section 7.4.3 renders cleanly in dark mode and mobile 390px without overflow', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = watchErrors(page)

  // Dark mode desktop check on Scrolly + Simulation
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto(SECTION_URL, { waitUntil: 'networkidle' })

  const hbondVisual = page.locator('[data-animation="alcohol-hbond-boiling"] [data-testid="scrolly-visual"]')
  await hbondVisual.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await hbondVisual.screenshot({ path: 'test-results/screens/c12u7-s6-scrolly-dark-desktop.png' })

  const sim = page.locator(`[data-simulation="${SIM_NAME}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  await sim.screenshot({ path: 'test-results/screens/c12u7-s6-sim-dark-desktop.png' })

  // Mobile 390x844 check
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto(SECTION_URL, { waitUntil: 'networkidle' })
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)

  const mobileScrolly = page.locator('[data-animation="alcohol-water-solubility"] [data-testid="scrolly-visual"]')
  await mobileScrolly.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await mobileScrolly.screenshot({ path: 'test-results/screens/c12u7-s6-scrolly-mobile.png' })

  const simMobile = page.locator(`[data-simulation="${SIM_NAME}"]`)
  await simMobile.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await simMobile.screenshot({ path: 'test-results/screens/c12u7-s6-sim-mobile.png' })

  expect(errors).toEqual([])
})
