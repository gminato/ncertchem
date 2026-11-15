import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-6/6-8-factors-affecting-equilibria'
const ANIMATION = 'le-chatelier'
const SIM = 'le-chatelier-lab'
// The wide layout activates the last Step whose top is above 97% of the viewport, so each Step is
// placed near 90%, where the next Step is still below that line.
const DEFAULT_FRACTION = 0.9

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so that Step `index` is the active one. */
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

async function shotStep(page: Page, index: number, scheme: string) {
  await gotoStep(page, index)
  await page.waitForTimeout(2000)
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-6-8-lechatelier-step${index}-${scheme}.png`) })
}

/** Waits until the Lab's clock has finished the relaxation that is running (the clock stops when the tab is hidden). */
async function settleLab(page: Page) {
  await expect(page.getByTestId('le-chatelier-lab')).toHaveAttribute('data-running', 'false', { timeout: 20_000 })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Section 6.8 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('6.8 page: six Scrolly Steps and the Le Chatelier Lab render, with values from the lib and no console errors', async ({ page }) => {
      test.setTimeout(480_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Factors Affecting Equilibria')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(6)
      for (let i = 0; i < 6; i++) await shotStep(page, i, scheme)

      // Step 2 (compression): the readout reports Q = 15.5 M⁻² and a forward shift.
      await gotoStep(page, 2)
      await expect(page.getByTestId('le-chatelier-readout')).toContainText('15.5')

      // Step 5 (heat): K falls from 62.2 to 8.3.
      await gotoStep(page, 4)
      await expect(page.getByTestId('le-chatelier-readout')).toContainText('8.3')

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await settleLab(page)
      await expect(sim.getByTestId('lab-k')).toContainText('62.2')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-8-lab-default-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Compress to ½ V' }).click()
      await settleLab(page)
      await expect(sim.getByTestId('lab-q')).toContainText('15.5')
      await expect(sim.getByTestId('lab-direction')).toContainText('towards products')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-8-lab-compress-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Heat +50 K' }).click()
      await settleLab(page)
      await expect(sim.getByTestId('lab-k')).toContainText('8.27')
      await expect(sim.getByTestId('lab-direction')).toContainText('towards reactants')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-8-lab-heat-${scheme}.png`) })

      // Switch to the N2O4 system: the brown NO2 tint appears on heating.
      await sim.getByRole('radio', { name: 'N₂O₄ ⇌ 2NO₂' }).click()
      await settleLab(page)
      await sim.getByRole('button', { name: 'Heat +50 K' }).click()
      await settleLab(page)
      await expect(sim.getByTestId('lab-direction')).toContainText('towards products')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-8-lab-n2o4-heat-${scheme}.png`) })

      // Switch to the aqueous Fe–SCN mixture: removing Fe³⁺ fades the red complex.
      await sim.getByRole('radio', { name: 'Fe³⁺ + SCN⁻' }).click()
      await settleLab(page)
      await sim.getByRole('button', { name: 'Remove Fe³⁺' }).click()
      await settleLab(page)
      await expect(sim.getByTestId('lab-direction')).toContainText('towards reactants')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-8-lab-fescn-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
