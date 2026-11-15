import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-6/6-11-1-ionization-kw-and-ph'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one (side layout: anchor 0.4 of the viewport). */
async function gotoStep(page: Page, animation: string, index: number, anchor = 0.4) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, a) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - a * window.innerHeight)
    }, anchor)
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once it is active and settled. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1400)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-${name}-step${index}-${scheme}.png`) })
}

/** Screenshots the Simulation card (stage, readout and controls) in its current state. */
async function shotSim(page: Page, name: string, state: string, scheme: string) {
  const lab = page.locator(`[data-simulation="${name}"]`)
  await lab.scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)
  await lab.screenshot({ path: path.join(SCREEN_DIR, `u6-${state}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Section 6.11 part 1 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Section 6.11.1 and 6.11.2: every pH Step and the explorer render, with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ionization of Acids and Bases: Kw and pH')

      const root = await waitForScrolly(page, 'ph-scale')
      await expect(root.locator('[data-scrolly-step]')).toHaveCount(6)
      for (let i = 0; i < 6; i++) await shotStep(page, 'ph-scale', i, '6-11-1-ph', scheme)

      // Step 5 (pure water at 310 K): the visual reports the neutral pH and its verdict.
      await gotoStep(page, 'ph-scale', 4)
      await expect(page.getByTestId('ph-ladder')).toHaveAttribute('data-step', '4')

      // Explorer: default state (0.010 mol L⁻¹ HCl at 298 K, which is pH 2.00 exact).
      const lab = page.locator('[data-simulation="ph-explorer"]')
      await expect(lab.getByTestId('ph-value')).toContainText('pH 2.000')
      await expect(lab.getByTestId('ph-kw')).toContainText('1.0 × 10⁻¹⁴')
      await shotSim(page, 'ph-explorer', '6-11-1-explorer-default', scheme)

      // Dilute to 10⁻⁹ mol L⁻¹: the water term keeps the pH below 7.
      for (let i = 0; i < 7; i++) await lab.getByTestId('ph-dilute').click()
      await expect(lab.getByTestId('ph-label')).toHaveText('1.0 × 10⁻⁹ M HCl')
      await expect(lab.getByTestId('ph-value')).toContainText('pH 6.998')
      await expect(lab.getByTestId('ph-water-share')).toContainText('the water term is more than 5 % of the total')
      await shotSim(page, 'ph-explorer', '6-11-1-explorer-1e-9', scheme)

      // Heat to 310 K: Kw and the neutral pH change, and the verdict stays neutral for pure water.
      await lab.getByLabel('Temperature').fill('310')
      await expect(lab.getByTestId('ph-kw')).toContainText('2.4 × 10⁻¹⁴')
      await expect(lab.getByTestId('ph-kw')).toContainText('neutral pH 6.81')
      await shotSim(page, 'ph-explorer', '6-11-1-explorer-310k', scheme)

      // Common substances, on the same scale.
      await lab.getByRole('switch', { name: 'Show common substances' }).click()
      await expect(lab.getByTestId('ph-substances')).toContainText('Lemon juice')
      await shotSim(page, 'ph-explorer', '6-11-1-explorer-substances', scheme)

      // Base at 1.0 × 10⁻⁴ mol L⁻¹ NaOH after switching the solute.
      await lab.getByRole('radio', { name: 'Strong base (NaOH)' }).click()
      await lab.getByTestId('ph-concentrate').click()
      await lab.getByTestId('ph-concentrate').click()
      await lab.getByTestId('ph-concentrate').click()
      await expect(lab.getByTestId('ph-label')).toHaveText('1.0 × 10⁻⁶ M NaOH')

      expect(errors).toEqual([])
    })
  })
}
