import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '12-7-1-classification'
const SECTION_URL = `/class-12/unit-7/${SLUG}`
const SIM = 'oxy-class-builder'

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

async function smallTextLeavesInContainer(container: Locator): Promise<string[]> {
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
          const vbAttr = svg.getAttribute('viewBox')
          if (vbAttr) {
            const vbW = parseFloat(vbAttr.split(/\s+/)[2])
            if (vbW > 0) size *= svg.getBoundingClientRect().width / vbW
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
  test.describe(`Unit 7 Section 1 (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders all Scrolly steps and interactive Simulation cleanly', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // 1. Scrolly 1: alcohol-classes (5 steps)
      const scrolly1 = page.locator('[data-animation="alcohol-classes"]')
      await expect(scrolly1).toBeVisible()
      const steps1 = scrolly1.locator('[data-scrolly-step]')
      await expect(steps1).toHaveCount(5)

      for (let k = 0; k < 5; k++) {
        await steps1.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
        const svg = scrolly1.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        expect(await smallTextLeavesInContainer(scrolly1.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        expect(await svgOutOfBounds(scrolly1.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        await svg.screenshot({ path: `test-results/screens/c12u7-s1-alcohol-step${k + 1}-${scheme}.png` })
      }

      // 2. Scrolly 2: phenol-ether-classes (4 steps)
      const scrolly2 = page.locator('[data-animation="phenol-ether-classes"]')
      await expect(scrolly2).toBeVisible()
      const steps2 = scrolly2.locator('[data-scrolly-step]')
      await expect(steps2).toHaveCount(4)

      for (let k = 0; k < 4; k++) {
        await steps2.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
        const svg = scrolly2.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        expect(await smallTextLeavesInContainer(scrolly2.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        expect(await svgOutOfBounds(scrolly2.locator('[data-testid="scrolly-visual"]'))).toEqual([])
        await svg.screenshot({ path: `test-results/screens/c12u7-s1-phenol-ether-step${k + 1}-${scheme}.png` })
      }

      // 3. Simulation: oxy-class-builder
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toBeVisible()

      // Default preset: prop-2-en-1-ol
      await expect(sim.getByTestId('oxy-name')).toHaveText('Prop-2-en-1-ol')
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Primary (1°) allylic alcohol')
      await expect(sim.getByTestId('oxy-hyb')).toHaveText('sp³')
      expect(await smallTextLeavesInContainer(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s1-sim-default-${scheme}.png` })

      // Non-benzylic spacer preset: 1-phenylpropan-2-ol
      await sim.getByRole('button', { name: '1-phenylpropan-2-ol' }).click()
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Secondary (2°) aliphatic alcohol')
      await expect(sim.getByTestId('oxy-rule-trace')).toContainText('spacer')
      expect(await smallTextLeavesInContainer(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s1-sim-spacer-${scheme}.png` })

      // Vinylic preset: ethenol
      await sim.getByRole('button', { name: 'ethenol' }).click()
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Vinylic alcohol')
      await expect(sim.getByTestId('oxy-hyb')).toHaveText('sp²')
      await expect(sim.getByTestId('oxy-degree')).toHaveText('N/A')
      expect(await smallTextLeavesInContainer(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s1-sim-vinylic-${scheme}.png` })

      // Phenol custom control: Aromatic ring + 2-CH₃ toggle
      await sim.getByRole('radio', { name: 'Aromatic ring (sp² phenol C)' }).click()
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Monohydric phenol')
      await sim.getByRole('switch', { name: /2-CH₃/i }).click()
      await expect(sim.getByTestId('oxy-name')).toHaveText('2-Methylphenol')
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Monohydric phenol')
      expect(await smallTextLeavesInContainer(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s1-sim-phenol-${scheme}.png` })

      // Ether mode: mixed (ethyl phenyl ether) and symmetrical (diethyl ether)
      await sim.getByRole('radio', { name: 'Ether' }).click()
      await sim.getByRole('radiogroup', { name: 'Left group R1' }).getByRole('radio', { name: 'Ethyl (C₂H₅)' }).click()
      await sim.getByRole('radiogroup', { name: 'Right group R2' }).getByRole('radio', { name: 'Phenyl (C₆H₅)' }).click()
      await expect(sim.getByTestId('oxy-name')).toHaveText('Ethoxybenzene')
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Mixed (unsymmetrical) ether')
      await expect(sim.getByTestId('oxy-hyb')).toHaveText('sp³ & sp²')
      expect(await smallTextLeavesInContainer(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s1-sim-ether-mixed-${scheme}.png` })

      await sim.getByRole('button', { name: 'diethyl ether' }).click()
      await expect(sim.getByTestId('oxy-verdict')).toHaveText('Simple (symmetrical) ether')
      expect(await smallTextLeavesInContainer(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])
      await sim.screenshot({ path: `test-results/screens/c12u7-s1-sim-ether-sym-${scheme}.png` })

      // Verify KaTeX & console errors
      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 7 Section 1 at phone width (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('has zero horizontal overflow and clean responsive views', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const checkOverflow = async () => {
      const width = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(width).toBeLessThanOrEqual(390)
    }

    await checkOverflow()

    const scrolly1 = page.locator('[data-animation="alcohol-classes"]')
    await scrolly1.locator('[data-scrolly-step]').nth(3).scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await checkOverflow()
    await scrolly1.locator('[data-testid="scrolly-visual"]').screenshot({
      path: 'test-results/screens/c12u7-s1-mobile-scrolly1.png',
    })

    const scrolly2 = page.locator('[data-animation="phenol-ether-classes"]')
    await scrolly2.locator('[data-scrolly-step]').nth(2).scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await checkOverflow()
    await scrolly2.locator('[data-testid="scrolly-visual"]').screenshot({
      path: 'test-results/screens/c12u7-s1-mobile-scrolly2.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await checkOverflow()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s1-mobile-sim.png' })

    await sim.getByRole('button', { name: 'ethyl phenyl ether' }).click()
    await checkOverflow()
    await sim.screenshot({ path: 'test-results/screens/c12u7-s1-mobile-sim-ether.png' })

    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
