import { test, expect, type Page } from '@playwright/test'

const SLUG = '12-5-7-importance-and-applications'
const ANIMATION = 'coordination-applications'
const SIM = 'complex-application-explorer'
const STEP_COUNT = 6

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

/** Text leaves in a root locator whose RENDERED size is below minPx (KaTeX and SR-only excluded). */
async function smallTextLeaves(page: Page, selector: string, minPx = 14): Promise<string[]> {
  return page.locator(selector).evaluate((root, min) => {
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
async function svgOutOfBounds(page: Page, selector: string): Promise<string[]> {
  return page.locator(`${selector} svg[role="img"]`).evaluateAll((svgs) => {
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

test.describe('Section 5.7 Desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('Scrolly steps and Complex Application Explorer render cleanly with valid SVG bounds and >=14px text', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    const errors = watchErrors(page)
    await page.goto(`/class-12/unit-5/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // 1. Step through all 6 Scrolly steps
    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await expect(scrolly).toBeVisible()
    const steps = scrolly.locator('[data-scrolly-step]')
    await expect(steps).toHaveCount(STEP_COUNT)

    for (let k = 0; k < STEP_COUNT; k++) {
      await steps.nth(k).scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      const svg = scrolly.locator('svg[role="img"]').first()
      await expect(svg).toBeVisible()
      await svg.screenshot({ path: `test-results/screens/c12u5-s9-step${k + 1}-desktop.png` })
      expect(await svgOutOfBounds(page, `[data-animation="${ANIMATION}"]`)).toEqual([])
      expect(await smallTextLeaves(page, `[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`, 14)).toEqual([])
    }

    // 2. Interact with the Complex Application Explorer simulation
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()

    // Default state: Hardness titration
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Hardness titration')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s9-sim-default-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])
    expect(await smallTextLeaves(page, `[data-simulation="${SIM}"]`, 14)).toEqual([])

    // Select Vitamin B12 and verify clean SVG label (no truncation) and full readout
    await sim.getByRole('button', { name: 'Vitamin B12' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Vitamin B₁₂ (cyanocobalamine)')
    await expect(sim.locator('svg[role="img"]')).toContainText('Vitamin B₁₂')
    await expect(sim.locator('svg[role="img"]')).not.toContainText('...')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s9-sim-b12-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])
    expect(await smallTextLeaves(page, `[data-simulation="${SIM}"]`, 14)).toEqual([])

    // Select Gold extraction
    await sim.getByRole('button', { name: 'Gold extraction' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('[Au(CN)₂]⁻')
    await expect(sim).toContainText('Oxidation state: +1')
    await expect(sim).toContainText('CN: 2')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s9-sim-gold-desktop.png' })
    expect(await svgOutOfBounds(page, `[data-simulation="${SIM}"]`)).toEqual([])

    // Click effect toggle "Dissolving" to cycle to Photographic fixing
    await sim.getByRole('button', { name: 'Dissolving' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Photographic fixing')

    // Switch to Quiz me mode and answer
    await sim.getByRole('radio', { name: 'Quiz me' }).click()
    await expect(sim.locator('[aria-live="polite"]')).toContainText('Quiz mode')
    await sim.screenshot({ path: 'test-results/screens/c12u5-s9-sim-quiz-desktop.png' })
    await sim.locator('[aria-label="Entity choices"] button').first().click()
    await expect(sim.getByRole('button', { name: 'Next application' })).toBeVisible()

    // Capture Step 5 prose (KaTeX formulas in Scrolly steps) and Key Ideas
    await steps.nth(4).scrollIntoViewIfNeeded()
    await steps.nth(4).screenshot({ path: 'test-results/screens/c12u5-s9-step5-prose-desktop.png' })
    const keyIdeas = page.locator('aside, section').filter({ hasText: 'stability constants of their EDTA complexes' }).last()
    if ((await keyIdeas.count()) > 0) {
      await keyIdeas.scrollIntoViewIfNeeded()
      await keyIdeas.screenshot({ path: 'test-results/screens/c12u5-s9-keyideas-desktop.png' })
    }

    // No KaTeX errors and no console/page errors
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('Section 5.7 Mobile (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' })

  test('renders Scrolly and Simulation cleanly without overflow at 390px', async ({ page }) => {
    const errors = watchErrors(page)

    // Standalone simulation must never overflow 390px
    await page.goto(`/dev/sim/${SIM}`)
    const standaloneSim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(standaloneSim).toBeVisible()
    const simScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(simScrollWidth).toBeLessThanOrEqual(390)

    // Full section page: Scrolly and Simulation fit within 390px viewport
    await page.goto(`/class-12/unit-5/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
    await scrolly.scrollIntoViewIfNeeded()
    const scrollyBox = await scrolly.boundingBox()
    expect(scrollyBox).not.toBeNull()
    expect((scrollyBox?.x ?? 0) + (scrollyBox?.width ?? 0)).toBeLessThanOrEqual(391)
    await scrolly.locator('svg[role="img"]').first().screenshot({
      path: 'test-results/screens/c12u5-s9-step1-mobile.png',
    })

    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim).toBeVisible()
    const simBox = await sim.boundingBox()
    expect(simBox).not.toBeNull()
    expect((simBox?.x ?? 0) + (simBox?.width ?? 0)).toBeLessThanOrEqual(391)
    await sim.screenshot({ path: 'test-results/screens/c12u5-s9-sim-mobile.png' })

    expect(errors).toEqual([])
  })
})
