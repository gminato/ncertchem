import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-8/8-8-5-chromatography'
const ANIMATION = 'chromatography'
const SIM = 'tlc-lab'
const STEP_NAMES = ['column-eluting', 'column-fractions', 'tlc-spotted', 'tlc-measured', 'tlc-iodine', 'paper'] as const
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

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.8.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the TLC and column lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chromatography')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(6)
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1800)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-${STEP_NAMES[i]}-${scheme}.png`) })
      }

      // Simulation, default state: three spots (R, B, C), solvent 0.40, plate not yet developed.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('tlc-plate')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-tlc-lab-default-${scheme}.png`) })

      // Changed state 1: develop the plate, then identify the unknown in the same solvent.
      await sim.getByRole('switch', { name: 'Red dye' }).click()
      await sim.getByRole('switch', { name: 'Unknown (identity hidden)' }).click()
      await sim.getByRole('button', { name: 'Develop plate' }).click()
      await expect(sim.getByRole('slider', { name: 'Solvent front', exact: true })).toHaveValue('1', { timeout: 8000 })
      await sim.getByRole('radiogroup', { name: 'Spot to measure' }).getByRole('radio', { name: 'U', exact: true }).click()
      await sim.getByTestId('spot-marker').focus()
      for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowDown')
      await expect(sim.getByTestId('identify')).toContainText('Closest standard: Blue dye')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-tlc-lab-identify-${scheme}.png`) })
      await sim.getByRole('button', { name: 'Reveal the unknown' }).click()
      await expect(sim.getByTestId('reveal')).toContainText('blue dye')

      // Changed state 2: a more polar solvent. The marker is no longer on U, so no standard is named yet.
      await sim.getByRole('slider', { name: 'Solvent strength', exact: true }).fill('0.9')
      await expect(sim.getByTestId('identify')).toContainText('Move the spot marker to the centre of spot U first')
      await expect(sim.getByTestId('identify')).not.toContainText('Closest standard')
      await sim.getByRole('radio', { name: 'Iodine' }).click()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-tlc-lab-polar-iodine-${scheme}.png`) })

      // Changed state 3: column mode, eluted into fraction tubes.
      await sim.getByRole('radio', { name: 'Column' }).click()
      await sim.getByRole('button', { name: 'Elute column' }).click()
      await expect(sim.getByRole('slider', { name: 'Eluent progress', exact: true })).toHaveValue('1', { timeout: 8000 })
      await expect(sim.getByTestId('column-readout')).toContainText('F1')
      await expect(sim.getByTestId('column-readout')).toContainText('B and U together')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-tlc-lab-column-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
