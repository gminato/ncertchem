import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-3/3-7-ionization-electron-gain-electronegativity'
const SCREEN_DIR = path.join('test-results', 'screens')

const SCROLLIES = [
  { name: 'ionization', animation: 'ionization-trends', steps: 4, settle: [1600, 2200, 2200, 2400] },
  { name: 'table', animation: 'energetics-table', steps: 4, settle: [2400, 1800, 1800, 1800] },
] as const

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
  test.describe(`Periodic trends Section (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1280, height: 800 } })

    test('steps through every Scrolly Step and the Trends Explorer with no console errors', async ({ page }) => {
      test.setTimeout(240_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Periodic Trends: Ionization Enthalpy, Electron Gain Enthalpy and Electronegativity'
      )
      await waitForScrolly(page)

      for (const scrolly of SCROLLIES) {
        for (let i = 0; i < scrolly.steps; i++) {
          await gotoStep(page, scrolly.animation, i)
          await page.waitForTimeout(scrolly.settle[i])
          await page
            .locator(`[data-animation="${scrolly.animation}"]`)
            .screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-${scrolly.name}-step${i + 1}-${scheme}.png`) })
        }
      }

      const sim = page.locator('[data-simulation="trends-explorer"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-sim-default-${scheme}.png`) })

      await sim.locator('[data-testid="group-header"][data-group="17"]').click()
      await sim.getByRole('switch', { name: 'Trend arrows' }).click()
      await sim.getByRole('radio', { name: 'Electron gain enthalpy' }).click()
      await page.waitForTimeout(2000)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-sim-changed-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
