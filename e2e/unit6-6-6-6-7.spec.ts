import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_66 = '/class-11/unit-6/6-6-applications-of-equilibrium-constants'
const SECTION_67 = '/class-11/unit-6/6-7-k-q-and-gibbs-energy'

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
    .screenshot({ path: path.join(SCREEN_DIR, `u6-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Sections 6.6 and 6.7 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('6.6 page: Q and K Scrolly, ICE Scrolly and the ICE solver render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_66)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Applications of Equilibrium Constants')

      await waitForScrolly(page, 'q-and-k')
      await expect(page.locator('[data-animation="q-and-k"] [data-scrolly-step]')).toHaveCount(3)
      for (let i = 0; i < 3; i++) await shotStep(page, 'q-and-k', i, '6-6-qk', scheme)

      await waitForScrolly(page, 'ice-method')
      await expect(page.locator('[data-animation="ice-method"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'ice-method', i, '6-6-ice', scheme)

      const sim = page.locator('[data-simulation="ice-solver"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('q-check')).toContainText('Q = K')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-6-sim-default-${scheme}.png`) })

      // Changed state 1: Kp, pressure-based, with 2SO2 + O2 ⇌ 2SO3.
      await sim.getByRole('button', { name: '2SO₂ + O₂ ⇌ 2SO₃ (Kp)' }).click()
      await expect(sim.locator('[data-preset="so3"]')).toHaveCount(1)
      await expect(sim.getByTestId('x-value')).toContainText('bar')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-6-sim-so3-${scheme}.png`) })

      // Changed state 2: products only, 2HI ⇌ H2 + I2.
      await sim.getByRole('button', { name: '2HI ⇌ H₂ + I₂' }).click()
      await expect(sim.locator('[data-preset="hi"]')).toHaveCount(1)
      await expect(sim.getByTestId('q-start')).toContainText('forward')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-6-sim-hi-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })

    test('6.7 page: Gibbs Scrolly and the Gibbs panel render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_67)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Relationship between Equilibrium Constant K, Reaction Quotient Q and Gibbs Energy G'
      )

      await waitForScrolly(page, 'qk-gibbs')
      await expect(page.locator('[data-animation="qk-gibbs"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'qk-gibbs', i, '6-7-gibbs', scheme)

      const sim = page.locator('[data-simulation="ice-solver"]').last()
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('dg0')).toContainText('kJ mol⁻¹')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-7-gibbs-default-${scheme}.png`) })

      // Changed state: N2O4 ⇌ 2NO2 with Kc = 0.20 gives a positive ΔG° at 298 K.
      await sim.getByRole('button', { name: 'N₂O₄ ⇌ 2NO₂' }).click()
      await expect(sim.getByTestId('dg0')).toContainText('+3.99 kJ mol⁻¹')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-7-gibbs-nocl-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
