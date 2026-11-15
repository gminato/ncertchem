import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-6/6-11-3-weak-acids-and-weak-bases'
const SCROLLY = 'weak-acid'
const SIM = 'weak-acid-lab'
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
    .screenshot({ path: path.join(SCREEN_DIR, `u6-6-11-3-scrolly-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Section 6.11.3 (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })
    test.setTimeout(150_000)

    test('weak acid Scrolly and weak acid lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Weak Acids and Weak Bases')

      await waitForScrolly(page, SCROLLY)
      await expect(page.locator(`[data-animation="${SCROLLY}"] [data-scrolly-step]`)).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) await shotStep(page, i, scheme)

      // Weak acid lab: default state (acetic acid at 0.100 mol L⁻¹), then other species and modes.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('summary')).toContainText('Acetic acid')
      await expect(sim.getByTestId('ph-approx')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-11-3-sim-default-${scheme}.png`) })

      // Hydrofluoric acid at the same concentration: a stronger acid, so the shortcut is tested again.
      await sim.locator('select').selectOption({ label: 'Hydrofluoric acid, HF' })
      await expect(sim.getByTestId('summary')).toContainText('Hydrofluoric acid')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-11-3-sim-hf-${scheme}.png`) })

      // Weak base mode: dimethylamine, the shortcut fails at this concentration.
      await sim.getByRole('radio', { name: 'Weak base' }).click()
      await sim.locator('select').selectOption({ label: 'Dimethylamine, (CH₃)₂NH' })
      await expect(sim.getByTestId('verdict')).toContainText('Shortcut')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-11-3-sim-base-${scheme}.png`) })

      // Polyprotic mode: oxalic acid species fractions against pH.
      await sim.getByRole('radio', { name: 'Polyprotic acid' }).click()
      await expect(sim.getByTestId('species-chart')).toBeVisible()
      await expect(sim.getByTestId('dominant')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-11-3-sim-polyprotic-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
