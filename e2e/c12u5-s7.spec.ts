import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-5-5-5-colour-and-cft-limitations'
const SECTION_URL = `/class-12/unit-5/${SLUG}`
const SIM = 'ligand-colour-lab'

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

/** Check that rendered SVG text inside a locator is at least minPx. */
async function smallSvgText(page: Page, selector: string, minPx = 14): Promise<string[]> {
  return page.locator(selector).evaluateAll((svgs, threshold) => {
    const bad: string[] = []
    svgs.forEach((svg) => {
      const vbAttr = svg.getAttribute('viewBox')
      if (!vbAttr) return
      const vbW = parseFloat(vbAttr.split(/\s+/)[2])
      const rect = svg.getBoundingClientRect()
      if (!vbW || rect.width === 0) return
      const scale = rect.width / vbW
      svg.querySelectorAll('text').forEach((t) => {
        const label = (t.textContent ?? '').trim()
        if (!label) return
        const rendered = parseFloat(getComputedStyle(t).fontSize) * scale
        if (rendered < threshold) bad.push(`${rendered.toFixed(1)}px: ${label.slice(0, 40)}`)
      })
    })
    return bad
  }, minPx)
}

/** Check that no drawn SVG leaf extends outside its viewBox. */
async function svgOutOfBounds(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((svgs) => {
    const out: string[] = []
    svgs.forEach((svg) => {
      const vbAttr = svg.getAttribute('viewBox')
      if (!vbAttr) return
      const [, , vbW, vbH] = vbAttr.split(/\s+/).map(Number)
      const frame = svg.getBoundingClientRect()
      if (!vbW || frame.width === 0) return
      const scale = vbW / frame.width
      const leaves = svg.querySelectorAll('text, circle, line, path, rect, ellipse, polygon, polyline')
      leaves.forEach((el) => {
        if (el.closest('defs, clipPath, mask, pattern, symbol, marker')) return
        const style = getComputedStyle(el)
        if (style.opacity === '0' || style.display === 'none') return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const x0 = (r.left - frame.left) * scale
        const y0 = (r.top - frame.top) * scale
        const x1 = (r.right - frame.left) * scale
        const y1 = (r.bottom - frame.top) * scale
        if (x0 < -1 || y0 < -1 || x1 > vbW + 1 || y1 > vbH + 1) {
          out.push(`${el.tagName} ${(el.textContent ?? '').trim().slice(0, 28)} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`)
        }
      })
    })
    return out
  })
}

const SCROLLIES = [
  { name: 'cft-d-d-colour', steps: 5 },
  { name: 'ni-en-colour-series', steps: 4 },
  { name: 'cft-limitations', steps: 4 },
] as const

test.describe('Class 12 Unit 5 S5.5.5-5.5.6 desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('all three Scrollies and Ligand Colour Lab render cleanly and pass checks', async ({ page }) => {
    test.setTimeout(180_000)
    const errors = watchErrors(page)

    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    for (const sc of SCROLLIES) {
      const scrolly = page.locator(`[data-animation="${sc.name}"]`)
      await expect(scrolly).toBeVisible()
      const stepEls = scrolly.locator('[data-scrolly-step]')
      await expect(stepEls).toHaveCount(sc.steps)

      for (let k = 0; k < sc.steps; k++) {
        await stepEls.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(450)
        const svg = scrolly.locator('svg[role="img"]').first()
        await expect(svg).toBeVisible()
        await svg.screenshot({ path: `test-results/screens/c12u5-s7-${sc.name}-step${k + 1}-desktop.png` })
        expect(await smallSvgText(page, `[data-animation="${sc.name}"] svg[role="img"]`, 13.5), `${sc.name} step ${k + 1} small text`).toEqual([])
        expect(await svgOutOfBounds(page, `[data-animation="${sc.name}"] svg[role="img"]`), `${sc.name} step ${k + 1} bounds`).toEqual([])
      }
    }

    // Simulation interactions
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()

    // State 1: Default [Ti(H2O)6]3+ (498 nm)
    await expect(sim.locator('[aria-live="polite"]')).toContainText('498 nm')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s7-sim-default-desktop.png' })
    expect(await smallSvgText(page, `[data-simulation="${SIM}"] svg[role="img"]`, 14)).toEqual([])
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"] svg[role="img"]`)).toEqual([])

    // State 2: [Co(CN)6]3- (UV 310 nm) + Energy (J) readout
    await sim.getByRole('combobox').selectOption('co-cn-6')
    await sim.getByRole('button', { name: 'Energy (J)' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Ultraviolet')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s7-sim-uv-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"] svg[role="img"]`)).toEqual([])

    // State 3: Ni(II) en series stepping to 2 en (2 waters left)
    await sim.getByRole('combobox').selectOption('ni-en-0')
    await sim.getByRole('button', { name: '2 en (2 H₂O)' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('2 waters left')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s7-sim-ni-en2-desktop.png' })

    // State 4: Ligands removed (colourless)
    await sim.getByRole('button', { name: 'Ligands removed' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('colourless')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s7-sim-no-ligands-desktop.png' })

    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('Class 12 Unit 5 S5.5.5-5.5.6 mobile (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('simulation does not scroll sideways at 390 px and mobile screenshots render cleanly', async ({ page }) => {
    const errors = watchErrors(page)

    await page.goto(`/dev/sim/${SIM}`)
    const standaloneSim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(standaloneSim).toBeVisible()
    const simWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(simWidth).toBeLessThanOrEqual(390)

    await page.goto(SECTION_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()
    await sim.screenshot({ path: 'test-results/screens/c12u5-s7-sim-mobile.png' })

    const firstScrolly = page.locator('[data-animation="cft-d-d-colour"] svg[role="img"]').first()
    await firstScrolly.scrollIntoViewIfNeeded()
    await firstScrolly.screenshot({ path: 'test-results/screens/c12u5-s7-cft-d-d-colour-mobile.png' })

    const secondScrolly = page.locator('[data-animation="ni-en-colour-series"] svg[role="img"]').first()
    await secondScrolly.scrollIntoViewIfNeeded()
    await secondScrolly.screenshot({ path: 'test-results/screens/c12u5-s7-ni-en-mobile.png' })

    const thirdScrolly = page.locator('[data-animation="cft-limitations"] svg[role="img"]').first()
    await thirdScrolly.scrollIntoViewIfNeeded()
    await thirdScrolly.screenshot({ path: 'test-results/screens/c12u5-s7-cft-limitations-mobile.png' })

    expect(errors).toEqual([])
  })
})
