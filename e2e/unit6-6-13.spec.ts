import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-6/6-13-solubility-equilibria-of-sparingly-soluble-salts'
const ANIMATION = 'solubility-product'
const SIM = 'precipitation-lab'
const STEP_COUNT = 5
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
  await page.waitForTimeout(1500)
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-6-13-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Section 6.13 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('6.13 page: five Scrolly Steps and the Precipitation Lab render, with values from the lib and no console errors', async ({ page }) => {
      test.setTimeout(480_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Solubility Equilibria of Sparingly Soluble Salts')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) await shotStep(page, i, scheme)

      // Step 2 (saturation): S = 1.05 × 10⁻⁵ from Ksp = 1.1 × 10⁻¹⁰.
      const visual = `[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`
      await gotoStep(page, 1)
      await expect(page.locator(visual)).toContainText('1.05')

      // Step 4 (common ion): the lib gives S = 1.10 × 10⁻⁸ in 0.010 M sulphate.
      await gotoStep(page, 3)
      await expect(page.locator(visual)).toContainText('1.10')

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()

      // Default: Ag⁺ with Cl⁻ at 2.0 × 10⁻⁴ M each gives Qsp = 1.0 × 10⁻⁸, above Ksp = 1.8 × 10⁻¹⁰.
      await expect(sim.getByTestId('lab-qsp')).toContainText('1.0 × 10⁻⁸')
      await expect(sim.getByTestId('lab-ksp')).toContainText('1.8 × 10⁻¹⁰ (AgCl)')
      await expect(sim.getByTestId('lab-verdict')).toContainText('precipitate forms')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-13-lab-default-${scheme}.png`) })

      // Pb²⁺ with I⁻ at 2.0 × 10⁻⁴ M each: [Pb²⁺] = 1.0 × 10⁻⁴, [I⁻] = 1.0 × 10⁻⁴, so Qsp = 1.0 × 10⁻¹², below Ksp = 7.1 × 10⁻⁹.
      await sim.getByRole('radio', { name: 'Pb²⁺ (Pb(NO₃)₂)' }).click()
      await sim.getByRole('radio', { name: 'I⁻ (KI)' }).click()
      await expect(sim.getByTestId('lab-qsp')).toContainText('1.0 × 10⁻¹²')
      await expect(sim.getByTestId('lab-ksp')).toContainText('7.1 × 10⁻⁹ (PbI2)')
      await expect(sim.getByTestId('lab-verdict')).toContainText('no precipitate')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-13-lab-no-precipitate-${scheme}.png`) })

      // Ba²⁺ with Cl⁻: Table 6.9 lists no salt, so the lab says there is no Ksp to compare.
      await sim.getByRole('radio', { name: 'Ba²⁺ (BaCl₂)' }).click()
      await sim.getByRole('radio', { name: 'Cl⁻ (NaCl)' }).click()
      await expect(sim.getByTestId('lab-verdict')).toContainText('no Ksp to compare')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-13-lab-no-salt-${scheme}.png`) })

      // Common ion: BaSO₄ with 0.010 M sulphate added gives S = 1.10 × 10⁻⁸ mol L⁻¹.
      await sim.getByRole('radio', { name: 'BaSO₄' }).click()
      await sim.getByLabel('Added common ion').focus()
      for (let i = 0; i < 4; i++) await sim.getByLabel('Added common ion').press('ArrowRight')
      await expect(sim.getByTestId('lab-solubility')).toContainText('1.10 × 10⁻⁸')
      await expect(sim.getByTestId('lab-solubility')).toContainText('1.05 × 10⁻⁵')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-13-lab-common-ion-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
