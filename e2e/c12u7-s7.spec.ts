import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '/class-12/unit-7/12-7-4-4-acidity-and-esterification'
const SIM = 'acidity-esterification-lab'

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

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 7.4.4 Acidity & Esterification (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders both Scrolly animations and the Simulation cleanly across all steps and states', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)

      await page.goto(SLUG)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // 1. First Scrolly: alcohol-phenol-acidity (5 steps)
      const acidityScrolly = page.locator('[data-animation="alcohol-phenol-acidity"]')
      await expect(acidityScrolly).toBeVisible()
      const aciditySteps = acidityScrolly.locator('[data-scrolly-step]')
      await expect(aciditySteps).toHaveCount(5)

      for (let k = 0; k < 5; k++) {
        await aciditySteps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        const svg = acidityScrolly.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u7-s7-acidity-step${k + 1}-${scheme}.png` })
        expect(await smallTextLeaves(svg)).toEqual([])
        expect(await svgOutOfBounds(acidityScrolly)).toEqual([])
      }

      // 2. Second Scrolly: esterification-acetylation (4 steps)
      const esterScrolly = page.locator('[data-animation="esterification-acetylation"]')
      await expect(esterScrolly).toBeVisible()
      const esterSteps = esterScrolly.locator('[data-scrolly-step]')
      await expect(esterSteps).toHaveCount(4)

      for (let k = 0; k < 4; k++) {
        await esterSteps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        const svg = esterScrolly.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u7-s7-ester-step${k + 1}-${scheme}.png` })
        expect(await smallTextLeaves(svg)).toEqual([])
        expect(await svgOutOfBounds(esterScrolly)).toEqual([])
      }

      // 3. Flagship Simulation: acidity-esterification-lab
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await expect(sim).toBeVisible()
      await sim.scrollIntoViewIfNeeded()

      // State A1: Default Phenol vs Ethanol with aq. NaOH
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Delta pKa is 5.9')
      await expect(sim).toContainText('Dissolves (salt formed)')
      await expect(sim).toContainText('No reaction with aq. NaOH')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-acidity-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State A2: p-Nitrophenol vs 2-Methylpropan-2-ol (3°) with Al metal
      await sim.getByLabel('Compound A').selectOption('p-nitrophenol')
      await sim.getByLabel('Compound B').selectOption('tert-butanol')
      await sim.getByRole('radio', { name: 'Al metal' }).click()
      await expect(sim).toContainText('6 (CH₃)₃C–OH + 2 Al')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-acidity-al-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State A3: o-Nitrophenol vs m-Nitrophenol with Na metal
      await sim.getByLabel('Compound A').selectOption('o-nitrophenol')
      await sim.getByLabel('Compound B').selectOption('m-nitrophenol')
      await sim.getByRole('radio', { name: 'Na metal' }).click()
      await expect(sim).toContainText('ΔpKₐ = 1.1')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-acidity-nitro-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State A4: Close pKa pair (p-Nitrophenol 7.1 vs o-Nitrophenol 7.2) -> true dot positions + staggered labels
      await sim.getByLabel('Compound A').selectOption('p-nitrophenol')
      await sim.getByLabel('Compound B').selectOption('o-nitrophenol')
      await expect(sim).toContainText('ΔpKₐ = 0.1')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-acidity-close-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State E1: Switch to Esterification Bench (Salicylic acid + Acid anhydride -> Aspirin)
      await sim.getByRole('radio', { name: 'Esterification Bench' }).click()
      await expect(sim).toContainText('Acetylsalicylic acid (Aspirin)')
      await expect(sim).toContainText('Yields Aspirin + CH₃COOH')
      await expect(sim).not.toContainText('Blocks reverse hydrolysis')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-aspirin-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State E2: Ethanol + Acid chloride, toggle trap off then on
      await sim.getByRole('radio', { name: 'Ethanol' }).click()
      await sim.getByRole('radio', { name: "Acid chloride (R'COCl)" }).click()
      await expect(sim).toContainText('Pyridine (neutralises HCl)')
      await sim.getByRole('switch', { name: /Remove H₂O \/ Add Pyridine/ }).click()
      await expect(sim).toContainText('No trap')
      await sim.getByRole('switch', { name: /Remove H₂O \/ Add Pyridine/ }).click()
      await expect(sim).toContainText('Trap ON')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-chloride-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State E3: Phenol + Carboxylic acid (checks phenol O-H cleavage glyph, phenyl ester glyph, and H2O removal)
      await sim.getByRole('radio', { name: 'Phenol' }).click()
      await sim.getByRole('radio', { name: "Carboxylic acid (R'COOH)" }).click()
      await expect(sim).toContainText('Phenyl ester')
      await expect(sim).toContainText('Blocks reverse hydrolysis')
      await sim.screenshot({ path: `test-results/screens/c12u7-s7-sim-phenol-acid-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Section 7.4.4 at mobile 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('has zero horizontal overflow and readable panels on mobile', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(SLUG)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const acidityScrolly = page.locator('[data-animation="alcohol-phenol-acidity"]')
    await acidityScrolly.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await acidityScrolly.locator('.visualPanel, svg[role="img"]').first().screenshot({
      path: 'test-results/screens/c12u7-s7-mobile-scrolly.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s7-mobile-sim-acidity.png' })

    await sim.getByRole('radio', { name: 'Esterification Bench' }).click()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s7-mobile-sim-ester.png' })

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
    expect(errors).toEqual([])
  })
})
