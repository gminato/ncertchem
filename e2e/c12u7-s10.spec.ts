import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-7/12-7-5-commercially-important-alcohols'
const SIM = 'commercial-alcohols-lab'
const METHANOL_ANIM = 'methanol-syngas-route'
const ETHANOL_ANIM = 'ethanol-fermentation-pathway'

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
        !el.closest('[class*="eyebrow"]') &&
        !el.closest('tspan[baseline-shift]')
      ) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        const svg = el.closest('svg')
        if (svg) {
          const viewBoxWidth = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          size *= svg.getBoundingClientRect().width / viewBoxWidth
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
  test.describe(`Unit 7 Section 7.5 Scrolly animations (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders all Scrolly steps with >=14px text, zero SVG clipping, and zero KaTeX/console errors', async ({
      page,
    }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Some Commercially Important Alcohols')

      // Scrolly 1: methanol-syngas-route (4 steps)
      const scrolly1 = page.locator(`[data-animation="${METHANOL_ANIM}"]`)
      await expect(scrolly1).toBeVisible()
      const steps1 = scrolly1.locator('[data-scrolly-step]')
      await expect(steps1).toHaveCount(4)

      for (let k = 0; k < 4; k++) {
        await steps1.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        const panel = scrolly1.locator('[data-testid="scrolly-visual"]')
        const svg = panel.locator('svg').first()
        await expect(svg).toBeVisible()
        await expect(svg).toHaveAttribute('data-step', String(k))
        expect(await smallTextLeaves(panel)).toEqual([])
        expect(await svgOutOfBounds(panel)).toEqual([])
        await panel.screenshot({ path: `test-results/screens/c12u7-s10-methanol-step${k + 1}-${scheme}.png` })
      }

      // Scrolly 2: ethanol-fermentation-pathway (5 steps)
      const scrolly2 = page.locator(`[data-animation="${ETHANOL_ANIM}"]`)
      await expect(scrolly2).toBeVisible()
      const steps2 = scrolly2.locator('[data-scrolly-step]')
      await expect(steps2).toHaveCount(5)

      for (let k = 0; k < 5; k++) {
        await steps2.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        const panel = scrolly2.locator('[data-testid="scrolly-visual"]')
        const svg = panel.locator('svg').first()
        await expect(svg).toBeVisible()
        await expect(svg).toHaveAttribute('data-step', String(k))
        expect(await smallTextLeaves(panel)).toEqual([])
        expect(await svgOutOfBounds(panel)).toEqual([])
        await panel.screenshot({ path: `test-results/screens/c12u7-s10-ethanol-step${k + 1}-${scheme}.png` })
      }

      // Ensure Simulation is mounted on the section page too
      await expect(page.locator(`[data-simulation="${SIM}"]`)).toBeVisible()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })

  test.describe(`Unit 7 Section 7.5 Simulation (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('Commercial Alcohols Process Lab works across all modes and controls', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(`/dev/sim/${SIM}`)
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await expect(sim).toBeVisible()
      await sim.scrollIntoViewIfNeeded()

      // Mode 1: Methanol Reactor (default optimal ZnO-Cr2O3, 250 atm, 620 K)
      await expect(sim.getByTestId('primary-metric')).toContainText(/9[0-5]%/)
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s10-sim-methanol-optimal-${scheme}.png` })

      // Toggle catalyst to None -> 0%
      await sim.getByRole('radio', { name: 'None' }).click()
      await expect(sim.getByTestId('primary-metric')).toContainText('0%')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s10-sim-methanol-nocat-${scheme}.png` })

      // Mode 2: Ethanol Fermentation
      await sim.getByRole('radio', { name: 'Ethanol Fermentation' }).click()
      await sim.getByLabel('Batch progress').fill('100')
      await expect(sim.getByTestId('primary-metric')).toContainText('14% v/v')
      await expect(sim.getByTestId('primary-metric')).toContainText('Inhibited (>14%)')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s10-sim-ferm-14cap-${scheme}.png` })

      // Air leak spoils drink to ethanoic acid
      await sim.getByRole('radio', { name: 'Air Leak (O₂ present)' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Sour / Spoiled')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s10-sim-ferm-airleak-${scheme}.png` })

      // Sucrose without Invertase yields 0%
      await sim.getByRole('radio', { name: 'Anaerobic (Sealed)' }).click()
      await sim.getByRole('radio', { name: 'Absent' }).click()
      await expect(sim.getByTestId('primary-metric')).toContainText('0% v/v')

      // Mode 3: Denaturation & Properties
      await sim.getByRole('radio', { name: 'Denaturation & Properties' }).click()
      await sim.getByLabel('Copper sulphate (colour)').check()
      await sim.getByLabel('Pyridine (foul odour)').check()
      await expect(sim.getByTestId('primary-metric')).toContainText('Denatured Alcohol: Unfit for Drinking')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s10-sim-denatured-${scheme}.png` })

      // Ethene hydration route
      await sim.getByRole('radio', { name: 'Hydration of Ethene (Sec. 7.4)' }).click()
      await expect(sim).toContainText('CH₂=CH₂')

      // Methanol comparison
      await sim.getByRole('radio', { name: 'Methanol (CH₃OH)' }).click()
      await expect(sim.getByTestId('primary-metric')).toContainText('Severely Poisonous')
      await expect(sim).toContainText('337 K')

      expect(await sim.locator('.katex-error').count()).toBe(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 7 Section 7.5 at phone width (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('has zero horizontal overflow and captures mobile screenshots', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    const scrolly1 = page.locator(`[data-animation="${METHANOL_ANIM}"]`)
    await scrolly1.locator('[data-scrolly-step]').nth(1).scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await scrolly1.locator('[data-testid="scrolly-visual"]').screenshot({
      path: 'test-results/screens/c12u7-s10-mobile-methanol.png',
    })

    const scrolly2 = page.locator(`[data-animation="${ETHANOL_ANIM}"]`)
    await scrolly2.locator('[data-scrolly-step]').nth(4).scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await scrolly2.locator('[data-testid="scrolly-visual"]').screenshot({
      path: 'test-results/screens/c12u7-s10-mobile-ethanol.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s10-mobile-sim.png' })

    const finalScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(finalScrollWidth).toBeLessThanOrEqual(390)
    expect(errors).toEqual([])
  })
})
