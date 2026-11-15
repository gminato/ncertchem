import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-6/6-1-equilibrium-in-physical-processes'
const SCROLLY = 'physical-equilibria'
const SIM = 'sealed-container-lab'
const STEP_COUNT = 5
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
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tweens have finished. */
async function shotStep(page: Page, index: number, scheme: string) {
  await gotoStep(page, SCROLLY, index)
  await page.waitForTimeout(1800)
  await page
    .locator(`[data-animation="${SCROLLY}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-scrolly-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Section 6.1 (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })
    // Five Scrolly Steps, two runs of the sealed box and the soda bottle take longer than the default 30 s.
    test.setTimeout(150_000)

    test('physical equilibria Scrolly and sealed container lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Equilibrium in Physical Processes')

      await waitForScrolly(page, SCROLLY)
      await expect(page.locator(`[data-animation="${SCROLLY}"] [data-scrolly-step]`)).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) await shotStep(page, i, scheme)

      // Sealed box lab: default state, then the box run to equilibrium, then ethanol and the soda bottle.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('p-star')).toContainText('23.7 mmHg')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-sim-default-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Play' }).click()
      await expect(sim.getByTestId('verdict')).toContainText('Equal rates', { timeout: 20000 })
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-sim-equilibrium-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Ethanol' }).click()
      await expect(sim.getByTestId('p-star')).toContainText('ethanol at 25 °C')
      await sim.getByRole('button', { name: 'Play' }).click()
      await expect(sim.getByTestId('verdict')).toContainText('Equal rates', { timeout: 20000 })
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-sim-ethanol-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Soda bottle' }).click()
      await expect(sim.getByTestId('k-h')).toContainText('0.034')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-sim-soda-sealed-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Open the cap' }).click()
      await expect(sim.getByTestId('p-co2')).toContainText('air holds', { timeout: 20000 })
      await page.waitForTimeout(2500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-sim-soda-open-${scheme}.png`) })
      // The relaxation takes about 14 s; the settled reading is near 1.4 × 10⁻⁵ mol L⁻¹.
      await expect(sim.getByTestId('c-now')).toContainText('× 10⁻⁵', { timeout: 25000 })
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-1-sim-soda-settled-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
