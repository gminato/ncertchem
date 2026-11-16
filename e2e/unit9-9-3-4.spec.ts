import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-3-4-preparation-of-alkenes'
const ANIMATION = 'elimination'
const SIM = 'alkene-maker'
const STEP_NAMES = ['polar', 'base', 'concerted', 'ethene', 'dihalide', 'alcohol', 'alkynes'] as const
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
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
  test.describe(`Unit 9, Section 9.3.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the alkene maker render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparation of Alkenes')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(7)
      for (let i = 0; i < 7; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(800)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-4-${STEP_NAMES[i]}-${scheme}.png`) })
      }

      // Simulation, default state: 2-bromobutane with alcoholic KOH, two alkenes.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('alkene-drawing')).toBeVisible()
      await expect(sim.getByTestId('alkene-summary')).toContainText('but-2-ene')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-4-alkene-maker-default-${scheme}.png`) })

      // Changed state 1: ethanol with conc. H2SO4 gives ethene.
      await sim.getByRole('group', { name: 'Starting compound' }).getByRole('button', { name: 'ethanol', exact: true }).click()
      await sim.getByRole('group', { name: 'Reagent' }).getByRole('button', { name: 'Conc. H₂SO₄, heat' }).click()
      await expect(sim.getByTestId('alkene-summary')).toContainText('ethene')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-4-alkene-maker-ethanol-${scheme}.png`) })

      // Changed state 2: but-2-yne with Lindlar's catalyst gives cis-but-2-ene.
      await sim.getByRole('group', { name: 'Starting compound' }).getByRole('button', { name: 'but-2-yne', exact: true }).click()
      await sim.getByRole('group', { name: 'Reagent' }).getByRole('button', { name: 'H₂, Lindlar catalyst' }).click()
      await expect(sim.getByTestId('alkene-summary')).toContainText('cis-but-2-ene')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-4-alkene-maker-lindlar-${scheme}.png`) })

      // Changed state 3: no reaction, bromoethane with zinc.
      await sim.getByRole('group', { name: 'Starting compound' }).getByRole('button', { name: 'bromoethane', exact: true }).click()
      await sim.getByRole('group', { name: 'Reagent' }).getByRole('button', { name: 'Zinc' }).click()
      await expect(sim.getByTestId('alkene-summary')).toContainText('No reaction')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-4-alkene-maker-no-reaction-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
