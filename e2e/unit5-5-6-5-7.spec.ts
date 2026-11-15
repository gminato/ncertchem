import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_56 = '/class-11/unit-5/5-6-spontaneity'
const SECTION_57 = '/class-11/unit-5/5-7-gibbs-energy-and-equilibrium'

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
    .screenshot({ path: path.join(SCREEN_DIR, `u5-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 5, Sections 5.6 and 5.7 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('5.6 page: entropy, sign-case Scrollies and the explorer render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_56)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Spontaneity, Entropy and Gibbs Energy')

      await waitForScrolly(page, 'gibbs-entropy-phases')
      await expect(page.locator('[data-animation="gibbs-entropy-phases"] [data-scrolly-step]')).toHaveCount(3)
      for (let i = 0; i < 3; i++) await shotStep(page, 'gibbs-entropy-phases', i, '5-6-entropy', scheme)
      await gotoStep(page, 'gibbs-entropy-phases', 1)
      await expect(page.getByTestId('gibbs-entropy-phases').first()).toHaveAttribute('data-step', '1')

      await waitForScrolly(page, 'gibbs-sign-cases')
      await expect(page.locator('[data-animation="gibbs-sign-cases"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'gibbs-sign-cases', i, '5-6-signs', scheme)

      expect(errors, errors.join('\n')).toEqual([])
    })

    test('5.7 page: K ladder Scrolly and the Gibbs explorer render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_57)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gibbs Energy and Equilibrium')

      await waitForScrolly(page, 'gibbs-k-ladder')
      await expect(page.locator('[data-animation="gibbs-k-ladder"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'gibbs-k-ladder', i, '5-7-klad', scheme)

      const sim = page.locator('[data-simulation="gibbs-explorer"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('dg')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-7-explorer-default-${scheme}.png`) })

      // Changed state: switch to the ammonia preset and check its verdict and K readout.
      await sim.getByRole('button', { name: 'NH₃ synthesis' }).click()
      await expect(sim.getByTestId('table-case')).toContainText('only below the crossover')
      await expect(sim.getByTestId('verdict')).toContainText('Spontaneous')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-7-explorer-nh3-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
