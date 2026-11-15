import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-8/8-8-purification-methods'
const ANIMATION = 'purification-methods'
const SIM = 'distillation-lab'
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
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

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, index: number, scheme: string) {
  await gotoStep(page, index)
  await page.waitForTimeout(1800)
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-8-1-purification-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.8 part 1 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('purification Scrolly, distillation lab and checks render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Purification: Sublimation, Crystallisation, Distillation and Extraction')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(6)
      for (let i = 0; i < 6; i++) await shotStep(page, i, scheme)

      // Simulation: default state, then a longer column, then a heated run, then steam mode.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByTestId('distillation-rig')).toBeVisible()
      await page.waitForTimeout(800)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-8-1-distillation-default-${scheme}.png`) })

      await sim.getByLabel('Column', { exact: true }).focus()
      await page.keyboard.press('End')
      await expect(sim.getByText('60 cm', { exact: true })).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-8-1-distillation-column60-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Heat', exact: true }).click()
      await page.waitForTimeout(4000)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-8-1-distillation-heated-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Toluene and water' }).click()
      await expect(sim.getByTestId('steam-panel')).toBeVisible()
      await page.waitForTimeout(800)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-8-1-distillation-steam-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
