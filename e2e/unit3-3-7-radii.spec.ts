import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-3/3-7-periodic-trends-atomic-and-ionic-radii'

const ANIMATIONS = ['radii-definitions', 'radii-period-two', 'radii-group-one', 'radii-periodic-table', 'radii-ionic']
const STEP_COUNT = 3

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

/** Scrolls the Step with this index in the named Scrolly Animation to the centre of the view. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      el.scrollIntoView({ block: 'center' })
    })
}

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

const TWEEN_WAIT_MS = 1200

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 3.7 radii (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('every Scrolly Step and the isoelectronic Simulation render, with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Periodic Trends: Atomic and Ionic Radii')
      await waitForScrolly(page)

      for (const animation of ANIMATIONS) {
        for (let i = 0; i < STEP_COUNT; i++) {
          await gotoStep(page, animation, i)
          await page.waitForTimeout(TWEEN_WAIT_MS)
          await page.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-${animation}-step${i}-${scheme}.png`) })
        }
      }

      // The isoelectronic Simulation: default state (F⁻ at 10 electrons), then a changed state.
      const sim = page.getByTestId('isoelectronic')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(TWEEN_WAIT_MS)
      await expect(sim.locator('[role="status"]')).toContainText('F⁻: Z = 9 protons, 10 electrons')
      await page.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-isoelectronic-default-${scheme}.png`) })

      // Add a proton with the keyboard: F⁻ morphs through Ne to Na⁺.
      const slider = page.getByRole('slider', { name: /Add a proton/ })
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(TWEEN_WAIT_MS)
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(TWEEN_WAIT_MS)
      await expect(sim.locator('[role="status"]')).toContainText('Na⁺: Z = 11 protons, 10 electrons')
      await page.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-isoelectronic-changed-${scheme}.png`) })

      // Switch to 18 electrons: the series is recomputed, and the readout names the new species.
      await page.getByRole('radiogroup', { name: 'Electron count' }).getByRole('radio', { name: '18' }).click()
      await page.waitForTimeout(TWEEN_WAIT_MS)
      await expect(sim).toHaveAttribute('data-electrons', '18')
      await page.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-isoelectronic-18-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
