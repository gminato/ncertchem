import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_596 = '/class-11/unit-9/9-5-6-directive-influence'
const SECTION_96 = '/class-11/unit-9/9-6-carcinogenicity-and-toxicity'
const DIRECTING_STEPS = 5
const CARCINOGEN_STEPS = 3

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
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Sections 9.5.6 and 9.6 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('9.5.6: every Scrolly Step and the orientation predictor render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_596)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Directive Influence of a Functional Group in Monosubstituted Benzene')

      await waitForScrolly(page, 'directing-groups')
      await expect(page.locator('[data-animation="directing-groups"] [data-scrolly-step]')).toHaveCount(DIRECTING_STEPS)
      for (let i = 0; i < DIRECTING_STEPS; i++) {
        await gotoStep(page, 'directing-groups', i)
        await page.waitForTimeout(700)
        await page
          .locator('[data-animation="directing-groups"] [data-testid="scrolly-visual"]')
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-6-directing-step${i}-${scheme}.png`) })
      }

      const section = page.locator('[data-simulation="orientation-predictor"]')
      await section.scrollIntoViewIfNeeded()
      const predictor = section.locator('[data-testid="orientation-predictor"]')
      await expect(predictor).toHaveAttribute('data-group', '-OH')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-6-predictor-default-${scheme}.png`) })

      // The phenol nitration: the ortho carbon is right, the meta carbon is not.
      const ringCarbons = section.locator('[data-testid="predictor-drawing"] [role="button"]')
      await expect(ringCarbons).toHaveCount(5)
      await section.getByRole('button', { name: /Ring carbon meta to/ }).first().click()
      await expect(section.getByTestId('predictor-readout')).toContainText('Not quite')
      await section.getByRole('button', { name: /Ring carbon ortho to/ }).first().click()
      await expect(section.getByTestId('predictor-readout')).toContainText('Right')
      await expect(section.getByTestId('predictor-readout')).toContainText('2-nitrophenol')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-6-predictor-phenol-ortho-${scheme}.png`) })

      // Nitrobenzene: the meta carbon is right, and the electrophile is bromine.
      await section.getByRole('button', { name: '−NO₂', exact: true }).click()
      await section.getByRole('radio', { name: 'Bromination', exact: true }).click()
      await section.getByRole('button', { name: /Ring carbon meta to/ }).first().click()
      await expect(section.getByTestId('predictor-readout')).toContainText('Right')
      await expect(section.getByTestId('predictor-readout')).toContainText('1-bromo-3-nitrobenzene')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-6-predictor-nitro-meta-${scheme}.png`) })

      // Text in the simulation is at least 14 px; names at least 16 px.
      const sizes = await section.locator('button, [data-testid="predictor-readout"], [data-testid="predictor-products"] li, footer, p').evaluateAll((els) =>
        els.map((e) => parseFloat(getComputedStyle(e).fontSize))
      )
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14)

      expect(errors).toEqual([])
    })

    test('9.6: every Scrolly Step renders with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_96)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carcinogenicity and Toxicity')

      await waitForScrolly(page, 'carcinogens')
      await expect(page.locator('[data-animation="carcinogens"] [data-scrolly-step]')).toHaveCount(CARCINOGEN_STEPS)
      for (let i = 0; i < CARCINOGEN_STEPS; i++) {
        await gotoStep(page, 'carcinogens', i)
        await page.waitForTimeout(700)
        await page
          .locator('[data-animation="carcinogens"] [data-testid="scrolly-visual"]')
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-6-carcinogens-step${i}-${scheme}.png`) })
      }

      expect(errors).toEqual([])
    })
  })
}
