import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_53 = '/class-11/unit-5/5-3-measurement-of-du-and-dh'
const SECTION_54 = '/class-11/unit-5/5-4-enthalpy-change-of-a-reaction'

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

const STEP_WAIT_MS = 1100

/**
 * The smallest rendered font size, in CSS px, of the text in an SVG, counting every element with a
 * font-size attribute. The size is the attribute times the CTM scale from user units to the screen,
 * so nested transforms are included.
 */
async function minRenderedFontPx(svg: Locator): Promise<number> {
  return svg.evaluate((root) => {
    const sizes = Array.from(root.querySelectorAll('text[font-size]')).map((el) => {
      const size = Number(el.getAttribute('font-size'))
      const ctm = (el as SVGGraphicsElement).getScreenCTM()
      return ctm ? size * ctm.a : size
    })
    return Math.min(...sizes)
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 5 Sections 5.3 and 5.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('5.3 bomb calorimeter Scrolly, with no console errors', async ({ page }) => {
      test.setTimeout(150_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_53)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Measurement')
      await waitForScrolly(page)

      for (let i = 0; i < 5; i++) {
        await gotoStep(page, 'thermo-bomb', i)
        await page.waitForTimeout(STEP_WAIT_MS)
        await page.screenshot({ path: path.join(SCREEN_DIR, `u5-5-3-bomb-step${i}-${scheme}.png`) })
      }
      await expect(page.locator('[data-animation="thermo-bomb"] [data-testid="bomb-readout"]')).toHaveText(/ΔU = −3133/)
      expect(await minRenderedFontPx(page.locator('[data-animation="thermo-bomb"] svg'))).toBeGreaterThanOrEqual(14)

      expect(errors).toEqual([])
    })

    test('5.4 Hess Scrolly and the Hess builder, with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_54)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Enthalpy Change')
      await waitForScrolly(page)

      for (let i = 0; i < 4; i++) {
        await gotoStep(page, 'thermo-hess', i)
        await page.waitForTimeout(STEP_WAIT_MS)
        await page.screenshot({ path: path.join(SCREEN_DIR, `u5-5-4-hess-step${i}-${scheme}.png`) })
      }

      expect(await minRenderedFontPx(page.locator('[data-animation="thermo-hess"] svg'))).toBeGreaterThanOrEqual(14)

      // The Hess builder: default state (empty route), then puzzle 1 solved by hand.
      const sim = page.locator('[data-simulation="hess-builder"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('hess-builder')).toBeVisible()

      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-4-builder-default-${scheme}.png`) })

      const tiles = sim.getByTestId('hess-equation')
      await tiles.nth(0).click()
      await sim.getByRole('button', { name: 'Add to route' }).click()
      await expect(sim.getByTestId('hess-readout')).toContainText('Species not yet balanced')

      await tiles.nth(1).click()
      await sim.getByRole('button', { name: 'Reverse' }).click()
      await sim.getByRole('button', { name: 'Add to route' }).click()
      await expect(sim.getByTestId('hess-readout')).toContainText('The route gives the target')
      await expect(sim.getByTestId('hess-readout')).toContainText('−283.0')
      expect(await minRenderedFontPx(sim.locator('svg[aria-label^="Enthalpy levels"]'))).toBeGreaterThanOrEqual(13)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-4-builder-solved-${scheme}.png`) })

      // Puzzle 4 (benzene): show the solution and check the readout.
      await sim.getByRole('radio', { name: 'Puzzle 4' }).click()
      await sim.getByRole('button', { name: 'Show solution' }).click()
      await expect(sim.getByTestId('hess-readout')).toContainText('+48.5')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5-4-builder-benzene-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
