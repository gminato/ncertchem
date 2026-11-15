import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_62 = '/class-11/unit-6/6-2-dynamic-equilibrium'
const SECTION_63 = '/class-11/unit-6/6-3-law-of-chemical-equilibrium'
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

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1800)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-${name}-step${index + 1}-${scheme}.png`) })
}

/** Screenshots the Simulation card, after its curves have finished drawing in. */
async function shotSim(page: Page, name: string, scheme: string) {
  const sim = page.locator('[data-simulation="approach-to-equilibrium"]')
  await sim.scrollIntoViewIfNeeded()
  await page.waitForTimeout(2800)
  await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-2-sim-${name}-${scheme}.png`) })
  return sim
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Sections 6.2 and 6.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('6.2 page: five dynamic-equilibrium Steps and the approach Simulation render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_62)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Equilibrium in Chemical Processes: Dynamic Equilibrium')

      await waitForScrolly(page, 'unit6-dynamic-equilibrium')
      await expect(page.locator('[data-animation="unit6-dynamic-equilibrium"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'unit6-dynamic-equilibrium', i, '6-2-dynamic', scheme)

      // Default state.
      const sim = await shotSim(page, 'default', scheme)
      await expect(sim.getByTestId('approach-summary')).toContainText('K = 46.7')

      // Changed state 1: the N2 + 3H2 reaction, started from products.
      await sim.getByRole('radio', { name: 'N₂ + 3H₂ ⇌ 2NH₃' }).click()
      await sim.getByRole('radio', { name: 'Products' }).click()
      await expect(sim.getByTestId('approach-k')).toContainText('K = 62.2')
      await shotSim(page, 'nh3-products', scheme)

      // Changed state 2: the SO2 reaction, with the Q readout at the end of the run.
      await sim.getByRole('radio', { name: 'Reactants' }).click()
      await sim.getByRole('radio', { name: '2SO₂ + O₂ ⇌ 2SO₃' }).click()
      await expect(sim.getByTestId('approach-k')).toContainText('K = 1.75 × 10⁶')
      await shotSim(page, 'so3-reactants', scheme)

      expect(errors, errors.join('\n')).toEqual([])
    })

    test('6.3 page: five mass-action Steps render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_63)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Law of Chemical Equilibrium and Equilibrium Constant')

      await waitForScrolly(page, 'unit6-mass-action')
      await expect(page.locator('[data-animation="unit6-mass-action"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'unit6-mass-action', i, '6-3-mass', scheme)

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
