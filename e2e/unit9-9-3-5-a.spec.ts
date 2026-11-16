import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-3-5-addition-reactions-of-alkenes'
const ANIMATION = 'markovnikov'
const SIM = 'addition-predictor'
const STEP_NAMES = ['h-attack', 'secondary-cation', 'primary-cation', 'product', 'peroxide'] as const
// Wide layout: the next Step must stay below the activation line, so place this Step lower on screen.
const DEFAULT_FRACTION = 0.75

/**
 * Every text element inside the predictor renders at 14 CSS px or more (SVG text is scaled by its
 * on-screen size), and the names on the alkene and reagent chips at 16 px or more.
 */
async function expectReadableText(sim: Locator) {
  const sizes = await sim.evaluate((root) => {
    const out: { text: string; px: number; chip: boolean }[] = []
    for (const el of Array.from(root.querySelectorAll('*'))) {
      if (el.closest('[aria-live]')) continue
      // The shared Simulation shell's eyebrow label is not part of this Section's sim.
      if (el.closest('header') && (el.textContent ?? '').trim().toLowerCase() === 'simulation') continue
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? '').join('').trim()
      if (own.replace(/[\u200b\s]/g, '') === '') continue
      const rect = el.getBoundingClientRect()
      if (rect.width <= 1 || rect.height <= 1) continue
      let px = parseFloat(getComputedStyle(el).fontSize)
      if (el instanceof SVGElement && 'getScreenCTM' in el) {
        const ctm = (el as SVGGraphicsElement).getScreenCTM()
        px *= ctm ? ctm.a : 1
      }
      out.push({ text: own.slice(0, 40), px, chip: el.closest('button') !== null && el.closest('[role="group"][aria-label="Alkene"]') !== null })
    }
    return out
  })
  expect(sizes.length).toBeGreaterThan(5)
  const small = sizes.filter((t) => t.px < 14).map((t) => `${t.text} (${t.px.toFixed(1)}px)`)
  expect(small, small.join('\n')).toEqual([])
  const smallChips = sizes.filter((t) => t.chip && t.px < 16).map((t) => `${t.text} (${t.px.toFixed(1)}px)`)
  expect(smallChips, smallChips.join('\n')).toEqual([])
}

/** Waits until hydration has run the Scrolly (it marks the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.3.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })

    test('Scrolly Steps and the addition predictor render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Properties of Alkenes: Addition Reactions')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(5)
      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(900)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-markovnikov-${STEP_NAMES[i]}-${scheme}.png`) })
      }

      // Simulation, default state: propene and HBr, not yet answered.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('predictor-alkene')).toBeVisible()
      await expectReadableText(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-addition-predictor-default-${scheme}.png`) })

      // Changed state 1: a wrong carbon for propene and HBr.
      await sim.getByTestId('carbon-1').click()
      await expect(sim.getByTestId('predictor-verdict')).toContainText('Not this carbon')
      await expect(sim.getByTestId('predictor-major')).toContainText('2-bromopropane')
      await expectReadableText(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-addition-predictor-wrong-${scheme}.png`) })

      // Changed state 2: the right carbon for HBr with peroxide on 2-methylpropene.
      await sim.getByRole('group', { name: 'Alkene' }).getByRole('button', { name: '2-methylprop-1-ene' }).click()
      await sim.getByRole('group', { name: 'Reagent' }).getByRole('button', { name: 'HBr with peroxide' }).click()
      await sim.getByTestId('carbon-1').click()
      await expect(sim.getByTestId('predictor-verdict')).toContainText('Right')
      await expect(sim.getByTestId('predictor-major')).toContainText('1-bromo-2-methylpropane')
      await expectReadableText(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-addition-predictor-peroxide-${scheme}.png`) })

      // Changed state 3: cold concentrated sulphuric acid on cyclohexene (symmetrical: either carbon).
      await sim.getByRole('group', { name: 'Alkene' }).getByRole('button', { name: 'cyclohexene' }).click()
      await sim.getByRole('group', { name: 'Reagent' }).getByRole('button', { name: 'cold conc. H₂SO₄' }).click()
      await sim.getByTestId('carbon-2').click()
      await expect(sim.getByTestId('predictor-verdict')).toContainText('either one is right')
      await expect(sim.getByTestId('predictor-major')).toContainText('C₆H₁₂O₄S')
      await expectReadableText(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-addition-predictor-sulphuric-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
