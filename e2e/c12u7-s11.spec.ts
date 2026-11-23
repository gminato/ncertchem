import { expect, test, type Locator, type Page } from '@playwright/test'

const SLUG = '12-7-6-1-preparation-and-properties-of-ethers'
const SECTION_PATH = `/class-12/unit-7/${SLUG}`
const SIM = 'ether-synthesis-and-properties-lab'

const SCROLLIES = [
  { name: 'ether-dehydration-vs-alkene', steps: 4, short: 'dehydration' },
  { name: 'williamson-sn2-vs-e2', steps: 4, short: 'williamson' },
  { name: 'ether-hbond-boiling-miscibility', steps: 3, short: 'properties' },
] as const

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

/**
 * Text leaves inside `scope` whose rendered font size is below 14 px at the current viewport.
 * Excludes KaTeX internals, screen-reader-only text, Simulation eyebrow, and SVG sub/sup tspans.
 */
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
        !el.closest('[class*="eyebrow"]') &&
        !el.closest('tspan[baseline-shift]')
      ) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        const svg = el.closest('svg')
        if (svg) {
          const vb = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
          const viewBoxWidth = vb[2] || 1
          const rect = svg.getBoundingClientRect()
          if (rect.width > 0) {
            size *= rect.width / viewBoxWidth
          }
        }
        if (size < 14) {
          bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
        }
      }
      node = walker.nextNode()
    }
    return bad
  })
}

/** Drawn SVG leaves whose rendered bounding boxes fall outside their viewBox (in viewBox units). */
async function svgOutOfBounds(scope: Locator): Promise<string[]> {
  return scope.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [vbX, vbY, vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (frame.width === 0 || vbW === 0) return
      const scale = vbW / frame.width
      const leaves = svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline')
      leaves.forEach((el) => {
        if (el.closest('defs, clipPath, mask, pattern, symbol, marker')) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const x0 = vbX + (r.left - frame.left) * scale
        const y0 = vbY + (r.top - frame.top) * scale
        const x1 = vbX + (r.right - frame.left) * scale
        const y1 = vbY + (r.bottom - frame.top) * scale
        if (x0 < vbX - 0.5 || y0 < vbY - 0.5 || x1 > vbX + vbW + 0.5 || y1 > vbY + vbH + 0.5) {
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
  test.describe(`C12 U7 S11 Ethers (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders all Scrolly steps and interactive Simulation cleanly', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(SECTION_PATH)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Step through all 3 Scrolly blocks
      for (const scrollySpec of SCROLLIES) {
        const scrolly = page.locator(`[data-animation="${scrollySpec.name}"]`)
        await expect(scrolly).toBeVisible()
        const steps = scrolly.locator('[data-scrolly-step]')
        await expect(steps).toHaveCount(scrollySpec.steps)

        for (let k = 0; k < scrollySpec.steps; k++) {
          await steps.nth(k).scrollIntoViewIfNeeded()
          const panelSvg = scrolly.locator('svg[role="img"]').first()
          await expect(panelSvg).toHaveAttribute('data-step', String(k), { timeout: 5000 })
          expect(await smallTextLeaves(panelSvg)).toEqual([])
          expect(await svgOutOfBounds(scrolly)).toEqual([])
          await panelSvg.screenshot({
            path: `test-results/screens/c12u7-s11-${scrollySpec.short}-step${k + 1}-${scheme}.png`,
          })
        }
      }

      // Flagship Simulation
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toBeVisible()

      // 1. Default: Synthesis Lab -> Alcohol Dehydration -> 1° Ethanol @ 413 K
      await expect(sim.getByTestId('ether-pathway-verdict')).toHaveText('SN2 Substitution')
      await expect(sim.getByTestId('ether-major-product')).toContainText('Ethoxyethane')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-dehydration-413-${scheme}.png` })

      // 2. Dehydration 1° Ethanol @ 443 K
      await sim.getByRole('radio', { name: '443 K' }).click()
      await expect(sim.getByTestId('ether-pathway-verdict')).toHaveText('Elimination')
      await expect(sim.getByTestId('ether-major-product')).toContainText('Ethene')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-dehydration-443-${scheme}.png` })

      // 3. Dehydration 1° Mixture @ 413 K
      await sim.getByRole('radio', { name: '413 K' }).click()
      await sim.getByRole('radio', { name: /1° Mixture/ }).click()
      await expect(sim.getByTestId('ether-pathway-verdict')).toHaveText('Mixed Ethers (SN2)')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-dehydration-mix-${scheme}.png` })

      // 4. Williamson Synthesis -> tert-Butoxide + CH3-Br (SN2) -> swap to 3° halide + methoxide (Elimination) -> phenoxide + CH3-Br (Anisole)
      await sim.getByRole('radio', { name: 'Williamson Synthesis' }).click()
      await expect(sim.getByTestId('ether-pathway-verdict')).toHaveText('SN2 Substitution')
      await expect(sim.getByTestId('ether-major-product')).toContainText('2-Methoxy-2-methylpropane')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await sim.getByRole('radio', { name: 'CH₃O⁻Na⁺' }).click()
      await sim.getByRole('radio', { name: '(CH₃)₃C–Br (3°)' }).click()
      await expect(sim.getByTestId('ether-pathway-verdict')).toHaveText('Elimination')
      await expect(sim.getByTestId('ether-major-product')).toContainText('2-Methylpropene')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-williamson-e2-${scheme}.png` })

      await sim.getByRole('radio', { name: 'C₆H₅O⁻Na⁺' }).click()
      await sim.getByRole('radio', { name: 'CH₃–Br (1°)' }).click()
      await expect(sim.getByTestId('ether-pathway-verdict')).toHaveText('SN2 Substitution')
      await expect(sim.getByTestId('ether-major-product')).toContainText('Anisole')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-williamson-anisole-${scheme}.png` })

      // 5. Physical Properties Lab -> Boiling Compare All
      await sim.getByRole('radio', { name: 'Physical Properties Lab' }).click()
      await sim.getByRole('radio', { name: 'Compare All' }).click()
      await expect(sim.getByTestId('ether-bp-readout')).toContainText('307.6 K')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-props-boiling-${scheme}.png` })

      // 6. Physical Properties Lab -> In Water (Miscibility) -> Ethoxyethane & Compare All
      await sim.getByRole('radio', { name: 'In Water (Miscibility)' }).click()
      await expect(sim.getByTestId('ether-misc-readout')).toContainText('7.5 g')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s11-sim-props-water-all-${scheme}.png` })

      await sim.getByRole('radio', { name: 'Ethoxyethane' }).click()
      await expect(sim.getByTestId('ether-misc-readout')).toContainText('7.5 g per 100 mL water')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('C12 U7 S11 Ethers mobile 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('has zero horizontal overflow and readable controls', async ({ page }) => {
    test.setTimeout(120_000)
    const errors = watchErrors(page)
    await page.goto(SECTION_PATH)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    const scrolly = page.locator(`[data-animation="${SCROLLIES[0].name}"]`)
    await scrolly.locator('[data-scrolly-step]').nth(1).scrollIntoViewIfNeeded()
    await expect(scrolly.locator('svg[role="img"]').first()).toHaveAttribute('data-step', '1')
    await scrolly.screenshot({ path: 'test-results/screens/c12u7-s11-mobile-scrolly.png' })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s11-mobile-sim-synthesis.png' })

    await sim.getByRole('radio', { name: 'Physical Properties Lab' }).click()
    await sim.getByRole('radio', { name: 'Compare All' }).click()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s11-mobile-sim-properties.png' })

    const mobileOverflowAfter = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(mobileOverflowAfter).toBeLessThanOrEqual(390)
    expect(errors).toEqual([])
  })
})
