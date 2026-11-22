import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '12-5-4-isomerism'
const SECTION_URL = `/class-12/unit-5/${SLUG}`
const SIM = 'isomer-lab'

const SCROLLY_SPECS = [
  { name: 'isomer-family-tree', steps: 3 },
  { name: 'geometrical-isomer-builder', steps: 5 },
  { name: 'chirality-mirror', steps: 4 },
  { name: 'structural-isomer-swaps', steps: 4 },
] as const

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
          const vbW = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          const rectW = svg.getBoundingClientRect().width
          if (vbW > 0 && rectW > 0) size *= rectW / vbW
        }
        if (size < min) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
      }
      node = walker.nextNode()
    }
    return bad
  }, minPx)
}

async function svgOutOfBounds(root: Locator): Promise<string[]> {
  return root.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (frame.width === 0 || frame.height === 0 || !vbW || !vbH) return
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
            `${el.tagName} ${el.textContent?.trim().slice(0, 28) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`,
          )
        }
      })
    })
    return out
  })
}

test.describe('Section 5.4 Isomerism desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('all 4 Scrolly animations render every step cleanly with >=14px text and zero SVG OOB', async ({ page }) => {
    test.setTimeout(180_000)
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    for (const spec of SCROLLY_SPECS) {
      const scrolly = page.locator(`[data-animation="${spec.name}"]`)
      await expect(scrolly).toBeVisible()
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(spec.steps)

      for (let k = 0; k < spec.steps; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        const svg = scrolly.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u5-s4-${spec.name}-step${k + 1}.png` })
        expect(await smallTextLeaves(svg, 14), `${spec.name} step ${k + 1} small text`).toEqual([])
        expect(await svgOutOfBounds(scrolly), `${spec.name} step ${k + 1} SVG OOB`).toEqual([])
      }
    }

    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('Isomer Lab simulation interactive modes work cleanly with >=14px text and zero SVG OOB', async ({ page }) => {
    test.setTimeout(120_000)
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()

    // 1. Default square planar MX2L2
    await expect(sim.locator('[aria-live="polite"]')).toContainText('square planar MX2L2: 2 geometrical arrangements')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-sim-mx2l2.png' })
    expect(await smallTextLeaves(sim, 14)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // 2. Square planar MABXL (3 isomers)
    await sim.getByRole('combobox', { name: 'Ligand set' }).selectOption('sq-mabxl')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('MABXL: 3 geometrical arrangements')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-sim-mabxl.png' })
    expect(await smallTextLeaves(sim, 14)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // 3. Octahedral MX2(L-L)2 with mirror toggle ON
    await sim.getByRole('combobox', { name: 'Geometry' }).selectOption('octahedral')
    await sim.getByRole('combobox', { name: 'Ligand set' }).selectOption('oct-mx2ll2')
    await sim.getByRole('button', { name: 'Show mirror image' }).click()
    await expect(sim).toContainText('Chiral: not superimposable')
    await expect(sim).toContainText('Achiral: superimposable')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-sim-oct-mirror.png' })
    expect(await smallTextLeaves(sim, 14)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // 4. Tetrahedral MX2L2 (1 arrangement)
    await sim.getByRole('combobox', { name: 'Geometry' }).selectOption('tetrahedral')
    await expect(sim.locator('[aria-live="polite"]')).toContainText('1 geometrical arrangement')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-sim-tetrahedral.png' })
    expect(await smallTextLeaves(sim, 14)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // 5. NCERT Pair Classifier mode (10 pairs)
    await sim.getByRole('tab', { name: /NCERT Pair Classifier/ }).click()
    await sim.getByRole('combobox', { name: 'NCERT isomer pair' }).selectOption('6')
    await expect(sim).toContainText('[Co(NH3)5(ONO)]Cl2')
    await sim.getByRole('button', { name: /Linkage/ }).click()
    await expect(sim).toContainText('Correct: Linkage isomerism')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-sim-pairs.png' })
    expect(await smallTextLeaves(sim, 14)).toEqual([])
    expect(errors).toEqual([])
  })
})

test.describe('Section 5.4 dark mode check (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' })

  test('renders cleanly in dark mode', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-sim-dark.png' })
    expect(errors).toEqual([])
  })
})

test.describe('Section 5.4 mobile (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('does not scroll sideways at 390px and captures mobile screenshots', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    const firstScrolly = page.locator('[data-animation="isomer-family-tree"]')
    await firstScrolly.scrollIntoViewIfNeeded()
    await firstScrolly.locator('svg[role="img"]').first().screenshot({
      path: 'test-results/screens/c12u5-s4-mobile-scrolly.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await sim.screenshot({ path: 'test-results/screens/c12u5-s4-mobile-sim.png' })
    expect(errors).toEqual([])
  })
})
