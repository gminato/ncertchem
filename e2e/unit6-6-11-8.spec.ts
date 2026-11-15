import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-6/6-11-8-common-ion-salt-hydrolysis-buffers'
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
  test.describe(`Unit 6, Section 6.11.8 with 6.11.9 and 6.12 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('common ion, hydrolysis and buffer Sections render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Common Ion Effect, Salt Hydrolysis and Buffer Solutions'
      )

      await waitForScrolly(page, 'buffer-action')
      await expect(page.locator('[data-animation="buffer-action"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'buffer-action', i, '6-12-buffer', scheme)

      const sim = page.locator('[data-simulation="buffer-designer"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('ph-start')).toContainText('4.76')
      await expect(sim.getByTestId('ph-buffer')).toContainText('4.76')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-12-sim-default-${scheme}.png`) })

      // Changed state 1: two HCl steps of 0.5 mmol each (1.0 mmol) on the acetic acid buffer, and the NH4+/NH3 pair.
      await sim.getByRole('button', { name: 'Add 0.5 mmol HCl' }).click()
      await sim.getByRole('button', { name: 'Add 0.5 mmol HCl' }).click()
      await sim.getByRole('button', { name: 'Add 0.5 mmol HCl' }).click()
      await sim.getByRole('button', { name: 'Add 0.5 mmol HCl' }).click()
      await expect(sim.getByTestId('ph-buffer')).toContainText('4.58')
      await expect(sim.getByTestId('ph-water')).toContainText('1.70')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-12-sim-acid-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'NH₄⁺ / NH₃' }).click()
      await sim.getByRole('button', { name: 'Reset' }).click()
      // The default 1:1 ammonia buffer sits at pKa(NH4+) = 9.25.
      await expect(sim.getByTestId('ph-start')).toContainText('9.25')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-12-sim-ammonia-${scheme}.png`) })

      // Changed state 2: the salt tab, with NH4Cl at 0.10 M, pH 5.12.
      await sim.getByRole('radio', { name: 'Salt hydrolysis' }).click()
      await sim.getByRole('radio', { name: 'NH₄Cl' }).click()
      await expect(sim.getByTestId('salt-ph')).toContainText('5.12')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-12-sim-salt-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
