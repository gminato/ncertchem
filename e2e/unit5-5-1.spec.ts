import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-5/5-1-thermodynamic-terms'
const SCREEN_DIR = path.join('test-results', 'screens')
const SIM = '[data-simulation="first-law-lab"]'

const SCROLLIES = [
  { animation: 'thermo-system-types', steps: 4, name: 'system-types' },
  { animation: 'thermo-state-function', steps: 4, name: 'state-function' },
  { animation: 'thermo-joule', steps: 5, name: 'joule' },
] as const

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      el.scrollIntoView({ block: 'center' })
    })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`5.1 Thermodynamic terms (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('steps through the three Scrolly Animations with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thermodynamic Terms')
      await waitForScrolly(page)

      for (const scrolly of SCROLLIES) {
        const root = page.locator(`[data-animation="${scrolly.animation}"]`)
        await expect(root.locator('[data-scrolly-step]')).toHaveCount(scrolly.steps)
        for (let i = 0; i < scrolly.steps; i++) {
          await gotoStep(page, scrolly.animation, i)
          await page.waitForTimeout(1100)
          await root
            .getByTestId('scrolly-visual')
            .screenshot({ path: path.join(SCREEN_DIR, `u5-5-1-${scrolly.name}-step-${i}-${scheme}.png`) })
        }
      }

      // The system type follows the Step: open at Step 2, isolated at Step 4.
      await gotoStep(page, 'thermo-system-types', 1)
      await page.waitForTimeout(700)
      await expect(page.getByTestId('thermo-system-types')).toHaveAttribute('data-kind', 'open')
      await gotoStep(page, 'thermo-system-types', 3)
      await page.waitForTimeout(700)
      await expect(page.getByTestId('thermo-system-types')).toHaveAttribute('data-kind', 'isolated')

      // The Joule Scrolly's last Step is an expanding gas: the work done by the system is negative.
      await gotoStep(page, 'thermo-joule', 4)
      await page.waitForTimeout(1200)
      await expect(page.getByTestId('thermo-joule')).toHaveAttribute('data-step', '4')

      expect(errors).toEqual([])
    })

    test('first law lab: heat, insulation, a piston move, and the two-paths view', async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await waitForScrolly(page)
      const sim = page.locator(SIM)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(600)
      const ledger = sim.getByLabel('Energy ledger')
      await expect(ledger.getByText('0 J', { exact: true }).first()).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-1-lab-default-${scheme}.png`) })

      // Heat at constant volume: q = +200 J, w = 0, ΔU = +200 J, and the check matches.
      await sim.getByRole('button', { name: 'Add 200 J of heat' }).click()
      await expect(ledger.getByText('+200 J', { exact: true })).toHaveCount(3)
      await page.waitForTimeout(900)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-1-lab-heat-${scheme}.png`) })

      // Insulated walls block heat: the heat buttons are disabled.
      await sim.getByRole('switch', { name: 'Insulated walls (adiabatic)' }).click()
      await expect(sim.getByRole('button', { name: 'Add 200 J of heat' })).toBeDisabled()
      await expect(sim.getByRole('button', { name: 'Remove 200 J of heat' })).toBeDisabled()

      // A piston move with insulated walls: q = 0, so ΔU = w.
      await sim.getByRole('button', { name: 'Let the piston move' }).click()
      await expect(sim.locator('p[aria-live="polite"]').first()).toContainText('q = 0')
      await page.waitForTimeout(1000)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-1-lab-piston-${scheme}.png`) })

      // Isolated: no move is possible, and the piston button is disabled.
      await sim.getByRole('switch', { name: 'Isolated: nothing crosses' }).click()
      await expect(sim.getByRole('button', { name: 'Let the piston move' })).toBeDisabled()
      await page.waitForTimeout(800)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-1-lab-isolated-${scheme}.png`) })

      // Back to free play with the walls open. Two paths: the same ΔU by two routes.
      await sim.getByRole('switch', { name: 'Isolated: nothing crosses' }).click()
      await sim.getByRole('switch', { name: 'Insulated walls (adiabatic)' }).click()
      await sim.getByRole('radio', { name: 'Two paths' }).click()
      await expect(sim.locator('table')).toBeVisible()
      await expect(sim.locator('table').getByText('+1000 J', { exact: true })).toHaveCount(3)
      await page.waitForTimeout(1000)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-1-lab-paths-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
