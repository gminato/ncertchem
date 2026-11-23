import { expect, test, type Locator, type Page } from '@playwright/test'

const SLUG = '12-7-2-nomenclature'
const SECTION_URL = `/class-12/unit-7/${SLUG}`
const SIM = 'oxygen-group-namer'
const SIM_URL = `/dev/sim/${SIM}`

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

/** Checks that every visible text leaf inside `root` renders at >= 14 px on screen. */
async function smallTextLeaves(root: Locator): Promise<string[]> {
  return root.evaluate((elRoot) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(elRoot, NodeFilter.SHOW_TEXT)
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

/** Checks that every drawn SVG element inside `svg` fits strictly inside its viewBox bounds. */
async function svgOutOfBounds(root: Locator): Promise<string[]> {
  return root.locator('svg[role="img"]').evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (frame.width === 0) return
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
  test.describe(`Section 7.2 Scrolly animations (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('renders alcohol-phenol-naming (6 steps) and ether-naming (5 steps) cleanly', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const scrolly1 = page.locator('[data-animation="alcohol-phenol-naming"]')
      await expect(scrolly1).toBeVisible()
      const steps1 = scrolly1.locator('[data-scrolly-step]')
      await expect(steps1).toHaveCount(6)

      for (let k = 0; k < 6; k++) {
        await steps1.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(450)
        const svg = scrolly1.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u7-s2-ap-step${k + 1}-${scheme}.png` })
        expect(await smallTextLeaves(svg), `alcohol-phenol step ${k + 1}`).toEqual([])
        expect(await svgOutOfBounds(scrolly1), `alcohol-phenol bounds step ${k + 1}`).toEqual([])
      }

      const scrolly2 = page.locator('[data-animation="ether-naming"]')
      await expect(scrolly2).toBeVisible()
      const steps2 = scrolly2.locator('[data-scrolly-step]')
      await expect(steps2).toHaveCount(5)

      for (let k = 0; k < 5; k++) {
        await steps2.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(450)
        const svg = scrolly2.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u7-s2-ether-step${k + 1}-${scheme}.png` })
        expect(await smallTextLeaves(svg), `ether step ${k + 1}`).toEqual([])
        expect(await svgOutOfBounds(scrolly2), `ether bounds step ${k + 1}`).toEqual([])
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })

  test.describe(`Oxygen Group Namer Simulation (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('switches families, presets, numbering toggle, and meets visual quality bar', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(SIM_URL)

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await expect(sim).toBeVisible()
      await sim.scrollIntoViewIfNeeded()

      // 1. Default Alcohols state: 2-Methylpropan-1-ol
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: 2-Methylpropan-1-ol.')
      await expect(sim.getByTestId('namer-live')).toContainText('Common name: Isobutyl alcohol.')
      await sim.screenshot({ path: `test-results/screens/c12u7-s2-sim-alcohol-default-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // 2. Cyclic alcohol preset + numbering toggle
      await sim.getByRole('button', { name: '2-Methylcyclopentanol' }).click()
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: 2-Methylcyclopentanol.')
      await expect(sim.getByTestId('namer-live')).toContainText('Common name: None listed.')
      await sim.screenshot({ path: `test-results/screens/c12u7-s2-sim-alcohol-cyclic-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      const toggle = sim.getByRole('switch', { name: 'Show carbon numbering' })
      await expect(toggle).toHaveAttribute('aria-checked', 'true')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-checked', 'false')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-checked', 'true')

      // 3. Phenols mode: None disables Ring position, then Hydroxyl + 1,4 (para) -> Hydroquinone / Benzene-1,4-diol
      await sim.getByRole('radio', { name: 'Phenols' }).click()
      await sim.getByRole('radio', { name: 'None (Phenol)' }).click()
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: Phenol.')
      await expect(sim.getByRole('radio', { name: '1,2 (ortho)' })).toBeDisabled()

      await sim.getByRole('radio', { name: 'Hydroxyl (Benzenediol)' }).click()
      await expect(sim.getByRole('radio', { name: '1,4 (para)' })).toBeEnabled()
      await sim.getByRole('radio', { name: '1,4 (para)' }).click()
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: Benzene-1,4-diol.')
      await expect(sim.getByTestId('namer-live')).toContainText('Common name: Hydroquinone (Quinol).')
      await sim.screenshot({ path: `test-results/screens/c12u7-s2-sim-phenol-para-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      // 4. Ethers mode: Phenyl + Heptyl -> 1-Phenoxyheptane, then Phenyl + Isopentyl -> 3-Methylbutoxybenzene, then special cyclo preset
      await sim.getByRole('radio', { name: 'Ethers' }).click()
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: 1-Phenoxyheptane.')
      await expect(sim.getByTestId('parent-rule-badge')).toContainText('Heptyl (7 C) > Phenyl (6 C)')
      const r2Group = sim.getByRole('radiogroup', { name: 'Right group R2' })
      await expect(r2Group.getByRole('radio', { name: 'Phenyl' })).toBeDisabled()
      await sim.screenshot({ path: `test-results/screens/c12u7-s2-sim-ether-heptyl-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await r2Group.getByRole('radio', { name: 'Isopentyl' }).click()
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: 3-Methylbutoxybenzene ((3-Methylbutoxy)benzene).')

      await sim.getByRole('button', { name: '2-Ethoxy-1,1-dimethylcyclohexane' }).click()
      await expect(sim.getByTestId('namer-live')).toContainText('IUPAC name: 2-Ethoxy-1,1-dimethylcyclohexane.')
      await sim.screenshot({ path: `test-results/screens/c12u7-s2-sim-ether-cyclo-${scheme}.png` })
      expect(await smallTextLeaves(sim)).toEqual([])
      expect(await svgOutOfBounds(sim)).toEqual([])

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test.describe('Mobile 390x844 layout', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

  test('has zero horizontal overflow on section page and simulation', async ({ page }) => {
    const errors = watchErrors(page)

    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const sectionScrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(sectionScrollW).toBeLessThanOrEqual(390)
    await page.screenshot({ path: 'test-results/screens/c12u7-s2-mobile-section.png' })

    await page.goto(SIM_URL)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    const simScrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(simScrollW).toBeLessThanOrEqual(390)
    await sim.screenshot({ path: 'test-results/screens/c12u7-s2-mobile-sim.png' })

    // Switch to Ethers on mobile and ensure still zero overflow
    await sim.getByRole('radio', { name: 'Ethers' }).click()
    await expect(sim.getByTestId('namer-live')).toContainText('1-Phenoxyheptane')
    const simEtherScrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(simEtherScrollW).toBeLessThanOrEqual(390)

    expect(errors).toEqual([])
  })
})
