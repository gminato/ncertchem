import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-8/8-5-nomenclature-alkanes'
const ANIMATION = 'alkane-naming'
const SIM = '[data-simulation="alkane-namer"]'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the visual to settle. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(
    page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-testid="naming-visual"]`)).toHaveAttribute('data-step', String(index))
  await page.waitForTimeout(500)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('every Scrolly Step and the alkane namer render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nomenclature: Trivial Names and IUPAC Names of Alkanes')

      // The naming Scrolly: five Steps, each with its own state.
      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(5)
      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-naming-step${i}-${scheme}.png`) })
      }
      await gotoStep(page, 4)
      await expect(page.getByTestId('naming-caption')).toHaveText('3-ethyl-2-methylheptane')
      await gotoStep(page, 2)
      await expect(page.getByTestId('naming-caption')).toContainText('From this end 2,3; from the other end 5,6')

      // The alkane namer: the default molecule, then the numbering walk, a preset and the quizzes.
      const sim = page.locator(SIM)
      await sim.scrollIntoViewIfNeeded()
      await sim.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await expect(sim.getByTestId('alkane-name')).toHaveText('3-ethyl-2-methylheptane')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-namer-default-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Number the chain' }).click()
      await expect(sim.getByTestId('alkane-summary')).toContainText('Parent chain of 7 carbons, locants 2, 3')
      await page.waitForTimeout(3800)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-namer-numbered-${scheme}.png`) })

      await sim.getByRole('button', { name: '2,4,6-trimethylheptane', exact: true }).click()
      await expect(sim.getByTestId('alkane-name')).toHaveText('2,4,6-trimethylheptane')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-namer-preset-${scheme}.png`) })

      // Name this: a wrong answer, then the right one
      await sim.getByRole('radio', { name: 'Name this' }).click()
      await expect(sim.getByTestId('name-quiz')).toBeVisible()
      await sim.getByTestId('typed-name').fill('2-methylpentane')
      await sim.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(sim.locator('p[role="status"]')).toContainText('Not quite')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-namer-quiz-wrong-${scheme}.png`) })
      await sim.getByTestId('typed-name').fill('2-methylbutane')
      await sim.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(sim.locator('p[role="status"]')).toContainText('Correct: 2-methylbutane')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-namer-quiz-right-${scheme}.png`) })

      // Draw this: build 2-methylbutane from a backbone and one side chain
      await sim.getByRole('radio', { name: 'Draw this' }).click()
      await expect(sim.getByTestId('draw-quiz')).toBeVisible()
      await sim.getByLabel('Backbone carbons').fill('4')
      await sim.getByRole('button', { name: 'Add side chain' }).click()
      await sim.getByRole('button', { name: 'Check my drawing' }).click()
      await expect(sim.locator('p[role="status"]')).toContainText('Correct: 2-methylbutane')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-namer-draw-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
