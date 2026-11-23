import { test, expect, type Locator, type Page } from '@playwright/test'

const SECTION_URL = '/class-12/unit-5/12-5-2-definitions-of-important-terms'
const SIM = 'coordination-dissector'

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

async function smallTextLeaves(container: Locator): Promise<string[]> {
  return container.evaluate((root) => {
    const bad: string[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el && !el.closest('.katex') && !el.closest('[class*="srOnly"]') && !el.closest('[class*="eyebrow"]')) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        const svg = el.closest('svg')
        if (svg) {
          const viewBoxWidth = parseFloat((svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[2])
          const rect = svg.getBoundingClientRect()
          if (viewBoxWidth > 0 && rect.width > 0) {
            size *= rect.width / viewBoxWidth
          }
        }
        if (size < 13.8) bad.push(`${size.toFixed(1)}px: ${text.slice(0, 40)}`)
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
      if (!vbW || !frame.width) return
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
        if (x0 < -1 || y0 < -1 || x1 > vbW + 1 || y1 > vbH + 1) {
          out.push(`${el.tagName} ${el.textContent?.trim().slice(0, 30) ?? ''} [${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}]`)
        }
      })
    })
    return out
  })
}

test('Section 5.2 desktop: Scrolly animations and Coordination Dissector', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Definitions of Some Important Terms')

  // Scrolly 1: ligand-denticity-gallery (5 steps)
  const scrolly1 = page.locator('[data-animation="ligand-denticity-gallery"]')
  const steps1 = scrolly1.locator('[data-scrolly-step]')
  await expect(steps1).toHaveCount(5)
  const panel1 = scrolly1.getByTestId('scrolly-visual')

  for (let i = 0; i < 5; i++) {
    await steps1.nth(i).scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    await expect(steps1.nth(i)).toHaveAttribute('data-active', 'true')
    await panel1.screenshot({ path: `test-results/screens/c12u5-s2-denticity-step${i + 1}-desktop.png` })
    expect(await smallTextLeaves(panel1)).toEqual([])
    expect(await svgOutOfBounds(panel1)).toEqual([])
  }

  // Test ambidentate toggle in Step 5 via keyboard (Enter and Space)
  const nitritoOBtn = panel1.getByRole('button', { name: 'nitrito-O' })
  await nitritoOBtn.focus()
  await nitritoOBtn.press('Enter')
  await expect(nitritoOBtn).toHaveAttribute('aria-pressed', 'true')

  const thioNBtn = panel1.getByRole('button', { name: 'thiocyanato-N' })
  await thioNBtn.focus()
  await thioNBtn.press(' ')
  await expect(thioNBtn).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(150)
  await panel1.screenshot({ path: `test-results/screens/c12u5-s2-denticity-step5-toggled-desktop.png` })

  // Scrolly 2: coordination-polyhedra-gallery (4 steps)
  const scrolly2 = page.locator('[data-animation="coordination-polyhedra-gallery"]')
  const steps2 = scrolly2.locator('[data-scrolly-step]')
  await expect(steps2).toHaveCount(4)
  const panel2 = scrolly2.getByTestId('scrolly-visual')

  for (let i = 0; i < 4; i++) {
    await steps2.nth(i).scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    await expect(steps2.nth(i)).toHaveAttribute('data-active', 'true')
    await panel2.screenshot({ path: `test-results/screens/c12u5-s2-polyhedra-step${i + 1}-desktop.png` })
    expect(await smallTextLeaves(panel2)).toEqual([])
    expect(await svgOutOfBounds(panel2)).toEqual([])
  }

  // Simulation: coordination-dissector
  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await expect(sim).toBeVisible()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('[Co(en)₃]³⁺')
  // Before oxidation number is revealed, the metal row and liveSummary must not give away Co³⁺
  await expect(sim).toContainText('Co (Lewis acid)')
  await expect(sim).not.toContainText('Co³⁺')
  await expect(sim.locator('[aria-live="polite"]')).not.toContainText('Co³⁺')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s2-sim-default-desktop.png' })
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])

  // Reveal all terms on default complex
  await sim.getByRole('button', { name: 'Reveal all' }).click()
  await expect(sim).toContainText('Co³⁺ (Lewis acid)')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Central atom or ion Co³⁺')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('coordination number 6')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('oxidation number Co(III)')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s2-sim-revealed-desktop.png' })

  // Select K4[Fe(CN)6] and reveal
  await sim.getByRole('combobox').selectOption('[Fe(CN)6]4-')
  await sim.getByRole('button', { name: 'Reveal all' }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('K₄[Fe(CN)₆]')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Fe(II)')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s2-sim-ferro-desktop.png' })

  // Select heteroleptic [Co(NH3)4Cl2]+ and reveal
  await sim.getByRole('combobox').selectOption('[Co(NH3)4Cl2]+')
  await sim.getByRole('button', { name: 'Reveal all' }).click()
  await expect(sim).toContainText('Heteroleptic')
  await sim.screenshot({ path: 'test-results/screens/c12u5-s2-sim-hetero-desktop.png' })
  expect(await smallTextLeaves(sim)).toEqual([])
  expect(await svgOutOfBounds(sim)).toEqual([])

  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(errors).toEqual([])
})

test('Section 5.2 mobile (390x844): no horizontal overflow and clean layout', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  const errors = watchErrors(page)

  await page.goto(SECTION_URL)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Definitions of Some Important Terms')

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)

  const panel1 = page.locator('[data-animation="ligand-denticity-gallery"]').getByTestId('scrolly-visual')
  await panel1.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await panel1.screenshot({ path: 'test-results/screens/c12u5-s2-denticity-mobile.png' })

  const panel2 = page.locator('[data-animation="coordination-polyhedra-gallery"]').getByTestId('scrolly-visual')
  await panel2.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await panel2.screenshot({ path: 'test-results/screens/c12u5-s2-polyhedra-mobile.png' })

  const sim = page.locator(`[data-simulation="${SIM}"]`)
  await sim.scrollIntoViewIfNeeded()
  await sim.getByRole('button', { name: 'Reveal all' }).click()
  await sim.screenshot({ path: 'test-results/screens/c12u5-s2-sim-mobile.png' })

  const scrollWidthAfter = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidthAfter).toBeLessThanOrEqual(390)
  expect(errors).toEqual([])
})
