import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-4/4-4-vsepr-theory'
const SCREEN_DIR = path.join('test-results', 'screens')
const SIM = '[data-simulation="vsepr-builder"]'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, animation: string, index: number) {
  await page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index).evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
}

/** Waits until the WebGL canvas of the simulation has drawn at least one frame. */
async function waitForStage(page: Page) {
  const stage = page.locator(`${SIM} [data-testid="stage3d"]`)
  await stage.scrollIntoViewIfNeeded()
  await expect(stage).toHaveAttribute('data-support', 'webgl')
  const canvas = stage.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect
    .poll(() =>
      canvas.evaluate((el) => {
        const c = el as HTMLCanvasElement
        return c.width > 0 && c.height > 0
      })
    )
    .toBe(true)
  return stage
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`4.4 VSEPR theory (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('steps through the repulsion Scrolly with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'VSEPR Theory: Predicting the Shape of Molecules'
      )
      await waitForScrolly(page, 'vsepr-repulsion')
      await expect(page.locator('[data-animation="vsepr-repulsion"] [data-scrolly-step]')).toHaveCount(6)

      const names = ['bunched', 'tetrahedral', 'linear', 'trigonal', 'bipyramidal', 'octahedral']
      for (let i = 0; i < names.length; i++) {
        await gotoStep(page, 'vsepr-repulsion', i)
        await page.waitForTimeout(1200)
        await expect(page.locator('[data-testid="vsepr-repulsion"]')).toHaveAttribute('data-step', String(i))
        await page.screenshot({ path: path.join(SCREEN_DIR, `u4-4-4-repulsion-${i}-${names[i]}-${scheme}.png`) })
      }

      expect(errors).toEqual([])
    })

    test('steps through the lone-pair Scrolly with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await waitForScrolly(page, 'vsepr-lone-pairs')
      await expect(page.locator('[data-animation="vsepr-lone-pairs"] [data-scrolly-step]')).toHaveCount(4)

      const names = ['ch4', 'nh3', 'nh3-squeezed', 'h2o']
      for (let i = 0; i < names.length; i++) {
        await gotoStep(page, 'vsepr-lone-pairs', i)
        await page.waitForTimeout(1200)
        await expect(page.locator('[data-testid="vsepr-lone-pairs"]')).toHaveAttribute('data-step', String(i))
        await page.screenshot({ path: path.join(SCREEN_DIR, `u4-4-4-lone-pairs-${i}-${names[i]}-${scheme}.png`) })
      }

      expect(errors).toEqual([])
    })

    test('builds shapes in the VSEPR builder with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await page.evaluate(() => document.fonts.ready)
      const sim = page.locator(SIM)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByRole('heading', { level: 3 })).toBeVisible()
      await waitForStage(page)
      await page.waitForTimeout(1000)

      // Default state: AX4 (tetrahedral).
      const readout = sim.getByTestId('vsepr-readout')
      await expect(readout).toContainText('AX₄')
      await expect(readout).toContainText('Tetrahedral')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-4-sim-default-${scheme}.png`) })

      // Changed state: remove a bonding pair, then add a lone pair, giving AX3E (NH3).
      await sim.getByRole('button', { name: 'Remove one bonding pair' }).click()
      await sim.getByRole('button', { name: 'Add one lone pair' }).click()
      await expect(readout).toContainText('AX₃E')
      await expect(readout).toContainText('Trigonal pyramidal')

      // Squeeze the bond angle to the value NCERT reports (107°).
      await sim.getByRole('switch', { name: 'Squeeze the bond angle' }).click()
      await expect(readout).toContainText('107°')
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-4-sim-changed-${scheme}.png`) })

      // Shapes the readout must name, from the lone-pair row: H2O reads AX2E2, bent, at 104.5°.
      await sim.getByRole('button', { name: 'Remove one bonding pair' }).click()
      await sim.getByRole('button', { name: 'Add one lone pair' }).click()
      await expect(readout).toContainText('AX₂E₂')
      await expect(readout).toContainText('Bent')
      await expect(readout).toContainText('H₂O')
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-4-sim-h2o-${scheme}.png`) })

      // The Learner cannot leave the NCERT classes: AX2E2 has no add-a-lone-pair move.
      await expect(sim.getByRole('button', { name: 'Add one lone pair' })).toBeDisabled()

      expect(errors).toEqual([])
    })
  })
}
