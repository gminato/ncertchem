import { test, expect, type Locator, type Page } from '@playwright/test'

const SLUG = '12-7-6-3-chemical-reactions-of-ethers'
const URL = `/class-12/unit-7/${SLUG}`
const SCROLLY_CLEAVAGE = 'ether-cleavage-pathways'
const SCROLLY_ANISOLE = 'anisole-resonance-eas'
const SIM = 'ether-reaction-workbench'

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

/** Text leaves inside a root whose rendered font size is below 14 px. */
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

/** Drawn SVG leaves whose on-screen boxes fall outside their drawing's viewBox (in viewBox units). */
async function svgOutOfBounds(root: Locator): Promise<string[]> {
  return root.locator('svg[role="img"]').evaluateAll((svgs) => {
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
  test(`Section 7.6.3 Scrolly animations and Simulation work cleanly in ${scheme} (desktop 1280x800)`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const errors = watchErrors(page)

    await page.goto(URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // 1. Scrolly 1: ether-cleavage-pathways (5 steps)
    const cleavageScrolly = page.locator(`[data-animation="${SCROLLY_CLEAVAGE}"]`)
    await expect(cleavageScrolly).toBeVisible()
    const cleavageSteps = cleavageScrolly.locator('[data-scrolly-step]')
    await expect(cleavageSteps).toHaveCount(5)

    for (let k = 0; k < 5; k++) {
      await cleavageSteps.nth(k).scrollIntoViewIfNeeded()
      await page.waitForTimeout(350)
      const visualPanel = cleavageScrolly.getByTestId('scrolly-visual')
      const svg = visualPanel.locator('svg[role="img"]').first()
      await expect(svg).toBeVisible()
      await expect(svg).toHaveAttribute('data-step', String(k))
      await visualPanel.screenshot({
        path: `test-results/screens/c12u7-s12-cleavage-step${k + 1}-${scheme}.png`,
      })
      expect(await smallTextLeaves(visualPanel)).toEqual([])
      expect(await svgOutOfBounds(visualPanel)).toEqual([])
    }

    // 2. Scrolly 2: anisole-resonance-eas (4 steps)
    const anisoleScrolly = page.locator(`[data-animation="${SCROLLY_ANISOLE}"]`)
    await expect(anisoleScrolly).toBeVisible()
    const anisoleSteps = anisoleScrolly.locator('[data-scrolly-step]')
    await expect(anisoleSteps).toHaveCount(4)

    for (let k = 0; k < 4; k++) {
      await anisoleSteps.nth(k).scrollIntoViewIfNeeded()
      await page.waitForTimeout(350)
      const visualPanel = anisoleScrolly.getByTestId('scrolly-visual')
      const svg = visualPanel.locator('svg[role="img"]').first()
      await expect(svg).toBeVisible()
      await expect(svg).toHaveAttribute('data-step', String(k))
      await visualPanel.screenshot({
        path: `test-results/screens/c12u7-s12-anisole-step${k + 1}-${scheme}.png`,
      })
      expect(await smallTextLeaves(visualPanel)).toEqual([])
      expect(await svgOutOfBounds(visualPanel)).toEqual([])
    }

    // 3. Simulation: ether-reaction-workbench
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    await sim.scrollIntoViewIfNeeded()

    // Default: Ethyl methyl ether + 1 eq conc. HI -> SN2, CH3I + CH3CH2OH
    await expect(sim.getByTestId('cleavage-mechanism')).toHaveText('SN2')
    await expect(sim.getByTestId('cleavage-products')).toHaveText('CH₃I + CH₃CH₂OH')
    await sim.screenshot({ path: `test-results/screens/c12u7-s12-sim-cleavage-em-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Excess HI on ethyl methyl ether -> CH3I + CH3CH2I + H2O
    await sim.getByRole('radio', { name: 'Excess conc. HI, high T' }).click()
    await expect(sim.getByTestId('cleavage-products')).toHaveText('CH₃I + CH₃CH₂I + H₂O')
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // tert-Butyl methyl ether: 1 eq SN1 -> (CH3)3C-I + CH3OH
    await sim.getByRole('radio', { name: '1 eq conc. HI' }).click()
    await sim.getByRole('button', { name: /tert-Butyl methyl ether/i }).click()
    await expect(sim.getByTestId('cleavage-mechanism')).toHaveText('SN1')
    await expect(sim.getByTestId('cleavage-products')).toHaveText('(CH₃)₃C-I + CH₃OH')
    await sim.screenshot({ path: `test-results/screens/c12u7-s12-sim-cleavage-tbu-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Anisole with excess HI -> C6H5OH + CH3I ONLY (no C6H5I)
    await sim.getByRole('radio', { name: 'Excess conc. HI, high T' }).click()
    await sim.getByRole('button', { name: /Anisole \(C₆H₅-O-CH₃\)/i }).click()
    await expect(sim.getByTestId('cleavage-products')).toHaveText('C₆H₅OH + CH₃I')
    await expect(sim.getByTestId('aryl-lock-note')).toContainText('No C₆H₅I formed')
    await sim.screenshot({ path: `test-results/screens/c12u7-s12-sim-cleavage-anisole-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Diethyl ether: excess vs 1 eq
    await sim.getByRole('button', { name: /Diethyl ether/i }).click()
    await expect(sim.getByTestId('cleavage-products')).toHaveText('2 C₂H₅I + H₂O')
    await sim.getByRole('radio', { name: '1 eq conc. HI' }).click()
    await expect(sim.getByTestId('cleavage-products')).toHaveText('C₂H₅I + C₂H₅OH')
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Mode 2: Anisole Ring EAS
    await sim.getByRole('radio', { name: 'Anisole Ring EAS' }).click()
    await expect(sim.getByTestId('eas-reagent')).toContainText('no FeBr₃')
    await expect(sim.getByTestId('eas-major')).toContainText('90% yield')
    await sim.screenshot({ path: `test-results/screens/c12u7-s12-sim-eas-bromo-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // FC Alkylation
    await sim.getByRole('button', { name: /Friedel-Crafts Alkylation/i }).click()
    await expect(sim.getByTestId('eas-reagent')).toContainText('Anhydrous AlCl₃')
    await expect(sim.getByTestId('eas-major')).toHaveText('4-Methoxytoluene')
    await expect(sim.getByTestId('eas-minor')).toHaveText('2-Methoxytoluene')
    expect(await svgOutOfBounds(sim)).toEqual([])

    // FC Acylation
    await sim.getByRole('button', { name: /Friedel-Crafts Acylation/i }).click()
    await expect(sim.getByTestId('eas-major')).toHaveText('4-Methoxyacetophenone')
    await expect(sim.getByTestId('eas-minor')).toHaveText('2-Methoxyacetophenone')
    expect(await svgOutOfBounds(sim)).toEqual([])

    // Nitration
    await sim.getByRole('button', { name: /Nitration/i }).click()
    await expect(sim.getByTestId('eas-major')).toHaveText('4-Nitroanisole')
    await expect(sim.getByTestId('eas-minor')).toHaveText('2-Nitroanisole')
    await sim.screenshot({ path: `test-results/screens/c12u7-s12-sim-eas-nitro-${scheme}.png` })
    expect(await smallTextLeaves(sim)).toEqual([])
    expect(await svgOutOfBounds(sim)).toEqual([])

    // KaTeX & console errors
    await expect(page.locator('.katex-display').first()).toBeAttached()
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('Section 7.6.3 renders cleanly at mobile 390x844 with zero horizontal scroll', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  const errors = watchErrors(page)

  await page.goto(URL)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)

  const cleavageScrolly = page.locator(`[data-animation="${SCROLLY_CLEAVAGE}"]`)
  await cleavageScrolly.locator('[data-scrolly-step]').nth(1).scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  await cleavageScrolly
    .getByTestId('scrolly-visual')
    .screenshot({ path: 'test-results/screens/c12u7-s12-cleavage-mobile.png' })

  const anisoleScrolly = page.locator(`[data-animation="${SCROLLY_ANISOLE}"]`)
  await anisoleScrolly.locator('[data-scrolly-step]').nth(2).scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  await anisoleScrolly
    .getByTestId('scrolly-visual')
    .screenshot({ path: 'test-results/screens/c12u7-s12-anisole-mobile.png' })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await sim.screenshot({ path: 'test-results/screens/c12u7-s12-sim-cleavage-mobile.png' })
  expect(await svgOutOfBounds(sim)).toEqual([])

  await sim.getByRole('radio', { name: 'Anisole Ring EAS' }).click()
  await sim.screenshot({ path: 'test-results/screens/c12u7-s12-sim-eas-mobile.png' })
  expect(await svgOutOfBounds(sim)).toEqual([])

  const postWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(postWidth).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
})
