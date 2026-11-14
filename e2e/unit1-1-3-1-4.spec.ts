import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_13 = '/class-11/unit-1/1-3-properties-of-matter-and-measurement'
const SECTION_14 = '/class-11/unit-1/1-4-uncertainty-in-measurement'
const SCREEN_DIR = path.join('test-results', 'screens')

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, scrollyIndex: number, stepIndex: number) {
  await page
    .locator('[data-animation]')
    .nth(scrollyIndex)
    .locator('[data-scrolly-step]')
    .nth(stepIndex)
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
}

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

const SCENES_13 = [
  { animation: 'mass-weight', steps: 3, testId: 'mass-weight' },
  { animation: 'thermometer-trio', steps: 4, testId: 'thermometer-trio' },
] as const

const SCENES_14 = [
  { animation: 'precision-accuracy', steps: 4, testId: 'precision-accuracy' },
  { animation: 'unit-factors', steps: 4, testId: 'unit-factors' },
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 1.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('every Scrolly Step renders with no console errors', async ({ page }) => {
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_13)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Properties of Matter and their Measurement'
      )
      await waitForScrolly(page)
      // A KaTeX failure (for example, \ce{} not registered) renders as red error text.
      await expect(page.locator('.katex-error')).toHaveCount(0)
      await expect(page.locator('.katex').filter({ hasText: 'CH' }).first()).toBeVisible()

      for (const [sceneIndex, scene] of SCENES_13.entries()) {
        for (let i = 0; i < scene.steps; i++) {
          await gotoStep(page, sceneIndex, i)
          await page.waitForTimeout(1200)
          await expect(page.getByTestId(scene.testId)).toHaveAttribute('data-step', String(i))
          const visual = page.locator('[data-testid="scrolly-visual"]').nth(sceneIndex)
          await visual.screenshot({
            path: path.join(SCREEN_DIR, `u1-1-3-${scene.animation}-step${i}-${scheme}.png`),
          })
        }
      }

      expect(errors).toEqual([])
    })
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 1.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('Scrolly Steps and the sigfig-ruler simulation render with no console errors', async ({ page }) => {
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_14)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Uncertainty in Measurement')
      await waitForScrolly(page)
      await expect(page.locator('.katex-error')).toHaveCount(0)

      for (const [sceneIndex, scene] of SCENES_14.entries()) {
        for (let i = 0; i < scene.steps; i++) {
          await gotoStep(page, sceneIndex, i)
          await page.waitForTimeout(1200)
          await expect(page.getByTestId(scene.testId)).toHaveAttribute('data-step', String(i))
          const visual = page.locator('[data-testid="scrolly-visual"]').nth(sceneIndex)
          await visual.screenshot({
            path: path.join(SCREEN_DIR, `u1-1-4-${scene.animation}-step${i}-${scheme}.png`),
          })
        }
      }

      // Simulation: default state, then a changed state.
      const sim = page.getByTestId('sigfig-ruler')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toHaveAttribute('data-state', 'empty')
      await page.locator("[data-simulation=\"sigfig-ruler\"]").screenshot({ path: path.join(SCREEN_DIR, `u1-1-4-sigfig-ruler-default-${scheme}.png`) })

      // Reveal the true reading, then type it: it must count as an estimated reading.
      await page.getByRole('button', { name: 'Show the reading' }).click()
      const revealText = await page.getByTestId('reveal').innerText()
      const match = /is\s+([\d.]+)\s+mm/.exec(revealText)
      expect(match, `reveal text: ${revealText}`).not.toBeNull()
      const expected = match![1]

      const field = page.getByLabel('Your reading (mm)')
      await field.fill('47')
      await expect(sim).toHaveAttribute('data-state', 'no-estimate')
      await expect(page.getByTestId('sig-figs')).toHaveText('2')

      await field.fill(expected)
      await expect(sim).toHaveAttribute('data-state', 'estimated')
      await expect(page.getByTestId('sig-figs')).toHaveText('3')
      await expect(page.getByTestId('within-half-division')).toHaveText('Yes')

      await page.getByRole('radiogroup', { name: 'Instrument' }).getByRole('radio', { name: 'Cylinder' }).click()
      await expect(sim).toHaveAttribute('data-instrument', 'cylinder')
      await page.getByRole('radiogroup', { name: 'Zoom' }).getByRole('radio', { name: '4×' }).click()
      // Two decimal places are finer than a 1 mL division: the sim should say so.
      await page.getByLabel('Your reading (mL)').fill('16.45')
      await expect(sim).toHaveAttribute('data-state', 'too-fine')
      await expect(page.getByTestId('digits-beyond')).toBeVisible()
      await page
        .locator("[data-simulation=\"sigfig-ruler\"]")
        .screenshot({ path: path.join(SCREEN_DIR, `u1-1-4-sigfig-ruler-changed-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
