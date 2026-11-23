import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '12-7-4-2-preparation-of-phenols'
const PAGE_URL = `/class-12/unit-7/${SLUG}`
const SCROLLY_1 = 'phenol-prep-routes'
const SCROLLY_2 = 'cumene-hydroperoxide-cleavage'
const SIM = 'phenol-route-workbench'

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
 * Text leaves inside a container whose RENDERED size is below 14 px (KaTeX internals, srOnly, and Simulation
 * shell eyebrow excluded). For SVG text, computed font-size is in viewBox units, so scale by rect.width / viewBox.width.
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

/** Drawn SVG leaves whose rendered boxes fall outside their SVG viewBox (with 0.5 viewBox-unit tolerance). */
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

async function checkScrollySteps(
  page: Page,
  animationName: string,
  stepCount: number,
  tag: string,
  scheme: 'light' | 'dark'
) {
  const scrolly = page.locator(`[data-animation="${animationName}"]`)
  await expect(scrolly).toBeVisible()
  const steps = scrolly.locator('[data-scrolly-step]')
  await expect(steps).toHaveCount(stepCount)

  for (let k = 0; k < stepCount; k++) {
    await steps.nth(k).scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)
    const visual = scrolly.locator('[data-testid="scrolly-visual"]')
    await expect(visual).toBeVisible()
    const svg = visual.locator('svg').first()
    await expect(svg).toBeVisible()
    await expect(svg).toHaveAttribute('data-step', String(k))
    expect(await smallTextLeaves(visual)).toEqual([])
    expect(await svgOutOfBounds(visual)).toEqual([])
    await visual.screenshot({ path: `test-results/screens/c12u7-s5-${tag}-step${k + 1}-${scheme}.png` })
  }
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 7.4.2 Preparation of Phenols (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders Scrolly animations, Simulation states, and KaTeX cleanly with >=14px text and zero out-of-bounds SVG', async ({
      page,
    }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(PAGE_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparation of Phenols')

      await checkScrollySteps(page, SCROLLY_1, 4, 'scrolly1', scheme)
      await checkScrollySteps(page, SCROLLY_2, 4, 'scrolly2', scheme)

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await expect(sim).toBeVisible()
      await sim.scrollIntoViewIfNeeded()

      // 1. Chlorobenzene default (623 K, 300 atm, HCl ON)
      await expect(sim.locator('[data-testid="readout-products"]')).toContainText('Phenol (C₆H₅OH)')
      await expect(sim.locator('[data-testid="readout-byproducts"]')).toContainText('NaCl')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s5-sim-chloro-${scheme}.png` })

      // Trapped phenoxide when HCl workup is switched OFF
      const hclSwitch = sim.getByRole('switch', { name: /HCl workup/i })
      await hclSwitch.click()
      await expect(sim.locator('[data-testid="readout-products"]')).toContainText('Trapped as C₆H₅O⁻ Na⁺')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Under-heated chlorobenzene -> No reaction
      const chloroTemp = sim.getByRole('slider', { name: /Fusion temperature/i })
      await chloroTemp.fill('450')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('No reaction: aryl C–Cl resists mild NaOH')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // 2. Benzene route
      await sim.getByRole('radio', { name: /Benzene \(C₆H₆\)/i }).click()
      await expect(sim.locator('[data-testid="readout-intermediate"]')).toContainText('C₆H₅SO₃H')
      await expect(sim.locator('[data-testid="readout-products"]')).toContainText('Phenol (C₆H₅OH)')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s5-sim-benzene-${scheme}.png` })

      // Aqueous NaOH stops at benzenesulphonic acid
      await sim.getByRole('radio', { name: 'Aqueous NaOH' }).click()
      await expect(sim.locator('[data-testid="readout-products"]')).toContainText('select Molten NaOH + heat')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // 3. Aniline route
      await sim.getByRole('radio', { name: /Aniline/i }).click()
      await expect(sim.locator('[data-testid="readout-products"]')).toContainText('Phenol (C₆H₅OH)')
      await expect(sim.locator('[data-testid="readout-byproducts"]')).toContainText('N₂ + HCl')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s5-sim-aniline-${scheme}.png` })

      // Above 278 K flags premature decomposition
      const diazoTemp = sim.getByRole('slider', { name: /Diazotisation temperature/i })
      await diazoTemp.fill('295')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('premature thermal decomposition')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // 4. Cumene route
      await sim.getByRole('radio', { name: /Cumene/i }).click()
      await expect(sim.locator('[data-testid="readout-products"]')).toContainText('Phenol (C₆H₅OH)')
      await expect(sim.locator('[data-testid="readout-byproducts"]')).toContainText('Acetone (CH₃COCH₃)')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s5-sim-cumene-${scheme}.png` })

      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Section 7.4.2 mobile responsiveness (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('has zero horizontal overflow and clean mobile layout', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(PAGE_URL)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparation of Phenols')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    const scrolly1 = page.locator(`[data-animation="${SCROLLY_1}"]`)
    await scrolly1.locator('[data-scrolly-step]').nth(1).scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    expect(await svgOutOfBounds(scrolly1.locator('[data-testid="scrolly-visual"]'))).toEqual([])
    await scrolly1.locator('[data-testid="scrolly-visual"]').screenshot({
      path: 'test-results/screens/c12u7-s5-mobile-scrolly1.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await sim.getByRole('radio', { name: /Cumene/i }).click()
    await page.waitForTimeout(300)
    expect(await svgOutOfBounds(sim)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await sim.screenshot({ path: 'test-results/screens/c12u7-s5-mobile-sim.png' })

    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
