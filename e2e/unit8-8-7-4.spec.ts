import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-8/8-7-4-electron-displacement-effects'
const ANIMATION = 'electron-effects'
const SIM = 'resonance-lab'
const STEP_NAMES = ['inductive', 'carboxylate', 'benzene', 'donation', 'withdrawal', 'electromeric', 'hyperconjugation'] as const
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
  test.describe(`Unit 8, Section 8.7.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the resonance lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electron Displacement Effects and Types of Reactions')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(7)
      for (let i = 0; i < 7; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(800)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-4-${STEP_NAMES[i]}-${scheme}.png`) })
      }

      // Simulation, default state: acetate ion, form 1 only.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('resonance-stage')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-4-resonance-lab-default-${scheme}.png`) })

      // Changed state 1: phenoxide, arrows shown then the second form drawn.
      await sim.getByRole('button', { name: 'Phenoxide ion' }).click()
      await sim.getByRole('button', { name: 'Show the arrows' }).click()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-4-resonance-lab-arrows-${scheme}.png`) })
      await sim.getByRole('button', { name: 'Draw all forms' }).click()
      await expect(sim.getByTestId('resonance-rank')).toBeVisible()
      await expect(sim.getByTestId('resonance-readout')).toContainText('All 3 forms drawn')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-4-resonance-lab-phenoxide-${scheme}.png`) })

      // Changed state 2: the inductive tab with trichloroacetic acid chosen.
      await sim.getByRole('radio', { name: 'Inductive effect' }).click()
      await sim.getByRole('group', { name: 'Acid' }).getByRole('button').nth(3).click()
      await expect(sim.getByTestId('inductive-readout')).toContainText('3 Cl on the α carbon')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-4-resonance-lab-inductive-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
