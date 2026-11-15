import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-8/8-10-quantitative-analysis'
const ANIMATION = 'combustion-analysis'
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
  test.describe(`Unit 8, Section 8.10 Quantitative analysis (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the Elemental analyser render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quantitative Analysis')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(4)
      for (let i = 0; i < 4; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1800)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u8-8-10-scrolly-step${i}-${scheme}.png`) })
      }

      // The Simulation: default state, then a run, then a nitro compound with the Dumas method.
      const sim = page.locator('[data-simulation="elemental-analyser"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByTestId('elemental-analyser')).toBeVisible()
      await page.waitForTimeout(400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-10-sim-default-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Run analysis' }).click()
      await page.waitForTimeout(1800)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-10-sim-run-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Nitrogen' }).click()
      await sim.getByRole('button', { name: 'nitrobenzene' }).click()
      await sim.getByRole('button', { name: 'Run analysis' }).click()
      await page.waitForTimeout(1800)
      await sim.getByRole('button', { name: 'Nitrogen', exact: true }).click()
      await expect(sim.getByTestId('kjeldahl-warning')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-10-sim-nitro-${scheme}.png`) })

      // Ethyl ethanoate: enter the true percentages and check the empirical formula.
      await sim.getByRole('button', { name: 'ethyl ethanoate' }).click()
      await sim.getByRole('button', { name: 'Run analysis' }).click()
      await page.waitForTimeout(1800)
      await sim.getByRole('button', { name: 'C and H' }).click()
      await sim.locator('#entry-C').fill('54.53')
      await sim.locator('#entry-H').fill('9.15')
      await expect(sim.getByTestId('empirical-label')).toHaveText('C2H4O')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-10-sim-empirical-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
