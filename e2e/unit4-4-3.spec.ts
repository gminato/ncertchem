import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-4/4-3-bond-parameters'
const SCREEN_DIR = path.join('test-results', 'screens')
const SIM = '[data-simulation="dipole-lab"]'

const SCROLLIES = [
  { animation: 'bond-length-radii', steps: 4, name: 'radii' },
  { animation: 'bond-order-scale', steps: 5, name: 'order' },
  { animation: 'resonance-ozone', steps: 5, name: 'resonance' },
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
  test.describe(`4.3 Bond parameters (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('steps through the Scrolly Animations with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bond Parameters')
      await waitForScrolly(page)

      for (const scrolly of SCROLLIES) {
        const root = page.locator(`[data-animation="${scrolly.animation}"]`)
        await expect(root.locator('[data-scrolly-step]')).toHaveCount(scrolly.steps)
        for (let i = 0; i < scrolly.steps; i++) {
          await gotoStep(page, scrolly.animation, i)
          await page.waitForTimeout(900)
          await root
            .getByTestId('scrolly-visual')
            .screenshot({ path: path.join(SCREEN_DIR, `u4-4-3-${scrolly.name}-step-${i}-${scheme}.png`) })
        }
      }

      // Step 3 of the resonance Scrolly shows the hybrid and hides the two forms.
      await gotoStep(page, 'resonance-ozone', 3)
      await page.waitForTimeout(900)
      await expect(page.locator('[data-layer="hybrid"]')).toHaveAttribute('data-visible', 'true')
      await expect(page.locator('[data-layer="form-I"]')).toHaveAttribute('data-visible', 'false')

      // Step 1 of the bond-length Scrolly places the second atom; Step 0 does not.
      await gotoStep(page, 'bond-length-radii', 0)
      await page.waitForTimeout(900)
      await expect(page.locator('[data-layer="atom-b"]')).toHaveAttribute('data-visible', 'false')
      await gotoStep(page, 'bond-length-radii', 1)
      await page.waitForTimeout(900)
      await expect(page.locator('[data-layer="atom-b"]')).toHaveAttribute('data-visible', 'true')

      expect(errors).toEqual([])
    })

    test('dipole lab: choose a molecule, toggle the lone pair and replay the sum', async ({ page }) => {
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
      await expect(sim.locator('select')).toHaveValue('H2O')
      await page.waitForTimeout(2400)
      await expect(sim.getByText('NCERT Table 4.5: μ = 1.85 D')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-3-dipole-water-${scheme}.png`) })

      // NH3 and NF3: the lone pair decides which one has the larger dipole.
      await sim.locator('select').selectOption('NH3')
      await page.waitForTimeout(2400)
      await expect(sim.getByText('NCERT Table 4.5: μ = 1.47 D')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-3-dipole-nh3-${scheme}.png`) })

      await sim.locator('select').selectOption('NF3')
      await page.waitForTimeout(2400)
      await expect(sim.getByText('NCERT Table 4.5: μ = 0.23 D')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-3-dipole-nf3-${scheme}.png`) })

      // With the lone pair switched off, the bonds alone are summed.
      const toggle = sim.getByRole('switch', { name: 'Lone-pair dipole' })
      await expect(toggle).toHaveAttribute('aria-checked', 'true')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-checked', 'false')
      await page.waitForTimeout(2400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-3-dipole-nf3-off-${scheme}.png`) })

      // A symmetric molecule, CO2, draws a net dipole of zero.
      await sim.locator('select').selectOption('CO2')
      await page.waitForTimeout(2400)
      await expect(sim.getByText('NCERT Table 4.5: μ = 0 D')).toBeVisible()
      await expect(toggle).toBeDisabled()
      await sim.getByRole('button', { name: 'Replay sum' }).click()
      await page.waitForTimeout(2400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-3-dipole-co2-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
