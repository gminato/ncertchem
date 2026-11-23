import { test, expect, type Locator, type Page } from '@playwright/test'

const URL = '/class-12/unit-5/12-5-6-metal-carbonyls'
const SIM = 'carbonyl-explorer'

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
 * Text leaves inside a container whose RENDERED size is below `minPx` (KaTeX internals, SR-only, and eyebrow excluded).
 * For SVG text, computed font-size is in viewBox units, so scale it by rendered SVG width / viewBox width.
 */
async function smallTextLeaves(root: Locator, minPx = 14): Promise<string[]> {
  return root.evaluate((el, min) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const parent = node.parentElement
      if (
        text &&
        parent &&
        !parent.closest('.katex') &&
        !parent.closest('[class*="srOnly"]') &&
        !parent.closest('[class*="eyebrow"]')
      ) {
        let size = parseFloat(getComputedStyle(parent).fontSize)
        const svg = parent.closest('svg')
        if (svg) {
          const viewBoxWidth = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          if (viewBoxWidth > 0) {
            size *= svg.getBoundingClientRect().width / viewBoxWidth
          }
        }
        if (size < min) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  }, minPx)
}

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(root: Locator): Promise<string[]> {
  return root.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (!frame.width || !vbW || !vbH) return
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
  test.describe(`Section 5.6 Metal Carbonyls desktop (${scheme})`, () => {
    test.use({ viewport: { width: 1280, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('steps through both Scrolly animations and interacts with Carbonyl Explorer', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)

      await page.goto(URL)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonding in Metal Carbonyls')

      // Scrolly 1: carbonyl-structures (3 steps)
      const scrolly1 = page.locator('[data-animation="carbonyl-structures"]')
      await expect(scrolly1).toBeVisible()
      const steps1 = scrolly1.locator('[data-scrolly-step]')
      await expect(steps1).toHaveCount(3)

      for (let k = 0; k < 3; k++) {
        await steps1.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(600)
        const svg = scrolly1.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u5-s8-structures-step${k + 1}-${scheme}.png` })
        expect(await smallTextLeaves(svg, 14)).toEqual([])
        expect(await svgOutOfBounds(scrolly1)).toEqual([])
      }

      // Scrolly 2: carbonyl-synergic-bonding (4 steps)
      const scrolly2 = page.locator('[data-animation="carbonyl-synergic-bonding"]')
      await expect(scrolly2).toBeVisible()
      const steps2 = scrolly2.locator('[data-scrolly-step]')
      await expect(steps2).toHaveCount(4)

      for (let k = 0; k < 4; k++) {
        await steps2.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(600)
        const svg = scrolly2.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u5-s8-synergic-step${k + 1}-${scheme}.png` })
        expect(await smallTextLeaves(svg, 14)).toEqual([])
        expect(await svgOutOfBounds(scrolly2)).toEqual([])
      }

      // Simulation: carbonyl-explorer
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await expect(sim).toBeVisible()
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('tetracarbonylnickel(0)')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('synergic: stronger M-CO bond')
      await sim.screenshot({ path: `test-results/screens/c12u5-s8-sim-ni-${scheme}.png` })
      expect(await smallTextLeaves(sim, 14)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Switch to [Mn2(CO)10]
      await sim.getByRole('button', { name: '[Mn2(CO)10]' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('decacarbonyldimanganese(0)')
      await sim.screenshot({ path: `test-results/screens/c12u5-s8-sim-mn-${scheme}.png` })
      expect(await smallTextLeaves(sim, 14)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Switch to [Co2(CO)8]
      await sim.getByRole('button', { name: '[Co2(CO)8]' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('octacarbonyldicobalt(0)')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('bridging CO: 2')
      await sim.screenshot({ path: `test-results/screens/c12u5-s8-sim-co-${scheme}.png` })
      expect(await smallTextLeaves(sim, 14)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // Toggle off pi back donation, verify status changes
      await sim.getByLabel('Show pi back donation').uncheck()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('sigma donation only (C to M)')

      // Toggle off sigma donation as well
      await sim.getByLabel('Show sigma donation').uncheck()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('skeletal structure only')

      // Re-enable both
      await sim.getByLabel('Show sigma donation').check()
      await sim.getByLabel('Show pi back donation').check()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('synergic: stronger M-CO bond')

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Section 5.6 Metal Carbonyls at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('renders cleanly without horizontal overflow and captures mobile screenshots', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(URL)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonding in Metal Carbonyls')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    const scrolly1 = page.locator('[data-animation="carbonyl-structures"]')
    await scrolly1.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await scrolly1.locator('svg[role="img"]').first().screenshot({
      path: 'test-results/screens/c12u5-s8-structures-mobile.png',
    })

    const scrolly2 = page.locator('[data-animation="carbonyl-synergic-bonding"]')
    await scrolly2.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await scrolly2.locator('svg[role="img"]').first().screenshot({
      path: 'test-results/screens/c12u5-s8-synergic-mobile.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await sim.screenshot({ path: 'test-results/screens/c12u5-s8-sim-mobile.png' })

    expect(errors).toEqual([])
  })
})
