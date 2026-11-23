import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-7/12-7-4-1-preparation-of-alcohols'
const SCROLLY_1 = 'alkene-hydration-mechanisms'
const SCROLLY_2 = 'carbonyl-reduction-and-grignard'
const SIM = 'alcohol-prep-lab'

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

/** Text leaves inside a container whose rendered size on screen is below 14 px. */
async function smallTextLeaves(container: Locator): Promise<string[]> {
  return container.evaluate((root) => {
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
          const vbW = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          if (vbW > 0) size *= svg.getBoundingClientRect().width / vbW
        }
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Drawn SVG leaves whose rendered bounds extend outside the SVG viewBox (in viewBox units). */
async function svgOutOfBounds(container: Locator): Promise<string[]> {
  return container.locator('svg[role="img"]').evaluateAll((svgs) => {
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

async function verifyScrolly(
  page: Page,
  animation: string,
  visualTestId: string,
  stepCount: number,
  prefix: string,
  scheme: 'light' | 'dark'
) {
  const scrolly = page.locator(`[data-animation="${animation}"]`)
  await expect(scrolly).toBeVisible()
  const steps = scrolly.locator('[data-scrolly-step]')
  await expect(steps).toHaveCount(stepCount)

  const panel = scrolly.locator(`[data-testid="${visualTestId}"]`)
  for (let k = 0; k < stepCount; k++) {
    await steps.nth(k).evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(350)
    await expect(panel).toHaveAttribute('data-step', String(k))
    await expect(panel).toBeVisible()
    expect(await smallTextLeaves(panel)).toEqual([])
    expect(await svgOutOfBounds(scrolly)).toEqual([])
    await panel.screenshot({ path: `test-results/screens/${prefix}-step${k + 1}-${scheme}.png` })
  }
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7 Section 7.4.1 (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders Scrolly animations and Alcohol Synthesis Workbench cleanly', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)

      await verifyScrolly(page, SCROLLY_1, 'alkene-hydration-visual', 5, 'c12u7-s4-scrolly1', scheme)
      await verifyScrolly(page, SCROLLY_2, 'carbonyl-grignard-visual', 4, 'c12u7-s4-scrolly2', scheme)

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toBeVisible()

      // State 1: Propene + H2O / H+ -> Propan-2-ol (2°)
      await expect(sim.getByTestId('readout-product')).toContainText('Propan-2-ol')
      await expect(sim.getByTestId('readout-degree')).toContainText('2°')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s4-sim-alkene-acid-${scheme}.png` })

      // State 2: Propene + Hydroboration-oxidation -> Propan-1-ol (1°) + B(OH)3
      await sim.getByTestId('reag-hydroboration-oxidation').click()
      await expect(sim.getByTestId('readout-product')).toContainText('Propan-1-ol')
      await expect(sim.getByTestId('readout-degree')).toContainText('1°')
      await expect(sim.getByTestId('readout-byproducts')).toContainText('B(OH)₃')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s4-sim-alkene-hydroboration-${scheme}.png` })

      // State 3: Carbonyls & Acids -> Butanoic acid + NaBH4 -> No reaction
      await sim.getByRole('radio', { name: 'Carbonyls & Acids' }).click()
      await sim.getByTestId('sub-butanoic-acid').click()
      await sim.getByTestId('reag-nabh4').click()
      await expect(sim.getByTestId('readout-degree')).toContainText('No reaction')
      await expect(sim.getByTestId('readout-mechanism')).toContainText('NaBH₄ is too mild')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s4-sim-acid-nabh4-${scheme}.png` })

      // State 4: Butanoic acid + commercial ester route -> Butan-1-ol + R'OH
      await sim.getByTestId('reag-ester-h2').click()
      await expect(sim.getByTestId('readout-product')).toContainText('Butan-1-ol')
      await expect(sim.getByTestId('readout-byproducts')).toContainText("R'OH")
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s4-sim-acid-commercial-${scheme}.png` })

      // State 5: Grignard pairings -> Propanone + C2H5MgBr Step (i) Adduct
      await sim.getByRole('radio', { name: 'Grignard Pairings' }).click()
      await sim.getByTestId('sub-propanone').click()
      await sim.getByRole('radio', { name: 'C₂H₅MgBr' }).click()
      await expect(sim.getByTestId('readout-degree')).toContainText('Adduct (yields 3°)')
      await expect(sim.getByTestId('readout-deltac')).toContainText('+2')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s4-sim-grignard-step1-${scheme}.png` })

      // State 6: Grignard Step (ii) H2O hydrolysis -> 2-Methylbutan-2-ol (3°) + Mg(OH)Br
      await sim.getByTestId('reag-hydrolysis').click()
      await expect(sim.getByTestId('readout-product')).toContainText('2-Methylbutan-2-ol')
      await expect(sim.getByTestId('readout-degree')).toContainText('3°')
      await expect(sim.getByTestId('readout-byproducts')).toContainText('Mg(OH)Br')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s4-sim-grignard-step2-${scheme}.png` })

      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 7 Section 7.4.1 at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('does not scroll sideways at 390 px and renders Scrolly & Sim cleanly', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    await page
      .locator(`[data-animation="${SCROLLY_1}"] [data-scrolly-step]`)
      .first()
      .evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(300)
    const scrolly1 = page.locator(`[data-animation="${SCROLLY_1}"] [data-testid="alkene-hydration-visual"]`)
    await expect(scrolly1).toBeVisible()
    await scrolly1.screenshot({ path: 'test-results/screens/c12u7-s4-mobile-scrolly1-light.png' })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await expect(sim).toBeVisible()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s4-mobile-sim-light.png' })

    expect(await svgOutOfBounds(sim)).toEqual([])
    expect(errors).toEqual([])
  })
})
