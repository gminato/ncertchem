import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '12-7-4-4-reactions-of-phenols'
const URL_PATH = `/class-12/unit-7/${SLUG}`
const SIM_NAME = 'phenol-reaction-bench'

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
 * Checks every visible text leaf inside a container has rendered font size >= 14 px.
 * SVG text scales by `rect.width / viewBoxWidth`.
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
          const vbParts = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          const viewBoxWidth = vbParts[2] || 1
          size *= svg.getBoundingClientRect().width / viewBoxWidth
        }
        if (size < 14) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Checks every SVG element inside a container stays inside its viewBox bounds. */
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

/** Checks that no two SVG <text> leaves or bracket <path>s overlap inside a container. */
async function svgTextOverlaps(container: Locator): Promise<string[]> {
  return container.locator('svg[role="img"]').evaluateAll((svgs) => {
    const overlaps: string[] = []
    svgs.forEach((svg) => {
      const texts = Array.from(svg.querySelectorAll('text')).map((el) => ({
        label: el.textContent?.trim().slice(0, 28) ?? '',
        r: el.getBoundingClientRect(),
      }))
      for (let i = 0; i < texts.length; i++) {
        const a = texts[i]
        if (a.r.width === 0 || a.r.height === 0) continue
        for (let j = i + 1; j < texts.length; j++) {
          const b = texts[j]
          if (b.r.width === 0 || b.r.height === 0) continue
          if (a.r.left < b.r.right && a.r.right > b.r.left && a.r.top < b.r.bottom && a.r.bottom > b.r.top) {
            overlaps.push(`"${a.label}" vs "${b.label}"`)
          }
        }
      }
      const brackets = Array.from(svg.querySelectorAll('g[stroke-linecap="square"] path')).map((el) =>
        el.getBoundingClientRect(),
      )
      for (const t of texts) {
        if (t.r.width === 0 || t.r.height === 0) continue
        for (const br of brackets) {
          if (br.width === 0 || br.height === 0) continue
          if (t.r.left < br.right && t.r.right > br.left && t.r.top < br.bottom && t.r.bottom > br.top) {
            overlaps.push(`"${t.label}" vs bracket`)
          }
        }
      }
    })
    return overlaps
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 7.4.4 Reactions of Phenols (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders both Scrolly animations, interactive Simulation, and KaTeX cleanly', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(URL_PATH)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // 1. Scrolly 1: phenol-eas-control (5 steps)
      const scrollyEas = page.locator('[data-animation="phenol-eas-control"]')
      await expect(scrollyEas).toBeVisible()
      const easSteps = scrollyEas.locator('[data-scrolly-step]')
      await expect(easSteps).toHaveCount(5)

      for (let k = 0; k < 5; k++) {
        await easSteps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(350)
        const svg = scrollyEas.locator('svg[role="img"]').first()
        await expect(svg).toHaveAttribute('data-step', String(k))
        expect(await smallTextLeaves(scrollyEas.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        expect(await svgOutOfBounds(scrollyEas)).toEqual([])
        expect(await svgTextOverlaps(scrollyEas)).toEqual([])
        await svg.screenshot({ path: `test-results/screens/c12u7-s9-eas-step${k + 1}-${scheme}.png` })
      }

      // 2. Scrolly 2: phenol-named-redox (5 steps)
      const scrollyRedox = page.locator('[data-animation="phenol-named-redox"]')
      await expect(scrollyRedox).toBeVisible()
      const redoxSteps = scrollyRedox.locator('[data-scrolly-step]')
      await expect(redoxSteps).toHaveCount(5)

      for (let k = 0; k < 5; k++) {
        await redoxSteps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(350)
        const svg = scrollyRedox.locator('svg[role="img"]').first()
        await expect(svg).toHaveAttribute('data-step', String(k))
        expect(await smallTextLeaves(scrollyRedox.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        expect(await svgOutOfBounds(scrollyRedox)).toEqual([])
        expect(await svgTextOverlaps(scrollyRedox)).toEqual([])
        await svg.screenshot({ path: `test-results/screens/c12u7-s9-redox-step${k + 1}-${scheme}.png` })
      }

      // 3. Simulation: phenol-reaction-bench
      const sim = page.locator(`[data-simulation="${SIM_NAME}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toBeVisible()

      // Default: Dilute HNO3 (298 K) + toggle H-bonding view
      await expect(sim.getByTestId('bench-pathway-title')).toContainText('dilute HNO₃')
      const mechToggle = sim.getByRole('switch', { name: 'Show Mechanistic / H-Bonding View' })
      await mechToggle.click()
      await expect(sim.locator('svg[role="img"]').nth(1)).toContainText('Intramolecular')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-dilute-hbond-${scheme}.png` })

      // Conc. HNO3 (Direct) -> poor yield
      await sim.getByRole('button', { name: 'Nitration: Conc. HNO₃ (Direct)' }).click()
      await expect(sim.getByTestId('bench-status-badge')).toContainText('Poor yield')
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Modern two-step H2SO4 then HNO3 -> Step 1 vs Final Product
      await sim.getByRole('button', { name: 'Nitration: Conc. H₂SO₄ then Conc. HNO₃' }).click()
      await expect(sim.getByTestId('bench-observation')).toContainText('phenol-2,4-disulphonic acid')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.getByRole('button', { name: 'Final Product' }).click()
      await expect(sim.getByTestId('bench-observation')).toContainText('2,4,6-trinitrophenol')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-modern-picric-${scheme}.png` })

      // Bromination in CS2/CHCl3 + Mechanistic toggle (already checked)
      await sim.getByRole('button', { name: 'Bromination: Br₂ in CS₂ / CHCl₃ (273 K)' }).click()
      await expect(sim.getByTestId('bench-products')).toContainText('p-Bromophenol')
      await expect(sim.locator('svg[role="img"]').nth(1)).toContainText('Requires FeBr₃')
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-br2-mech-${scheme}.png` })

      // Bromine water -> 2,4,6-tribromophenol white precipitate
      await sim.getByRole('button', { name: 'Bromination: Bromine Water (3 Br₂)' }).click()
      await expect(sim.getByTestId('bench-status-badge')).toContainText('White precipitate')
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Kolbe reaction (Step 1 and Final Product with mechanistic toggle active)
      await sim.getByRole('button', { name: 'Kolbe: NaOH, (i) CO₂, (ii) H⁺' }).click()
      await expect(sim.getByTestId('bench-ring-state')).toContainText('Phenoxide')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      expect(await svgTextOverlaps(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-kolbe-step1-${scheme}.png` })
      await sim.getByRole('button', { name: 'Final Product' }).click()
      await expect(sim.getByTestId('bench-products')).toContainText('Salicylic acid')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      expect(await svgTextOverlaps(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-kolbe-final-${scheme}.png` })

      // Reimer-Tiemann reaction (3 steps, mechanistic toggle active)
      await sim.getByRole('button', { name: 'Reimer-Tiemann: CHCl₃ + aq. NaOH, NaOH, H⁺' }).click()
      await expect(sim.getByTestId('bench-observation')).toContainText('benzal chloride')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      expect(await svgTextOverlaps(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-reimer-step1-${scheme}.png` })
      await sim.getByRole('button', { name: 'Step 2' }).click()
      await expect(sim.getByTestId('bench-observation')).toContainText('-CHO')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      expect(await svgTextOverlaps(sim)).toEqual([])
      await sim.getByRole('button', { name: 'Final Product' }).click()
      await expect(sim.getByTestId('bench-products')).toContainText('Salicylaldehyde')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      expect(await svgTextOverlaps(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-reimer-${scheme}.png` })

      // Reduction: Zn dust
      await sim.getByRole('button', { name: 'Reduction: Zn dust (heat)' }).click()
      await expect(sim.getByTestId('bench-products')).toContainText('Benzene')
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Oxidation: Na2Cr2O7 + H2SO4
      await sim.getByRole('button', { name: 'Oxidation: Na₂Cr₂O₇ + H₂SO₄' }).click()
      await expect(sim.getByTestId('bench-products')).toContainText('Benzoquinone')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s9-sim-oxidation-${scheme}.png` })

      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      const katexTextSpans = await page.locator('.katex-display .mord.text').allInnerTexts()
      for (const t of katexTextSpans) {
        expect(t).not.toMatch(/HNO3|O2NC6H4OH|Br2|CS2|BrC6H4OH|CO2|HOC6H4|CHCl3|CHCl2|C6H4ONa|Na2Cr2O7|H2SO4/)
      }
      expect(errors).toEqual([])
    })
  })
}

test.describe('Section 7.4.4 at mobile 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('has zero horizontal overflow and captures mobile screenshots', async ({ page }) => {
    test.setTimeout(120_000)
    const errors = watchErrors(page)
    await page.goto(URL_PATH)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    const scrollyEas = page.locator('[data-animation="phenol-eas-control"]')
    await scrollyEas.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await scrollyEas.locator('[data-testid="scrolly-visual"]').screenshot({
      path: 'test-results/screens/c12u7-s9-mobile-scrolly.png',
    })

    const sim = page.locator(`[data-simulation="${SIM_NAME}"]`)
    await sim.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await sim.screenshot({ path: 'test-results/screens/c12u7-s9-mobile-sim.png' })

    const scrollWidthAfter = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidthAfter).toBeLessThanOrEqual(390)
    expect(errors).toEqual([])
  })
})
