import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-7/7-3-3-redox-reactions-as-the-basis-for-titrations'

/** Waits until hydration has run the Scrolly effects. */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the tween to finish. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, what: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1000)
  const visual = page.locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
  await visual.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-3-${what}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7, Section 7.3.3 & 7.3.4 (${scheme})`, () => {
    test.use({
      colorScheme: scheme,
      viewport: { width: 1440, height: 900 },
    })

    test('every Scrolly Step and Simulation states render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Redox Reactions as the Basis for Titrations'
      )

      // 1. Scrolly: redox-titration (5 Steps)
      await waitForScrolly(page, 'redox-titration')
      await expect(
        page.locator('[data-animation="redox-titration"] [data-scrolly-step]')
      ).toHaveCount(5)

      for (let i = 0; i < 5; i++) {
        await shotStep(page, 'redox-titration', i, 'scrolly', scheme)
      }

      // 2. Simulation: redox-titration-lab
      const sim = page.locator('[data-simulation="redox-titration-lab"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByRole('img')).toBeVisible()
      await page.waitForTimeout(600)

      // State A: Default state (Permanganate - Fe2+ at 0.0 mL)
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-sim-default-${scheme}.png`),
      })

      // State B: Changed state 1 - Jump to End Point in Permanganate titration
      await sim.getByRole('button', { name: /Jump to End Point/ }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Equivalence Reached', { exact: true })).toBeVisible()
      await expect(sim.getByText('Stoichiometric Deduction of Unknown Concentration')).toBeVisible()
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-sim-endpoint-${scheme}.png`),
      })

      // State C: Dichromate with diphenylamine
      await sim.getByRole('radio', { name: 'Cr₂O₇²⁻ / Fe²⁺' }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('K₂Cr₂O₇ vs Fe²⁺ (Mohr salt)', { exact: true })).toBeVisible()

      // At 0 mL the flask is nearly colourless, never green
      await expect(sim.getByText('Nearly colourless (faint Fe²⁺)', { exact: true })).toBeVisible()
      await expect(sim.getByText('Green (Cr³⁺ accumulating)', { exact: true })).toHaveCount(0)

      // Deliver 5.0 mL (mid-titration: 50% of 10.0 mL) -> green from Cr3+
      await sim.getByRole('button', { name: '+5.0 mL' }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Green (Cr³⁺ accumulating)', { exact: true })).toBeVisible()
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-dichromate-mid-${scheme}.png`),
      })

      // Jump to End Point -> intense violet-blue (diphenylamine)
      await sim.getByRole('button', { name: /Jump to End Point/ }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Equivalence Reached', { exact: true })).toBeVisible()
      await expect(sim.getByText('Intense violet-blue', { exact: true })).toBeVisible()
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-dichromate-endpoint-${scheme}.png`),
      })

      // State D: Iodometry with thiosulphate and starch
      await sim.getByRole('radio', { name: 'Iodometry (Cu²⁺ / S₂O₃²⁻)' }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Na₂S₂O₃ vs Cu²⁺ (with excess KI)', { exact: true })).toBeVisible()

      // At 0 mL: brown with I3- and Cu2I2 precipitate; starch is not yet added
      await expect(sim.getByText('Brown (I₃⁻ with Cu₂I₂ precipitate)', { exact: true })).toBeVisible()
      await expect(sim.getByRole('button', { name: 'Add Starch Indicator' })).toBeDisabled()

      // 1. Before starch: deliver 15.0 mL -> fades to pale yellow (75% of 20 mL)
      await sim.getByRole('button', { name: '+5.0 mL' }).click()
      await page.waitForTimeout(200)
      await sim.getByRole('button', { name: '+5.0 mL' }).click()
      await page.waitForTimeout(200)
      await sim.getByRole('button', { name: '+5.0 mL' }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Pale straw yellow (ready for starch)', { exact: true })).toBeVisible()
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-iodometry-before-starch-${scheme}.png`),
      })

      // 2. With starch: click 'Add Starch Indicator' -> turns deep blue-black
      await sim.getByRole('button', { name: 'Add Starch Indicator' }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Deep blue-black (starch–iodine)', { exact: true })).toBeVisible()
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-iodometry-with-starch-${scheme}.png`),
      })

      // 3. End point: Jump to End Point -> blue-black discharges to off-white Cu2I2 suspension
      await sim.getByRole('button', { name: /Jump to End Point/ }).click()
      await page.waitForTimeout(500)
      await expect(sim.getByText('Equivalence Reached', { exact: true })).toBeVisible()
      await expect(sim.getByText('Off-white Cu₂I₂ (blue discharged)', { exact: true })).toBeVisible()
      await expect(sim.getByText('Stoichiometric Deduction of Unknown Concentration')).toBeVisible()
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-3-iodometry-endpoint-${scheme}.png`),
      })

      // Assert no console or page errors
      expect(errors).toEqual([])
    })
  })
}
