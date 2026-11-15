import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_44 = '/class-11/unit-6/6-4-homogeneous-equilibria'
const SECTION_45 = '/class-11/unit-6/6-5-heterogeneous-equilibria'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/**
 * Moves the page so the Step is the active one. The side layout activates a Step near the middle of
 * the view (anchor 0.4); the wide layout activates the last Step above 97% of the view, so a Step must
 * sit higher (anchor 0.8) for the next one, 342 px lower, to stay inactive.
 */
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
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string, anchor = 0.4) {
  await gotoStep(page, animation, index, anchor)
  await page.waitForTimeout(1400)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-${name}-step${index}-${scheme}.png`) })
}

/** Screenshots the Simulation card (stage and controls) in its current state. */
async function shotSim(page: Page, name: string, state: string, scheme: string) {
  const lab = page.locator(`[data-simulation="${name}"]`)
  await lab.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await lab.screenshot({ path: path.join(SCREEN_DIR, `u6-${state}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Sections 6.4 and 6.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Section 6.4: every Kp–Kc Step and the converter render, with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_44)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Homogeneous Equilibria')

      const root = await waitForScrolly(page, 'kp-kc')
      await expect(root.locator('[data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'kp-kc', i, '6-4-kpkc', scheme)
      await gotoStep(page, 'kp-kc', 2)
      await expect(page.locator('[data-testid="kp-kc"]')).toHaveAttribute('data-step', '2')

      // Converter: default state (N2 + 3H2 at 500 K), then 2NOCl, then a gas-free equation
      const lab = page.locator('[data-simulation="kp-kc-converter"]')
      await expect(lab.getByTestId('kpkc-live')).toHaveText(
        'Kc = 2.00 at 500 K gives Kp = 1.16 × 10⁻³ bar, with Δn = −2.'
      )
      await shotSim(page, 'kp-kc-converter', '6-4-converter-default', scheme)

      await lab.getByTestId('kpkc-preset').selectOption('nocl')
      await expect(lab.getByTestId('kpkc-live')).toHaveText(
        'Kc = 0.0250 at 500 K gives Kp = 1.04 bar, with Δn = +1.'
      )
      await expect(lab.getByTestId('kpkc-excluded')).toHaveCount(0)
      await shotSim(page, 'kp-kc-converter', '6-4-converter-nocl', scheme)

      await lab.getByTestId('kpkc-preset').selectOption('no-gas')
      await expect(lab.getByTestId('kpkc-excluded')).toBeVisible()
      await expect(lab.getByTestId('kpkc-live')).toContainText('Kp is defined only when a species is a gas')
      await shotSim(page, 'kp-kc-converter', '6-4-converter-no-gas', scheme)

      expect(errors).toEqual([])
    })

    test('Section 6.5: every heterogeneous Step and the CaCO₃ converter render, with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_45)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Heterogeneous Equilibria')

      const root = await waitForScrolly(page, 'heterogeneous')
      await expect(root.locator('[data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'heterogeneous', i, '6-5-het', scheme, 0.8)
      await gotoStep(page, 'heterogeneous', 2, 0.8)
      await expect(page.locator('[data-testid="het-vessel-A"]')).toHaveAttribute('data-solid-present', 'true')

      const lab = page.locator('[data-simulation="heterogeneous-converter"]')
      await expect(lab.getByTestId('kpkc-live')).toHaveText(
        'Kc = 0.0219 at 1100 K gives Kp = 2.00 bar, with Δn = +1.'
      )
      await expect(lab.getByTestId('kpkc-excluded')).toContainText('CaCO3')
      await shotSim(page, 'heterogeneous-converter', '6-5-converter-default', scheme)

      await lab.getByTestId('kpkc-preset').selectOption('water')
      await expect(lab.getByTestId('kpkc-excluded')).toContainText('H2O')
      await expect(lab.getByTestId('kpkc-kp-expression')).toBeVisible()
      await shotSim(page, 'heterogeneous-converter', '6-5-converter-water', scheme)

      await lab.getByTestId('kpkc-preset').selectOption('ni')
      await expect(lab.getByTestId('kpkc-excluded')).toContainText('Ni')
      await shotSim(page, 'heterogeneous-converter', '6-5-converter-nickel', scheme)

      expect(errors).toEqual([])
    })
  })
}
