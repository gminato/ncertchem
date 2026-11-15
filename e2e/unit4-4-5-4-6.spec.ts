import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_45 = '/class-11/unit-4/4-5-valence-bond-theory'
const SECTION_46 = '/class-11/unit-4/4-6-hybridisation'

/**
 * Where a Step's top sits in the viewport, as a fraction of its height. A 'side' Scrolly moves to
 * the next Step below the screen middle; a 'wide' Scrolly reads Steps as soon as they rise into
 * the band under the visual (about 97% of the height), so its Steps are placed near that line.
 */
const LINE_FRACTION: Record<string, number> = {
  'vbt-h2-curve': 0.9,
}
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then gives the tween time to finish. */
async function gotoStep(page: Page, animation: string, index: number) {
  const fraction = LINE_FRACTION[animation] ?? DEFAULT_FRACTION
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, fraction)
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1400)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u4-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 4, Sections 4.5 and 4.6 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('4.5 page: every Scrolly Step renders with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_45)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Valence Bond Theory')

      // H2 potential energy curve with the overlap diagram
      await waitForScrolly(page, 'vbt-h2-curve')
      await expect(page.locator('[data-animation="vbt-h2-curve"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'vbt-h2-curve', i, '4-5-h2-curve', scheme)
      await gotoStep(page, 'vbt-h2-curve', 2)
      await expect(page.getByTestId('h2-readout').first()).toContainText('74 pm', { timeout: 5000 })
      await expect(page.getByTestId('h2-readout').first()).toContainText('−435.8')

      // σ and π overlap pictures
      await waitForScrolly(page, 'vbt-overlap')
      await expect(page.locator('[data-animation="vbt-overlap"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'vbt-overlap', i, '4-5-overlap', scheme)

      // Ethyne: two π bonds down the C≡C axis
      await waitForScrolly(page, 'vbt-ethyne-pi')
      await expect(page.locator('[data-animation="vbt-ethyne-pi"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'vbt-ethyne-pi', i, '4-5-ethyne-pi', scheme)

      expect(errors).toEqual([])
    })

    test('4.6 page: hybrid geometry Steps, the explorer in each state, no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_46)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hybridisation')

      await waitForScrolly(page, 'vbt-hybrid-geometry')
      await expect(page.locator('[data-animation="vbt-hybrid-geometry"] [data-scrolly-step]')).toHaveCount(6)
      for (let i = 0; i < 6; i++) await shotStep(page, 'vbt-hybrid-geometry', i, '4-6-hybrid-geometry', scheme)

      // Hybrid explorer: default state (CH4, ground state), then ethene at the hybrid stage
      const sim = page.locator('[data-simulation="hybrid-explorer"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByTestId('hybrid-explorer')).toHaveAttribute('data-centre', 'CH4')
      await page.waitForTimeout(800)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-6-explorer-default-${scheme}.png`) })

      await sim.getByTestId('centre-select').selectOption('C2H4')
      await sim.getByRole('radio', { name: 'Hybridisation' }).click()
      await expect(sim.getByTestId('hybrid-explorer')).toHaveAttribute('data-stage', 'hybrid')
      await expect(sim.getByTestId('hybrid-readout')).toContainText('sp²')
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-6-explorer-ethene-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Bonds' }).click()
      await expect(sim.getByTestId('hybrid-readout')).toContainText('5 σ and 1 π')
      await page.waitForTimeout(2000)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-6-explorer-ethene-bonds-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 4, Sections 4.5 and 4.6 (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the H2 curve jumps to the minimum without tweening', async ({ page }) => {
    await page.goto(SECTION_45)
    await waitForScrolly(page, 'vbt-h2-curve')
    await gotoStep(page, 'vbt-h2-curve', 2)
    await expect(page.getByTestId('h2-readout').first()).toContainText('74 pm')
  })
})
