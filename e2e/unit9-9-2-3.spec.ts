import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-2-3-properties-of-alkanes'
const ANIMATION = 'radical-chain'
const SIM = 'halogenation-lab'
const STEP_NAMES = ['initiation', 'propagation', 'chain', 'termination', 'shape'] as const
const DEFAULT_FRACTION = 0.4

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
  test.describe(`Unit 9, Section 9.2.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the halogenation lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Properties of Alkanes')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(5)
      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(800)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-3-${STEP_NAMES[i]}-${scheme}.png`) })
      }

      // Simulation, default state: propane with Cl2, statistical split.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('halogen-panel')).toBeVisible()
      await expect(sim.getByTestId('halogen-readout')).toContainText('75% 1-chloropropane')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-3-halogenation-lab-default-${scheme}.png`) })

      // Changed state 1: 2-methylbutane with Br2, reactivity order.
      await sim.getByRole('combobox', { name: 'Alkane' }).selectOption('2-methylbutane')
      await sim.getByRole('radio', { name: /Br/ }).click()
      await sim.getByRole('radio', { name: 'With 3° > 2° > 1°' }).click()
      await expect(sim.getByTestId('halogen-readout')).toContainText('no ratio')
      await expect(sim.getByTestId('halogen-panel')).toHaveAttribute('data-halogen', 'Br')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-3-halogenation-lab-reactivity-${scheme}.png`) })

      // Changed state 2: the combustion tab with n = 8.
      await sim.getByRole('radio', { name: 'Combustion' }).click()
      await sim.getByRole('slider').fill('8')
      await expect(sim.getByTestId('combustion-readout')).toContainText('12.5 mol of O₂')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-3-halogenation-lab-combustion-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
