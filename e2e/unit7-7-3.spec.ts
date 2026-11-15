import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-7/7-3-oxidation-number'
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has settled. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(600)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u7-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7, Section 7.3 (${scheme})`, () => {
    test.use({
      colorScheme: scheme,
      viewport: { width: 1440, height: 900 },
    })

    test('renders Scrolly steps and simulation states with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Oxidation Number')

      // Scrolly: redox-on-rules
      await waitForScrolly(page, 'redox-on-rules')
      const stepCount = 6
      await expect(
        page.locator('[data-animation="redox-on-rules"] [data-scrolly-step]')
      ).toHaveCount(stepCount)

      for (let i = 0; i < stepCount; i++) {
        await shotStep(page, 'redox-on-rules', i, '7-3-onrules', scheme)
      }

      // Check step 3 (K2Cr2O7 solved)
      await gotoStep(page, 'redox-on-rules', 3)
      await expect(
        page.locator('[data-animation="redox-on-rules"] [data-testid="redox-on-rules-svg"]')
      ).toHaveAttribute('data-step', '3')

      // Check step 5 (BaO2 peroxide trap confirmed)
      await gotoStep(page, 'redox-on-rules', 5)
      await expect(
        page.locator('[data-animation="redox-on-rules"] [data-testid="redox-on-rules-svg"]')
      ).toHaveAttribute('data-step', '5')

      // Simulation: oxidation-number-finder
      const sim = page.locator('[data-simulation="oxidation-number-finder"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.locator('[data-testid="oxidation-stage-svg"]')).toBeVisible()
      await page.waitForTimeout(400)

      // Default State (K2Cr2O7) screenshot
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-sim-default-${scheme}.png`),
      })
      await expect(sim.locator('[data-testid="sum-check-readout"]')).toBeVisible()

      // State 1: Superoxide trap KO2
      await sim.getByTestId('preset-ko2').click()
      await expect(sim.locator('[data-testid="oxidation-stage-svg"]')).toBeVisible()
      await expect(sim.locator('[data-testid="sum-check-readout"]')).toContainText('0')
      await page.waitForTimeout(400)
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-sim-ko2-${scheme}.png`),
      })

      // State 2: By-site salt NH4NO3
      await sim.getByTestId('preset-nh4no3').click()
      await expect(sim.locator('[data-testid="sites-breakdown-section"]')).toBeVisible()
      await expect(sim.locator('[data-testid="site-card-0"]')).toBeVisible()
      await sim.getByRole('radio', { name: 'By-Site Breakdown' }).click()
      await page.waitForTimeout(400)
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-3-sim-nh4no3-${scheme}.png`),
      })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
