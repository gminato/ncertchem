import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-2/2-3-developments-leading-to-bohr-model'
const SCREEN_DIR = path.join('test-results', 'screens')
const SCROLLIES = ['wave-nature', 'black-body', 'line-spectra'] as const

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).first()
  ).toHaveAttribute('data-active', 'true')
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
  test.describe(`Unit 2 Section 2.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('every Scrolly Step renders and the Section has no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        "Developments Leading to the Bohr's Model of Atom"
      )
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(12)

      const names: Record<string, string> = {
        'wave-nature': 'wave',
        'black-body': 'blackbody',
        'line-spectra': 'lines',
      }

      for (const animation of SCROLLIES) {
        await waitForScrolly(page, animation)
        const count = await page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).count()
        for (let i = 0; i < count; i++) {
          await gotoStep(page, animation, i)
          await page.waitForTimeout(900)
          const visual = page.locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
          await visual.screenshot({
            path: path.join(SCREEN_DIR, `u2-2-3-${names[animation]}-step${i}-${scheme}.png`),
          })
        }
      }

      await expect(page.getByTestId('wave-nature')).toHaveAttribute('data-step', '3')
      await expect(page.getByTestId('black-body')).toHaveAttribute('data-step', '3')
      await expect(page.getByTestId('line-spectra')).toHaveAttribute('data-step', '3')

      expect(errors).toEqual([])
    })

    test('the photoelectric Simulation: default and changed states, no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      const sim = page.locator('[data-simulation="photoelectric"]')
      await sim.scrollIntoViewIfNeeded()
      await page.evaluate(() => document.fonts.ready)
      await expect(sim.getByTestId('photo-stage')).toBeVisible()

      // Default: potassium at 400 nm, above threshold.
      await expect(sim.getByTestId('photo-banner')).toContainText('Above threshold')
      await page.waitForTimeout(2500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-3-photoelectric-default-${scheme}.png`) })

      // Changed: potassium at 600 nm, full intensity: below threshold, no electrons.
      await sim.getByRole('radio', { name: 'K' }).click()
      await sim.getByRole('slider', { name: 'Wavelength λ' }).fill('600')
      await sim.getByRole('slider', { name: 'Intensity' }).fill('100')
      await expect(sim.getByTestId('photo-banner')).toHaveText('Below threshold: 0 electrons, at any intensity.')
      await expect(sim.getByTestId('photo-stage')).toHaveAttribute('data-emitted', 'false')
      await page.waitForTimeout(2500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-3-photoelectric-below-${scheme}.png`) })

      // Changed: silver at 250 nm, above its threshold of about 288 nm, so electrons leave.
      await sim.getByRole('radio', { name: 'Ag' }).click()
      await sim.getByRole('slider', { name: 'Wavelength λ' }).fill('250')
      await expect(sim.getByTestId('photo-stage')).toHaveAttribute('data-emitted', 'true')
      await page.waitForTimeout(2500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-3-photoelectric-above-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
