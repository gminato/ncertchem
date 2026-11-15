import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_PATH = '/class-11/unit-7/7-3-1-types-of-redox-reactions'
const DEFAULT_FRACTION = 0.4

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
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(600)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u7-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7, Section 7.3.1 (${scheme})`, () => {
    test.use({
      colorScheme: scheme,
      viewport: { width: 1440, height: 900 },
    })

    test('Section 7.3.1 page: Scrolly steps and redox-classifier simulation render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_PATH)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Types of Redox Reactions')

      // Scrolly animation verification & screenshots
      await waitForScrolly(page, 'redox-types')
      const scrollySteps = page.locator('[data-animation="redox-types"] [data-scrolly-step]')
      await expect(scrollySteps).toHaveCount(6)

      for (let i = 0; i < 6; i++) {
        await shotStep(page, 'redox-types', i, '7-3-1-types', scheme)
      }

      // Verify step 4 disproportionation step
      await gotoStep(page, 'redox-types', 4)
      await expect(page.getByTestId('redox-types')).toHaveAttribute('data-step', '4')

      // Verify step 5 fractional paradox step
      await gotoStep(page, 'redox-types', 5)
      await expect(page.getByTestId('redox-types')).toHaveAttribute('data-step', '5')

      // Simulation verification & screenshots
      const sim = page.locator('section[data-simulation="redox-classifier"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('current-equation')).toBeVisible()

      // Default state screenshot
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-1-sim-default-${scheme}.png`) })

      // State 1: Answer Card 1 (2Mg + O2 -> 2MgO is combination)
      await sim.getByTestId('cat-btn-combination').click()
      await expect(sim.getByTestId('verdict-banner')).toContainText('Correct')
      await expect(sim.getByTestId('feedback-section')).toBeVisible()
      await expect(sim.getByTestId('score-display')).toContainText('Score: 1 / 14')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-1-sim-classified-${scheme}.png`) })

      // State 2: Navigate to Card 2 and classify (2KClO3 -> 2KCl + 3O2 is decomposition)
      await sim.getByRole('button', { name: 'Next reaction' }).click()
      await expect(sim.getByTestId('current-equation')).toContainText('2KClO₃')
      await sim.getByTestId('cat-btn-decomposition').click()
      await expect(sim.getByTestId('verdict-banner')).toContainText('Correct')
      await expect(sim.getByTestId('score-display')).toContainText('Score: 2 / 14')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-1-sim-nextcard-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
