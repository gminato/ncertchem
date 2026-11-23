import { test, expect, type Locator, type Page } from '@playwright/test'

const URL = '/class-12/unit-7/12-7-4-4-cleavage-of-c-o-bond'
const SCROLLY_1 = 'ethanol-dehydration-mechanism'
const SCROLLY_2 = 'alcohol-oxidation-pathways'
const SIM = 'alcohol-co-cleavage-lab'

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

async function svgOutOfBounds(scope: Locator): Promise<string[]> {
  return scope.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (!frame.width || !vbW) return
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
  test.describe(`Section 7.4.4 Scrolly & Simulation (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders all Scrolly steps, simulation states, KaTeX, and passes layout checks', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(URL)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Scrolly 1: ethanol-dehydration-mechanism (4 steps)
      const s1 = page.locator(`[data-animation="${SCROLLY_1}"]`)
      await expect(s1).toBeVisible()
      const s1Steps = s1.locator('[data-scrolly-step]')
      await expect(s1Steps).toHaveCount(4)

      for (let k = 0; k < 4; k++) {
        await s1Steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(350)
        const svg = s1.locator('svg').first()
        await expect(svg).toHaveAttribute('data-step', String(k))
        expect(await smallTextLeaves(s1.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        expect(await svgOutOfBounds(s1.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        await svg.screenshot({ path: `test-results/screens/c12u7-s8-scrolly1-step${k + 1}-${scheme}.png` })
      }

      // Scrolly 2: alcohol-oxidation-pathways (4 steps)
      const s2 = page.locator(`[data-animation="${SCROLLY_2}"]`)
      await expect(s2).toBeVisible()
      const s2Steps = s2.locator('[data-scrolly-step]')
      await expect(s2Steps).toHaveCount(4)

      for (let k = 0; k < 4; k++) {
        await s2Steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(350)
        const svg = s2.locator('svg').first()
        await expect(svg).toHaveAttribute('data-step', String(k))
        expect(await smallTextLeaves(s2.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        expect(await svgOutOfBounds(s2.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        await svg.screenshot({ path: `test-results/screens/c12u7-s8-scrolly2-step${k + 1}-${scheme}.png` })
      }

      // Simulation: alcohol-co-cleavage-lab
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await expect(sim).toBeVisible()
      await sim.scrollIntoViewIfNeeded()

      // State 1: Default (Ethanol + Acid dehydration + Matched -> 443 K, Ethene)
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Ethene')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('443 K')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s8-sim-dehydration-${scheme}.png` })

      // State 2: Mild 20% H3PO4 358 K blocks ethanol & but-2-en-1-ol, passes 2-methylpropan-2-ol (3°)
      await sim.getByRole('radio', { name: '20% H₃PO₄, 358 K' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Barrier Too High')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await sim.getByRole('radio', { name: 'But-2-en-1-ol (allylic 1°)' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Barrier Too High')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await sim.getByRole('radio', { name: '2-Methylpropan-2-ol (3°)' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('2-Methylpropene')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s8-sim-dehydration-3deg-${scheme}.png` })

      // State 3: Lucas reagent on 3° (immediate turbidity) vs 1° (no turbidity)
      await sim.getByRole('radio', { name: 'Lucas reagent' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText(/immediate turbidity/i)
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s8-sim-lucas-3deg-${scheme}.png` })

      await sim.getByRole('radio', { name: 'Ethanol (1°)' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('No turbidity at room temperature')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State 4: But-2-en-1-ol + PCC (C=C preserved -> But-2-enal) vs KMnO4 (C=C cleaved)
      await sim.getByRole('radio', { name: 'But-2-en-1-ol (allylic 1°)' }).click()
      await sim.getByRole('radio', { name: 'PCC' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('But-2-enal')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('CH₃-CH=CH-CHO')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s8-sim-pcc-allylic-${scheme}.png` })

      await sim.getByRole('radio', { name: 'Acidified KMnO₄' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Oxidative cleavage mixture')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // State 5: 3° alcohol + Heated Cu (573 K) -> E1 Dehydration to 2-Methylpropene + H2O
      await sim.getByRole('radio', { name: '2-Methylpropan-2-ol (3°)' }).click()
      await sim.getByRole('radio', { name: 'Cu, 573 K' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('E1 Dehydration')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('2-Methylpropene')
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s8-sim-cu573-3deg-${scheme}.png` })

      // Verify KaTeX and zero console/page errors
      await expect(page.locator('.katex-display').first()).toBeAttached()
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Section 7.4.4 at mobile 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('renders Scrolly and Simulation with zero horizontal overflow', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)

    const s1 = page.locator(`[data-animation="${SCROLLY_1}"]`)
    await s1.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'test-results/screens/c12u7-s8-mobile-scrolly1.png' })

    const s2 = page.locator(`[data-animation="${SCROLLY_2}"]`)
    await s2.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'test-results/screens/c12u7-s8-mobile-scrolly2.png' })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await sim.getByRole('radio', { name: 'Lucas reagent' }).click()
    await sim.getByRole('radio', { name: '2-Methylpropan-2-ol (3°)' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText(/immediate turbidity/i)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await sim.screenshot({ path: 'test-results/screens/c12u7-s8-mobile-sim.png' })

    expect(errors).toEqual([])
  })
})
